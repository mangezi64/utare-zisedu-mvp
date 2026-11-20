#!/usr/bin/env python3
"""
UTARE ZEM AI — Local Visual & Readability Render Audit

Renders key application views in headless Chrome across desktop/mobile viewports
and accessibility font-size modes (normal, large, xl), captures screenshots, and
verifies:
  1. Non-empty page render (no blank/crashed views)
  2. Zero horizontal overflow (scrollWidth <= innerWidth + 2)
  3. Minimum readable font size (>= 11px for visible text/controls)
  4. WCAG 2.1 AA contrast ratios (>= 4.5:1 normal, >= 3.0:1 large text)
  5. Unclipped buttons/nav controls

Usage:
  python3 scripts/visual_render_audit.py
  python3 scripts/visual_render_audit.py --base-url http://localhost:3000 --modes normal,xl
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_ROUTES = [
    ("home", "/"),
    ("how-it-works", "/how-it-works"),
    ("opportunities", "/opportunities"),
    ("skills", "/skills"),
    ("hubs", "/hubs"),
    ("employers", "/employers"),
    ("about", "/about"),
    ("faq", "/faq"),
    ("contact", "/contact"),
    ("login", "/login"),
]

VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900, "mobile": False},
    "mobile": {"width": 390, "height": 844, "mobile": True},
}

FONT_MODES = {
    "normal": [],
    "large": ["font-size-large"],
    "xl": ["font-size-xl"],
}


def find_chrome_binary() -> str:
    env_bin = os.environ.get("CHROME_BIN")
    if env_bin and Path(env_bin).exists():
        return env_bin
    candidates = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        shutil.which("google-chrome") or "",
        shutil.which("chromium") or "",
        shutil.which("chromium-browser") or "",
    ]
    for c in candidates:
        if c and Path(c).exists():
            return c
    raise RuntimeError(
        "Chrome/Chromium binary not found. Set CHROME_BIN or install Google Chrome."
    )


def pick_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return int(s.getsockname()[1])


class SimpleCDPClient:
    """Minimal RFC 6455 WebSocket client for Chrome DevTools Protocol (stdlib only)."""

    def __init__(self, ws_url: str) -> None:
        if not ws_url.startswith("ws://"):
            raise ValueError(f"Unsupported WebSocket URL: {ws_url}")
        rest = ws_url[len("ws://") :]
        host_port, path = rest.split("/", 1)
        path = "/" + path
        host, port_str = host_port.split(":", 1)
        port = int(port_str)

        self.sock = socket.create_connection((host, port), timeout=30)
        key = base64.b64encode(os.urandom(16)).decode("ascii")
        req = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {host_port}\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(req.encode("ascii"))

        buf = b""
        while b"\r\n\r\n" not in buf:
            chunk = self.sock.recv(4096)
            if not chunk:
                raise ConnectionError("WebSocket handshake failed")
            buf += chunk
        header_bytes, self._extra = buf.split(b"\r\n\r\n", 1)
        if b"101 " not in header_bytes:
            raise ConnectionError(f"Unexpected WS response: {header_bytes!r}")

        expected_accept = base64.b64encode(
            hashlib.sha1((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode()).digest()
        ).decode("ascii")
        if expected_accept.encode("ascii") not in header_bytes:
            raise ConnectionError("Invalid Sec-WebSocket-Accept")

        self._msg_id = 0

    def close(self) -> None:
        try:
            self.sock.close()
        except OSError:
            pass

    def _recv_exact(self, n: int) -> bytes:
        out = bytearray()
        if self._extra:
            take = min(n, len(self._extra))
            out.extend(self._extra[:take])
            self._extra = self._extra[take:]
        while len(out) < n:
            chunk = self.sock.recv(n - len(out))
            if not chunk:
                raise ConnectionError("WebSocket closed unexpectedly")
            out.extend(chunk)
        return bytes(out)

    def _send_frame(self, payload: bytes, opcode: int = 0x1) -> None:
        mask = os.urandom(4)
        length = len(payload)
        header = bytearray([0x80 | opcode])
        if length < 126:
            header.append(0x80 | length)
        elif length < 65536:
            header.append(0x80 | 126)
            header.extend(struct.pack("!H", length))
        else:
            header.append(0x80 | 127)
            header.extend(struct.pack("!Q", length))
        header.extend(mask)
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
        self.sock.sendall(bytes(header) + masked)

    def _recv_frame(self) -> tuple[int, bytes]:
        while True:
            b1, b2 = self._recv_exact(2)
            opcode = b1 & 0x0F
            masked = (b2 & 0x80) != 0
            length = b2 & 0x7F
            if length == 126:
                (length,) = struct.unpack("!H", self._recv_exact(2))
            elif length == 127:
                (length,) = struct.unpack("!Q", self._recv_exact(8))
            mask = self._recv_exact(4) if masked else b""
            data = self._recv_exact(length)
            if masked:
                data = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
            if opcode == 0x9:  # ping -> pong
                self._send_frame(data, opcode=0xA)
                continue
            if opcode == 0x8:  # close
                raise ConnectionError("WebSocket closed by remote")
            return opcode, data

    def call(self, method: str, params: dict | None = None) -> dict:
        self._msg_id += 1
        cid = self._msg_id
        msg = json.dumps({"id": cid, "method": method, "params": params or {}}).encode("utf-8")
        self._send_frame(msg, opcode=0x1)
        while True:
            opcode, data = self._recv_frame()
            if opcode != 0x1:
                continue
            parsed = json.loads(data.decode("utf-8"))
            if parsed.get("id") == cid:
                if "error" in parsed:
                    raise RuntimeError(f"CDP error on {method}: {parsed['error']}")
                return parsed.get("result", {})


AUDIT_JS = r"""
(() => {
  const vw = window.innerWidth;
  const sw = document.documentElement.scrollWidth;
  const bodyTextLen = (document.body.innerText || "").trim().length;

  function parseRgba(str) {
    if (!str || str === "transparent") return [0, 0, 0, 0];
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(",").map((p) => parseFloat(p.trim()));
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  }

  function blend(fg, bg) {
    const a = fg[3];
    if (a >= 0.999) return [fg[0], fg[1], fg[2], 1];
    return [
      fg[0] * a + bg[0] * (1 - a),
      fg[1] * a + bg[1] * (1 - a),
      fg[2] * a + bg[2] * (1 - a),
      1,
    ];
  }

  function effectiveBg(el) {
    const chain = [];
    let cur = el;
    while (cur && cur.nodeType === 1) {
      const bg = parseRgba(getComputedStyle(cur).backgroundColor);
      if (bg && bg[3] > 0.01) chain.push(bg);
      cur = cur.parentElement;
    }
    let acc = [255, 255, 255, 1];
    for (let i = chain.length - 1; i >= 0; i--) {
      acc = blend(chain[i], acc);
    }
    return acc;
  }

  function relLum(rgb) {
    const c = rgb.slice(0, 3).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  function contrastRatio(fg, bg) {
    const l1 = relLum(fg);
    const l2 = relLum(bg);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function isVisible(el) {
    const st = getComputedStyle(el);
    if (st.display === "none" || st.visibility === "hidden" || parseFloat(st.opacity) < 0.05) {
      return false;
    }
    if (el.classList.contains("sr-only")) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1;
  }

  const smallFonts = [];
  const lowContrast = [];
  const clippedControls = [];

  const textEls = document.querySelectorAll("h1, h2, h3, p, li, a, button, label");
  for (const el of textEls) {
    if (!isVisible(el)) continue;
    const text = (el.innerText || "").trim().replace(/\s+/g, " ");
    if (!text) continue;
    // Skip micro map pins / step dots
    if (el.closest(".map-center-overlay") || el.classList.contains("step-dot")) continue;

    const st = getComputedStyle(el);
    const fs = parseFloat(st.fontSize);
    const fw = parseFloat(st.fontWeight) || 400;

    if (fs < 11) {
      smallFonts.push({
        tag: el.tagName.toLowerCase(),
        fontSize: Math.round(fs * 10) / 10,
        sample: text.slice(0, 50),
      });
    }

    const fgRaw = parseRgba(st.color);
    if (fgRaw && fgRaw[3] > 0.1) {
      const bg = effectiveBg(el);
      const fg = blend(fgRaw, bg);
      const ratio = contrastRatio(fg, bg);
      const isLarge = fs >= 24 || (fs >= 18.66 && fw >= 700);
      const minRatio = isLarge ? 3.0 : 4.5;
      if (ratio < minRatio) {
        lowContrast.push({
          tag: el.tagName.toLowerCase(),
          ratio: Math.round(ratio * 100) / 100,
          minRequired: minRatio,
          fontSize: Math.round(fs * 10) / 10,
          color: st.color,
          sample: text.slice(0, 50),
        });
      }
    }
  }

  const controlEls = document.querySelectorAll(".button, .signin-link, .main-nav a");
  for (const el of controlEls) {
    if (!isVisible(el)) continue;
    const st = getComputedStyle(el);
    if (st.overflow === "hidden" && el.scrollHeight > el.clientHeight + 6) {
      clippedControls.push({
        tag: el.tagName.toLowerCase(),
        sample: (el.innerText || "").trim().slice(0, 40),
      });
    }
  }
  const nav = document.querySelector(".main-nav");
  if (nav && isVisible(nav) && nav.scrollWidth > nav.clientWidth + 4) {
    clippedControls.push({
      tag: "nav.main-nav",
      sample: `scrollWidth(${nav.scrollWidth}) > clientWidth(${nav.clientWidth})`,
    });
  }

  return {
    innerWidth: vw,
    scrollWidth: sw,
    hasHorizontalOverflow: sw > vw + 2,
    bodyTextLen,
    smallFonts: smallFonts.slice(0, 10),
    smallFontCount: smallFonts.length,
    lowContrast: lowContrast.slice(0, 10),
    lowContrastCount: lowContrast.length,
    clippedControls: clippedControls.slice(0, 10),
    clippedCount: clippedControls.length,
  };
})()
"""


def wait_for_server(base_url: str, timeout_s: float = 15.0) -> None:
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(base_url, timeout=3) as resp:
                if resp.status < 500:
                    return
        except Exception:
            time.sleep(0.5)
    raise RuntimeError(
        f"Server at {base_url} is not reachable. Start it with `docker compose up -d` or `npm run dev`."
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="UTARE Visual & Readability Render Audit")
    parser.add_argument(
        "--base-url",
        default=os.environ.get("VISUAL_AUDIT_URL", "http://localhost:3000"),
        help="Running app URL (default: http://localhost:3000)",
    )
    parser.add_argument(
        "--out-dir",
        default=".visual-audit",
        help="Output directory for screenshots and reports (default: .visual-audit)",
    )
    parser.add_argument(
        "--modes",
        default="normal,large,xl",
        help="Comma-separated font modes: normal,large,xl",
    )
    parser.add_argument(
        "--viewports",
        default="desktop,mobile",
        help="Comma-separated viewports: desktop,mobile",
    )
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    modes = [m.strip() for m in args.modes.split(",") if m.strip() in FONT_MODES]
    viewports = [v.strip() for v in args.viewports.split(",") if v.strip() in VIEWPORTS]

    wait_for_server(base_url)
    chrome_bin = find_chrome_binary()

    out_dir = Path(args.out_dir)
    shot_dir = out_dir / "screenshots"
    shot_dir.mkdir(parents=True, exist_ok=True)

    cdp_port = pick_free_port()
    user_data_dir = tempfile.mkdtemp(prefix="utare-chrome-audit-")
    chrome_proc = subprocess.Popen(
        [
            chrome_bin,
            "--headless=new",
            f"--remote-debugging-port={cdp_port}",
            f"--user-data-dir={user_data_dir}",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-gpu",
            "--hide-scrollbars",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    results = []
    failures = 0
    contrast_warnings = 0

    try:
        ws_url = None
        for _ in range(40):
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{cdp_port}/json/list", timeout=2) as r:
                    targets = json.loads(r.read().decode("utf-8"))
                    page_targets = [t for t in targets if t.get("type") == "page"]
                    if page_targets:
                        ws_url = page_targets[0]["webSocketDebuggerUrl"]
                        break
            except Exception:
                time.sleep(0.25)

        if not ws_url:
            raise RuntimeError("Could not connect to headless Chrome CDP target.")

        cdp = SimpleCDPClient(ws_url)
        cdp.call("Page.enable")
        cdp.call("Runtime.enable")

        for route_name, route_path in DEFAULT_ROUTES:
            url = f"{base_url}{route_path}"
            for vp_name in viewports:
                vp = VIEWPORTS[vp_name]
                cdp.call(
                    "Emulation.setDeviceMetricsOverride",
                    {
                        "width": vp["width"],
                        "height": vp["height"],
                        "deviceScaleFactor": 1,
                        "mobile": vp["mobile"],
                    },
                )
                cdp.call("Page.navigate", {"url": url})
                time.sleep(0.9)

                for mode in modes:
                    classes = FONT_MODES[mode]
                    cdp.call(
                        "Runtime.evaluate",
                        {
                            "expression": (
                                "document.documentElement.classList.remove('font-size-large','font-size-xl');"
                                + "".join(
                                    f"document.documentElement.classList.add('{c}');"
                                    for c in classes
                                )
                            )
                        },
                    )
                    time.sleep(0.25)

                    eval_res = cdp.call(
                        "Runtime.evaluate",
                        {"expression": AUDIT_JS, "returnByValue": True},
                    )
                    metrics = eval_res.get("result", {}).get("value", {})

                    shot_file = shot_dir / f"{route_name}__{vp_name}__{mode}.png"
                    shot_res = cdp.call("Page.captureScreenshot", {"format": "png"})
                    shot_file.write_bytes(base64.b64decode(shot_res["data"]))

                    has_fail = (
                        metrics.get("bodyTextLen", 0) < 50
                        or metrics.get("hasHorizontalOverflow", False)
                        or metrics.get("smallFontCount", 0) > 0
                        or metrics.get("clippedCount", 0) > 0
                    )
                    if has_fail:
                        failures += 1
                    contrast_warnings += metrics.get("lowContrastCount", 0)

                    status = "FAIL" if has_fail else "PASS"
                    print(
                        f"[{status}] {route_path:<15} {vp_name:<7} {mode:<6} | "
                        f"overflow={metrics.get('hasHorizontalOverflow')} "
                        f"smallFont={metrics.get('smallFontCount')} "
                        f"lowContrast={metrics.get('lowContrastCount')} "
                        f"clipped={metrics.get('clippedCount')}"
                    )

                    results.append(
                        {
                            "route": route_path,
                            "name": route_name,
                            "viewport": vp_name,
                            "mode": mode,
                            "status": status,
                            "screenshot": str(shot_file),
                            "metrics": metrics,
                        }
                    )

        cdp.close()
    finally:
        chrome_proc.terminate()
        try:
            chrome_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            chrome_proc.kill()
        shutil.rmtree(user_data_dir, ignore_errors=True)

    summary = {
        "baseUrl": base_url,
        "totalChecks": len(results),
        "failures": failures,
        "contrastWarnings": contrast_warnings,
        "results": results,
    }
    (out_dir / "report.json").write_text(json.dumps(summary, indent=2))

    md_lines = [
        "# UTARE Visual & Readability Render Audit",
        "",
        f"- **Base URL:** `{base_url}`",
        f"- **Total Renders Checked:** {len(results)}",
        f"- **Layout/Font/Clip Failures:** {failures}",
        f"- **Low-Contrast Elements Detected:** {contrast_warnings}",
        "",
        "| Route | Viewport | Font Mode | Status | Overflow | Small Text (<11px) | Low Contrast | Clipped | Screenshot |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    for r in results:
        m = r["metrics"]
        md_lines.append(
            f"| `{r['route']}` | {r['viewport']} | {r['mode']} | **{r['status']}** | "
            f"{'YES' if m.get('hasHorizontalOverflow') else 'No'} | "
            f"{m.get('smallFontCount', 0)} | {m.get('lowContrastCount', 0)} | "
            f"{m.get('clippedCount', 0)} | `{r['screenshot']}` |"
        )
    (out_dir / "report.md").write_text("\n".join(md_lines) + "\n")

    print(f"\nReport written to {out_dir / 'report.md'} and {out_dir / 'report.json'}")
    print(f"Screenshots saved in {shot_dir}/")
    return 1 if failures > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
