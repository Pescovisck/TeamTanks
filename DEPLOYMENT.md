# TeamTanks Web — Deployment Guide

This guide details how to deploy **TeamTanks Web** to production on **Vercel** or **Cloudflare Pages**.

---

## 1. Quick Project Specifications

- **Framework:** Vite 8 + React 19 + Tailwind CSS v4
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Node.js Version:** `20.x` or `22.x`
- **Networking:** PeerJS (WebRTC serverless P2P matchmaking over HTTPS)
- **Asset Size:** ~7.7 MB (all 66 original W3D meshes, sounds, and textures in `public/tt/`)

---

## 2. Option A: Deploy to Vercel (Recommended for Speed & Git Sync)

### Method 1: Via Vercel Web Dashboard (Automated CI/CD)

1. Go to [https://vercel.com/new](https://vercel.com/new) and log in.
2. Select your GitHub repository: **`Pescovisck/TeamTanks`**.
3. Configure Project Settings:
   - **Framework Preset:** `Vite` (automatically detected).
   - **Root Directory:** `./`
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `dist` (default).
4. Click **Deploy**.
5. Once finished, Vercel gives you a live production URL (e.g., `https://teamtanks.vercel.app`) with automatic HTTPS and instant preview deployments on every Git push.

> [!NOTE]
> The included [vercel.json](file:///d:/Projects/TeamTanks/TeamTanksWeb/vercel.json) automatically configures the Vite framework preset, output directory, and SPA routing rewrite.

---

### Method 2: Via Vercel CLI (Direct Terminal Deploy)

1. Open PowerShell or Command Prompt in `TeamTanksWeb`:
   ```powershell
   npx vercel
   ```
2. Follow the interactive prompts:
   - Link to existing project? `No`
   - Project name: `teamtanks`
   - In which directory is your code located? `./`
3. To deploy directly to production:
   ```powershell
   npx vercel --prod
   ```

---

## 3. Option B: Deploy to Cloudflare Pages (Recommended for Unlimited Free Bandwidth & Edge Speed)

### Method 1: Via Cloudflare Dashboard (Automated Git Integration)

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select your GitHub repository **`Pescovisck/TeamTanks`**.
3. In **Set up builds and deployments**:
   - **Project name:** `teamtanks`
   - **Production branch:** `main`
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Under **Environment variables (advanced)**, add:
   - `NODE_VERSION`: `20`
5. Click **Save and Deploy**.
6. Cloudflare will build the site and provide a custom URL (e.g. `https://teamtanks.pages.dev`).

---

### Method 2: Via Cloudflare Wrangler CLI (Direct Deploy)

1. Build the production bundle locally:
   ```powershell
   npm run build
   ```
2. Deploy the `dist` folder to Cloudflare Pages:
   ```powershell
   npx wrangler pages deploy dist --project-name=teamtanks
   ```
3. If not already logged in, Wrangler will open a browser window to authenticate with your Cloudflare account.

---

## 4. Production Checklist & P2P Multiplayer Notes

1. **HTTPS Requirement for WebRTC:**
   - Both Vercel and Cloudflare Pages automatically provision free SSL certificates (HTTPS).
   - HTTPS is **mandatory** for WebRTC (PeerJS) connections between players and for modern browser audio/gamepad contexts.
2. **Multiplayer Rooms:**
   - Players on any browser tab or distinct devices can enter the same **P2P Room Code** (e.g., `room1` or `alpha`) in the deployment menu to play together via WebRTC DataChannels.
3. **Local Production Test (Pre-flight):**
   - You can test the exact production build locally at any time:
     ```powershell
     npm run build
     npm run preview
     ```
   - Opens on `http://localhost:4173` to test before deploying.
