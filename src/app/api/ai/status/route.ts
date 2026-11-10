import { NextRequest, NextResponse } from "next/server";
import { getGeminiConfig, pingGemini } from "@/lib/gemini/client";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const verifyLive = req.nextUrl.searchParams.get("ping") === "1";
  if (verifyLive) {
    const status = await pingGemini();
    return NextResponse.json(status);
  }
  const cfg = getGeminiConfig();
  return NextResponse.json({
    enabled: cfg.enabled,
    model: cfg.model,
    ok: cfg.enabled,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const model =
      typeof body.model === "string" && body.model.trim()
        ? body.model.trim()
        : "gemini-2.5-flash";

    // Update current server process environment immediately so live calls work without restarting
    if (apiKey) {
      process.env.GEMINI_API_KEY = apiKey;
    } else if (body.clearKey === true) {
      process.env.GEMINI_API_KEY = "";
    }
    process.env.GEMINI_MODEL = model;

    // Also persist to .env.local if writable
    try {
      const envPath = path.join(process.cwd(), ".env.local");
      let content = fs.existsSync(envPath)
        ? fs.readFileSync(envPath, "utf-8")
        : "";

      const setEnvLine = (key: string, val: string) => {
        const regex = new RegExp(`^${key}=.*$`, "m");
        if (regex.test(content)) {
          content = content.replace(regex, `${key}="${val}"`);
        } else {
          content += `\n${key}="${val}"\n`;
        }
      };

      if (apiKey || body.clearKey === true) {
        setEnvLine("GEMINI_API_KEY", apiKey);
      }
      setEnvLine("GEMINI_MODEL", model);
      fs.writeFileSync(envPath, content, "utf-8");
    } catch (err) {
      console.warn("[API /api/ai/status] Non-fatal .env.local write warning:", err);
    }

    const status = await pingGemini();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        enabled: false,
        ok: false,
        error: error instanceof Error ? error.message : "Failed to update AI settings",
      },
      { status: 500 }
    );
  }
}
