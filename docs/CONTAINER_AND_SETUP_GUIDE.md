# Container & Setup Guide (Docker Compose & Dev Containers)

This guide explains how every member of the **UTARE ZIMEDU AI** team can run the application with an identical environment—regardless of whether you use **macOS**, **Windows**, or **Linux**.

---

## 1. Why We Use a Containerized Setup

1. **Identical Node.js Runtime:** Every teammate runs `node:20-alpine` inside the container—eliminating *"it works on my machine"* errors caused by different Node or npm versions.
2. **Isolated Binary Dependencies:** `docker-compose.yml` mounts your source files (`src/`) into `/app` for instant hot-reloading, while storing `/app/node_modules` and `/app/.next` inside isolated Docker volumes (`utare_node_modules` and `utare_next_cache`). This prevents macOS/Windows host files from clashing with Linux container binaries.
3. **Zero-Blocker Fallback Mode:** Even before you configure a live `GEMINI_API_KEY` or `SUPABASE` URL, the container boots cleanly and serves realistic Zimbabwe survey personas, hubs, coaches, and pathways.

---

## 2. Step-by-Step Setup Instructions

### Step 1: Start Docker Desktop
- **macOS:** Open `Docker.app` from `/Applications` (or Spotlight Search) and wait until the whale icon in the top menu bar says **Docker Desktop is running**.
- **Windows:** Open Docker Desktop (ensure WSL2 backend is enabled).
- **Linux:** Ensure `docker` and `docker compose` services are active (`sudo systemctl start docker`).

### Step 2: Configure Environment Variables
From the root of the repository (`utare-zisedu-mvp/`), create your `.env.local` file:
```bash
cp .env.example .env.local
```

Open `.env.local` in your editor:
- **To test immediately in Demo/Fallback Mode:** Leave the keys blank and proceed to Step 3.
- **To enable Live Gemini AI Generation:** Paste your Google AI Studio key into `GEMINI_API_KEY="AIza..."`.
- **To enable Live Supabase Persistence:** Paste your Supabase Project URL and Anon Key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and run `supabase/schema.sql` in the Supabase SQL Editor.

### Step 3: Build & Start the Container
Run:
```bash
docker compose up --build
```
*(Or on macOS/Linux, run `make up`).*

- First build takes ~45–90 seconds to download `node:20-alpine` and install npm packages.
- Subsequent starts take ~3 seconds.
- Visit **[http://localhost:3000](http://localhost:3000)**.

---

## 3. Everyday Container Commands

| Task | Docker Compose Command | Makefile Shortcut |
| :--- | :--- | :--- |
| **Start app (with build check)** | `docker compose up --build` | `make up` |
| **Start app in background** | `docker compose up -d` | — |
| **Stop app** | `docker compose down` | `make down` |
| **View live logs** | `docker compose logs -f web` | `make logs` |
| **Open terminal inside container** | `docker compose exec web bash` | `make shell` |
| **Install a new npm package** | `docker compose exec web npm install <pkg>` | — |
| **Wipe cache & rebuild fresh** | `docker compose down -v && docker compose up --build` | `make clean && make up` |

---

## 4. Using VS Code / Cursor "Dev Containers" (Optional 1-Click Mode)

We have included `.devcontainer/devcontainer.json`.
1. Install the **Dev Containers** extension in VS Code or Cursor.
2. Open the `utare-zisedu-mvp` folder.
3. Click **"Reopen in Container"** when prompted (or press `Cmd+Shift+P` / `Ctrl+Shift+P` → `Dev Containers: Reopen in Container`).
4. Your editor terminal, TypeScript compiler, Tailwind CSS IntelliSense, and ESLint will all run directly inside the container.

---

## 5. Troubleshooting Common Issues

- **`failed to connect to the docker API at unix:///.../docker.sock`**
  - **Cause:** Docker Desktop is not running yet.
  - **Fix:** Launch the Docker Desktop application and wait ~15 seconds for the engine to start.
- **Port `3000` is already in use:**
  - **Fix:** Stop any other local dev server running on port 3000, or edit `ports: - "3001:3000"` in `docker-compose.yml`.
- **Added a new dependency in `package.json` and container says module not found:**
  - **Fix:** Run `docker compose down -v && docker compose up --build` (or `make clean && make up`) to refresh the `utare_node_modules` volume.
