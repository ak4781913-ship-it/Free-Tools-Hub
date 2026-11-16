# FreeTools Hub (Published by NEXORA)

> Production-ready, privacy-first browser utilities suite featuring **28 core tools** (including a **43-tool PDF Tools Suite**) spanning Career & CV Generation, UAE Financial Calculators, Studio AI Prompt Architects, Developer Utilities, Media Processing, and Everyday Converters.

---

## 🚀 Overview & Architecture

FreeTools Hub is architected with a **unified single codebase** that runs seamlessly across three execution environments:

1. **Local Development & Node Hosting**: High-performance Express server (`server.ts`) hosting Vite in dev mode and serving prerendered static assets in production with route-specific meta injection, dynamic XML sitemaps, trailing-slash canonicalization, and SSRF-hardened proxying.
2. **Netlify Production Deployment**: Static asset hosting with **Netlify Functions v2** (`netlify/functions/analyze-seo.ts`), single-source-of-truth redirects & flat-HTML rewrites in `netlify.toml`, and edge security/cache headers.
3. **Cloudflare Pages Support**: Edge CDN delivery with **Cloudflare Pages Functions** (`functions/api/analyze-seo.ts`) and rules in `wrangler.toml`, `public/_headers`, and `public/_redirects`.

All 28 tools perform calculations, vector PDF rendering, OCR, encryption, and image manipulation **100% inside the user's browser**. The only server-side operation is the SSRF-hardened HTML fetch proxy used by the **SEO Page Analyzer** (`/api/analyze-seo`).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React
- **Package Manager**: Bun (`1.4.4`, locked via `bun.lock`) + Node.js (`22`)
- **PWA & Offline**: Vite Plugin PWA (`vite-plugin-pwa`), Workbox Service Worker, Web App Manifest
- **Document & Media Processing**: jsPDF, pdf-lib, pdfjs-dist, qpdf-wasm, tesseract.js, html2canvas-pro, JSZip, D3, Recharts, QRCode
- **Server Runtimes**: Node.js 22 (Express), Netlify Functions v2, Cloudflare Pages Edge Runtime

---

## 💻 Local Development

### Prerequisites
- **Bun**: Version `1.4.4` (or `>=1.2.0`)
- **Node.js**: Version `22` (see `.nvmrc`)

### Quick Start
```bash
# 1. Clone repository
git clone https://github.com/your-username/freetoolshub.git
cd freetoolshub

# 2. Install exact locked dependencies with Bun
bun install --frozen-lockfile

# 3. Copy environment template
cp .env.example .env

# 4. Start local full-stack dev server on port 3000
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Purpose |
| :--- | :--- |
| `bun run dev` / `npm run dev` | Runs the full-stack dev server (`server.ts`) on port 3000 |
| `bun run seo:generate` / `npm run seo:generate` | Regenerates `sitemap.xml`, `robots.txt`, `404.html`, `site.webmanifest`, `_redirects`, and syncs `netlify.toml` |
| `bun run build` / `npm run build` | Generates SEO assets, builds Vite bundle, prerenders 35 HTML pages in `dist/`, and compiles `server.js` |
| `bun run lint` / `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) across all files |
| `bun run preview` / `npm run preview` | Runs Vite static preview on the compiled `dist/` bundle |
| `bun run start` / `npm start` | Runs the compiled production Express server (`node server.js`) against `dist/` on `0.0.0.0:$PORT` |
| `bun run clean` / `npm run clean` | Cleans build artifacts (`dist/` and `server.js`) |

---

## 🏢 Hostinger Node.js Deployment (GitHub Auto-Deploy)

FreeTools Hub is ready for **Hostinger Node.js 22 Web App Hosting** with `npm` and automatic GitHub deploys. See [`HOSTINGER_DEPLOYMENT_GUIDE.md`](./HOSTINGER_DEPLOYMENT_GUIDE.md) for the complete 18-step setup, Firebase Authorized Domains checklist, and environment variable table.

- **Node.js Version**: `22` (`.nvmrc`)
- **Package Manager**: `npm` (`package-lock.json`)
- **Build Command**: `npm run build`
- **Start Command**: `npm start` (`node server.js`)
- **Production Entry File**: `server.js` (bundles `server.ts` for Node 22 ESM cleanly during `npm run build`)
- **Environment Variables**: Set `VITE_SITE_URL`, optional `VITE_GOOGLE_SITE_VERIFICATION` / `VITE_CONTACT_EMAIL`, and `VITE_FIREBASE_*` in Hostinger before building so Vite, prerendered HTML, and `sitemap.xml` / `robots.txt` align with your live domain.

---

## 🌐 Netlify Deployment & CI Workflow

FreeTools Hub also supports **Netlify Git Integration** (`https://freetoolshub1.netlify.app/`), while GitHub Actions (`.github/workflows/deploy-netlify.yml`) runs **CI validation** (`bun install --frozen-lockfile`, `bun run lint`, `bun run build`, and SEO output checks) without triggering competing duplicate production deploys.

### Netlify Configuration (`netlify.toml`)
- **Build command**: `bun run build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`
- **Pinned runtime**: `BUN_VERSION = "1.4.4"`, `NODE_VERSION = "22"`
- **Environment variables** (under Netlify **Site configuration > Environment variables**):
  - `VITE_SITE_URL`: `https://freetoolshub1.netlify.app`
  - `VITE_GOOGLE_SITE_VERIFICATION`: Optional override token for Search Console verification
  - `VITE_CONTACT_EMAIL`: Optional owner support email

### Manual GitHub Actions Deploy (Optional)
If you ever disable Netlify Git auto-deploys and choose to deploy via GitHub Actions manually:
1. Run **Actions > CI Build, SEO Validation & Optional Netlify Deploy > Run workflow** with `deploy_to_netlify: true`.
2. Ensure repository secrets `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` are set.

---

## ⚡ Cloudflare Pages Deployment (On-Demand)

Cloudflare Pages support (`functions/api/analyze-seo.ts`, `wrangler.toml`, `public/_headers`, `public/_redirects`) is available on demand via `.github/workflows/deploy-cloudflare-pages.yml` (`workflow_dispatch`) using Bun `1.4.4` and `bun install --frozen-lockfile`.

---

## 🔒 Security & Serverless Architecture

All `/api/analyze-seo` runtimes (`server.ts`/`server.js`, `netlify/functions/analyze-seo.ts`, and `functions/api/analyze-seo.ts`) enforce defense-in-depth SSRF safeguards:
- **HTTP Method Enforcement**: Only `GET` and `HEAD` permitted (`405` otherwise).
- **Protocol & Port Whitelisting**: Only `http:`/`https:` and ports `80`, `443`, `8080`, `8443` allowed.
- **Credential & Private IP Blocking**: Rejects embedded credentials and resolves hostnames to block loopback, RFC1918, CGNAT, link-local, cloud metadata (`169.254.169.254`, `metadata.google.internal`), and IPv6 ULA/link-local ranges.
- **Stream & Time Limits**: 2 MB body cap, 8500 ms request timeout, max 4 redirects, `Cache-Control: no-store`.

---

## 🗂️ Single-Source Canonical Routing & Redirects

All 35 indexable canonical URLs (1 homepage + 6 static trust/directory pages + 28 tools) and 38 legacy 301 alias redirects are defined once in `src/data/toolsRouting.ts` and `src/data/seoRegistry.ts`. Running `npm run seo:generate` or `npm run build` automatically synchronizes `netlify.toml`, `public/_redirects`, `dist/_redirects`, `sitemap.xml`, `robots.txt`, and `server.js`.

---

## 📄 License & Attribution

Published by **NEXORA** (`FreeTools Hub`). Released for public use under the Terms of Use published on the site.
