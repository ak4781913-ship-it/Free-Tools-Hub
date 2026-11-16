# Hostinger Node.js Production & GitHub Deployment Guide

Complete step-by-step instructions for deploying **FreeTools Hub (NEXORA)** on **Hostinger Node.js Web App Hosting** with automatic GitHub CI/CD deployments, full SSR/prerendered SEO routing, `/api/analyze-seo`, PWA offline caching, and Firebase Google Authentication + Firestore sync.

---

## Target Hostinger Configuration Summary

| Setting | Required Value |
| :--- | :--- |
| **Framework Preset** | Vite / React with Express backend (Node.js Web App) |
| **Repository Root** | `/` (project root) |
| **Node.js Version** | `22` (matches `.nvmrc` and `package.json` `engines.node`) |
| **Package Manager** | `npm` (`package-lock.json` included; Bun remains supported locally) |
| **Install Command** | `npm install` (or `npm ci`) |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Production Entry File** | `server.js` (compiled from `server.ts` during `npm run build`) |
| **Static Build Output** | `dist/` (served automatically by Express in `server.js`) |

> **Important:** `npm run build` automatically runs:
> 1. `tsx scripts/generateSeoFiles.ts` (`sitemap.xml`, `robots.txt`, `404.html`, `site.webmanifest`)
> 2. `vite build` (React production bundle + Workbox PWA `dist/sw.js`)
> 3. `tsx scripts/prerenderSeo.ts` (35 prerendered SEO HTML pages in `dist/`)
> 4. `esbuild server.ts ... --outfile=server.js` (Node 22 ESM production Express server)

---

## 1. Create a GitHub Repository

1. Sign in to [GitHub](https://github.com) and click **New repository**.
2. Enter a repository name (for example, `freetools-hub`).
3. Choose **Private** or **Public**.
4. Leave **Initialize this repository** unchecked so you can push your existing project cleanly.
5. Click **Create repository**.

---

## 2. Upload This Project to GitHub

Run the following commands from the project root directory (never commit `.env`, `node_modules/`, `dist/`, or compiled `server.js`; `.gitignore` already excludes them):

```bash
# Confirm no secret .env files are tracked
git status

# Initialize git if not already initialized
git init
git branch -M main

# Stage and commit all source files, lockfiles, and Firebase rules
git add .
git commit -m "Prepare FreeTools Hub for Hostinger Node.js deployment"

# Push to GitHub
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

---

## 3. Connect GitHub to Hostinger

1. Log in to **Hostinger hPanel**.
2. Open **Websites** -> click **Add website** (or select your existing hosting plan) -> choose **Node.js Web App** (VPS/Cloud/Node.js App Hosting).
3. Under **Deployment source**, select **GitHub** and click **Connect GitHub account**.
4. Authorize Hostinger in the GitHub OAuth popup and grant repository access (all repositories or only your `freetools-hub` repository).

---

## 4. Select Repository and Branch

1. In Hostinger's **Import Git Repository** dialog, pick `<your-username>/<your-repo>`.
2. Set **Branch** to `main`.
3. Set **Root directory** to `/` (default project root).

---

## 5. Select Framework Preset

- Select **Vite / React (Node.js)** or **Express / Custom Node.js Web App**.
- Confirm Hostinger is deploying in **Node.js App mode** (NOT static-only HTML hosting), because Express handles:
  - `/api/analyze-seo` (SSRF-protected HTML analyzer API)
  - Dynamic `/robots.txt` and `/sitemap.xml`
  - Canonical `301` redirects for legacy aliases & trailing slashes
  - Clean `404` status codes with `X-Robots-Tag: noindex, follow`
  - Direct URL serving of all 35 prerendered SEO HTML pages

---

## 6. Select Node.js 22

1. Under **Node.js version**, select **`22.x`** (matching `.nvmrc` -> `22`).
2. Do not use Node 18 or older; `server.js` targets `node22` and relies on built-in `fetch`, `AbortController`, and Web Streams APIs.

---

## 7. Configure npm as Package Manager

1. Select **`npm`** as the package manager in Hostinger build settings.
2. Both `package-lock.json` (for `npm`) and `bun.lock` (for local Bun / Netlify / Cloudflare workflows) are committed in the repository.

---

## 8. Configure the Build Command

Set **Build command** to:

```bash
npm run build
```

> **Critical Note on `NODE_ENV` during Build:** Ensure `NODE_ENV=production` is **not** forced during `npm install` + `npm run build` if your Hostinger environment skips `devDependencies` when `NODE_ENV=production` is set at install time. `tsx`, `esbuild`, `tailwindcss`, `vite-plugin-pwa`, and `typescript` live in `devDependencies` and are needed during `npm run build`. At **runtime** (`npm start`), `server.js` automatically runs in production mode even without `NODE_ENV=production`.

---

## 9. Configure the Production Start Command & Entry File

Set:
- **Start command:** `npm start` (executes `node server.js`)
- **Application entry file:** `server.js`

Express automatically binds to `process.env.PORT` (defaulting to `3000` only if `PORT` is unset) on host `0.0.0.0`, and serves `dist/` without loading Vite dev middleware.

---

## 10. Configure Environment Variables in Hostinger

In **Hostinger hPanel -> Node.js App Settings -> Environment Variables**, add the variables below **before triggering your first production build** (because Vite inlines `VITE_*` variables at build time, while Express reads server variables at runtime).

### Environment Variables Checklist

| Variable Name | Scope | Required? | Purpose & Example Value |
| :--- | :--- | :--- | :--- |
| `VITE_SITE_URL` | **Build + Runtime** | Recommended | Full canonical domain without trailing slash, e.g. `https://yourdomain.com`. Used for `<link rel="canonical">`, `og:url`, `/sitemap.xml`, `/robots.txt`, and prerendered HTML. |
| `VITE_GOOGLE_SITE_VERIFICATION` | **Build + Runtime** | Optional | Search Console HTML meta verification token (token value only, not the full `<meta>` tag). |
| `VITE_CONTACT_EMAIL` | **Build** | Optional | Support email shown in Feedback / Contact dialogs (leave unset to keep local feedback log mode). |
| `VITE_FIREBASE_API_KEY` | **Build** | Recommended | Firebase Web App public `apiKey` (client config, not a secret). |
| `VITE_FIREBASE_AUTH_DOMAIN` | **Build** | Recommended | Firebase Auth domain (e.g. `gothic-episode-jrrhs.firebaseapp.com`). |
| `VITE_FIREBASE_PROJECT_ID` | **Build** | Recommended | Firebase Project ID (e.g. `gothic-episode-jrrhs`). |
| `VITE_FIREBASE_STORAGE_BUCKET` | **Build** | Optional | Firebase Storage bucket (e.g. `gothic-episode-jrrhs.firebasestorage.app`). |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | **Build** | Recommended | Firebase Cloud Messaging sender ID (e.g. `520554932092`). |
| `VITE_FIREBASE_APP_ID` | **Build** | Recommended | Firebase Web App ID (e.g. `1:520554932092:web:...`). |
| `VITE_FIREBASE_DATABASE_ID` | **Build** | Recommended | Named Firestore database ID if not using `(default)` (e.g. `ai-studio-freetoolshub-b88be027-7c91-4df2-b7a8-ec31b2d0735a`). |
| `APP_URL` | **Runtime** | Optional | Server-side public URL fallback if `VITE_SITE_URL` is unset at runtime. |
| `GEMINI_API_KEY` | **Runtime (Server-Only)** | Optional | Optional server-side Gemini API key (leave empty if unused). **Never** prefix with `VITE_`. |

> **Firebase Fallback Behavior:** If `VITE_FIREBASE_*` variables are left empty, the app automatically falls back to `firebase-applet-config.json` (project `gothic-episode-jrrhs`). Whenever you specify `VITE_FIREBASE_PROJECT_ID` for a *different* Firebase project, provide all matching `VITE_FIREBASE_*` keys for that project so IDs never mix across projects.

---

## 11. Configure Your Production Domain & SSL

1. In Hostinger **Domains**, connect your custom domain (or use your temporary `*.hostingersite.com` domain for testing).
2. Enable **Force HTTPS / Free SSL Certificate** in Hostinger hPanel.
3. Update `VITE_SITE_URL` in Hostinger Environment Variables to match your exact primary origin (for example, `https://freetoolshub.com` or `https://www.freetoolshub.com`) and redeploy so canonical tags, `sitemap.xml`, and `robots.txt` align with your live HTTPS domain.
4. Set a single primary canonical host (`www` OR apex non-`www`) with 301 redirect in Hostinger/DNS to avoid duplicate indexing.

---

## 12. Deploy the First Version

1. Save your build/start settings and environment variables in Hostinger.
2. Click **Deploy** (or **Build & Deploy**).
3. Wait for `npm install`, `npm run build`, and `npm start` to complete.
4. Confirm your live homepage loads over HTTPS and check:
   - `https://yourdomain.com/` -> `200 OK`
   - `https://yourdomain.com/tools/pdf-tools-suite` -> `200 OK` (refresh directly to confirm zero 404)
   - `https://yourdomain.com/sitemap.xml` -> XML list of 35 canonical URLs matching `yourdomain.com`
   - `https://yourdomain.com/robots.txt` -> includes `Sitemap: https://yourdomain.com/sitemap.xml`
   - `https://yourdomain.com/this-page-does-not-exist` -> `404 Not Found` with `<meta name="robots" content="noindex, follow" />`

---

## 13. Enable Automatic Deployment

1. In Hostinger **Git / Deployments Settings**, ensure **Auto-deploy on push** is enabled for branch `main`.
2. Any future `git push origin main` will trigger Hostinger to pull commits, reinstall dependencies, run `npm run build`, regenerate `dist/` + `server.js`, and restart the Node 22 server automatically.

---

## 14. Check Deployment & Runtime Logs

- **Build logs:** Open Hostinger hPanel -> **Deployments** -> click the latest build to inspect `npm install`, `generateSeoFiles`, `vite build`, `prerenderSeo`, and `esbuild server.ts` output.
- **Runtime logs:** Open **Application Logs / Output Logs** in Hostinger Node.js settings. A healthy startup logs:
  `FreeTools Hub server running on http://0.0.0.0:<PORT> (production)`

---

## 15. Troubleshoot Failed Builds or Startup Issues

| Symptom | Likely Cause | Fix |
| :--- | :--- | :--- |
| `Cannot find package 'tsx'` / `vite: not found` during `npm run build` | `NODE_ENV=production` skipped `devDependencies` during `npm install` | Remove `NODE_ENV=production` from build-time env vars or run `npm install --include=dev` before `npm run build`. |
| `Application build not found` (HTTP 503) | `dist/` missing when `node server.js` runs | Verify Build Command is `npm run build` and `dist/index.html` exists after build. |
| Server exits immediately with TypeScript syntax error | Hostinger ran `node server.ts` instead of `npm start` / `server.js` | Set Entry File to `server.js` and Start Command to `npm start`. |
| Port binding timeout in Hostinger | Hardcoded port mismatch | Verify `server.ts`/`server.js` uses `process.env.PORT` on `0.0.0.0` (already configured). |
| Canonical URLs still show `freetoolshub1.netlify.app` | `VITE_SITE_URL` was missing during `npm run build` | Set `VITE_SITE_URL=https://yourdomain.com` in Hostinger env vars and trigger a fresh rebuild. |
| `/api/analyze-seo` returns `429` or SSRF errors | Rate limit (`45 req/min/IP`) or private/loopback target URL | Test with a real public `https://` website URL. |

---

## 16. Configure & Test Firebase Google Sign-In + Firestore

When moving from `freetoolshub1.netlify.app` to your Hostinger domain, Google Sign-In will fail with `auth/unauthorized-domain` until the new domain is allowlisted:

1. Open [Firebase Console](https://console.firebase.google.com/) -> select project **`gothic-episode-jrrhs`** (or your own configured `VITE_FIREBASE_PROJECT_ID`).
2. Go to **Authentication -> Settings -> Authorized domains -> Add domain**:
   - Add your Hostinger domain (e.g. `yourdomain.com` and `www.yourdomain.com`, plus `*.hostingersite.com` preview host if testing before custom domain DNS).
3. Go to **Authentication -> Sign-in method -> Google**:
   - Ensure **Google** provider is **Enabled** and a valid **Project support email** is saved.
4. Go to **Google Cloud Console -> APIs & Services -> Credentials -> Web client (auto created by Google Service)**:
   - Confirm **Authorized redirect URIs** includes `https://<VITE_FIREBASE_AUTH_DOMAIN>/__/auth/handler` (e.g., `https://gothic-episode-jrrhs.firebaseapp.com/__/auth/handler`).
   - Confirm **Authorized JavaScript origins** includes `https://yourdomain.com`.
5. Ensure Firestore rules (`firestore.rules`) are deployed to your target Firestore database (`ai-studio-freetoolshub-b88be027-7c91-4df2-b7a8-ec31b2d0735a` or your `VITE_FIREBASE_DATABASE_ID`).
6. Test live on `https://yourdomain.com`:
   - Click **Sign in with Google** in the header.
   - Complete Google login and verify profile photo/name appear, starred favorites persist across page reloads, and Guest Mode + Sign Out work without console errors.

---

## 17. Verify Sitemap, Robots & Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console) and add a **Domain** or **URL prefix** property for `https://yourdomain.com`.
2. If verifying via HTML meta tag:
   - Copy the `content="..."` token from Search Console.
   - Set `VITE_GOOGLE_SITE_VERIFICATION` in Hostinger Environment Variables.
   - Trigger a **Redeploy** so `vite build` & `prerenderSeo.ts` embed the verification tag across all HTML pages.
   - Click **Verify** in Search Console.
3. Submit your sitemap in **Search Console -> Sitemaps**:
   - Enter `sitemap.xml` (full URL: `https://yourdomain.com/sitemap.xml`) and submit.
4. Use **URL Inspection** on `/`, `/tools`, `/tools/pdf-tools-suite`, `/tools/cv-maker`, and `/tools/uae-gratuity-calculator` to confirm **200 OK**, valid canonical URL, and mobile-friendly crawlability.

---

## 18. Update the Application via Future GitHub Commits

For every future code update, new tool, or SEO improvement:

```bash
# 1. Verify types, security rules, and full production build locally
npm run lint
npm run build
npm start

# 2. Commit and push to main
git add .
git commit -m "Describe your update"
git push origin main
```

Hostinger automatically pulls the commit from `main`, runs `npm install && npm run build`, updates `dist/` and `server.js`, and restarts your live application cleanly.
