# FreeTools Hub (AbbasPro)

> Production-ready, client-side web utilities suite featuring 27 professional tools spanning Career & CV Generation, UAE Financial Calculators, Studio AI Prompt Architects, Developer Utilities, Media Processing, and Everyday Converters.

---

## 🚀 Overview & Architecture

FreeTools Hub is architected with a **unified single codebase** that runs seamlessly across three execution environments:

1. **Local Development & Docker/Node Hosting**: High-performance Express server (`server.ts`) hosting Vite in dev mode and serving compiled static assets in production with SSR-friendly meta injection, dynamic XML sitemaps, and SSRF-hardened proxying.
2. **Netlify Deployment**: Zero-config static asset hosting with **Netlify Functions v2** (`netlify/functions/analyze-seo.ts`), automated 301 legacy alias redirects, and security headers configured via `netlify.toml`.
3. **Cloudflare Pages Deployment**: Global edge CDN delivery with **Cloudflare Pages Functions** (`functions/api/analyze-seo.ts`), edge-safe SSRF validation, and header/redirect rules configured via `wrangler.toml`, `_headers`, and `_redirects`.

All 27 tools perform heavy data processing, calculations, vector rendering, and image manipulation **100% inside the user's browser** (Client-Side Storage, Web Cryptography, Canvas/WebP compression, jsPDF rendering). The only server-side operation is the SSRF-hardened HTML fetch proxy used by the **SEO Page Analyzer** (`/api/analyze-seo`).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React
- **PWA & Offline**: Vite Plugin PWA (`vite-plugin-pwa`), Workbox Service Worker, Web App Manifest
- **Document & Media Processing**: jsPDF (with vector circular clipping & WebP compatibility), html2canvas-pro, JSZip, D3, Recharts, QRCode
- **Server Runtimes**: Node.js 22 (Express), Netlify Functions v2, Cloudflare Pages Edge Runtime

---

## 💻 Local Development

### Prerequisites
- **Node.js**: Version `22` (or higher). Run `nvm use` if you use NVM.
- **npm**: Version `10` or higher.

### Quick Start
```bash
# 1. Clone repository
git clone https://github.com/your-username/freetoolshub.git
cd freetoolshub

# 2. Use Node 22
nvm use

# 3. Install dependencies
npm ci

# 4. Copy environment template
cp .env.example .env

# 5. Start local full-stack dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Runs the full-stack dev server (`server.ts`) with HMR proxy on port 3000 |
| `npm run build` | Compiles production assets into the `dist/` directory via Vite |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) across all files |
| `npm run preview` | Runs Vite static preview on the compiled `dist/` bundle |
| `npm start` | Runs the production Node.js Express server against the `dist/` bundle |
| `npm run clean` | Cleans build artifacts (`dist/` and temp files) |

---

## 🌐 Netlify Deployment

FreeTools Hub is pre-configured for both **manual connection** and **automated GitHub Actions CI/CD** on Netlify.

### Option 1: Git Connection via Netlify UI
1. Go to the [Netlify App Dashboard](https://app.netlify.com) and click **"Add new site" > "Import an existing project"**.
2. Select your GitHub repository (`freetoolshub`).
3. Netlify automatically detects `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
4. Add environment variables under **Site configuration > Environment variables**:
   - `VITE_SITE_URL`: `https://your-custom-domain.com` (your canonical production URL)
   - `VITE_CONTACT_EMAIL`: `support@yourdomain.com` (optional)
5. Click **Deploy Site**.

### Option 2: Automated GitHub Actions (`deploy-netlify.yml`)
The workflow at `.github/workflows/deploy-netlify.yml` automatically type-checks, builds, and deploys to Netlify upon every push to `main`.

#### Required GitHub Secrets:
1. Navigate to your GitHub repository > **Settings > Secrets and variables > Actions > New repository secret**.
2. Add the following secrets:
   - `NETLIFY_AUTH_TOKEN`: Your Personal Access Token from Netlify (**User Settings > Applications > New access token**).
   - `NETLIFY_SITE_ID`: Your Netlify Site API ID from your site's dashboard (**Site configuration > General > Site details > Site ID**).

---

## ⚡ Cloudflare Pages Deployment

FreeTools Hub includes full support for Cloudflare Pages with Edge Functions (`functions/api/analyze-seo.ts`).

### Option 1: Git Connection via Cloudflare Dashboard
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com) and navigate to **Workers & Pages > Create application > Pages > Connect to Git**.
2. Select your GitHub repository.
3. Configure build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
4. In **Environment variables (Advanced)**, add:
   - `NODE_VERSION`: `22`
   - `VITE_SITE_URL`: `https://your-custom-domain.com`
5. Click **Save and Deploy**.

### Option 2: Automated GitHub Actions (`deploy-cloudflare-pages.yml`)
The workflow at `.github/workflows/deploy-cloudflare-pages.yml` uses the official `cloudflare/wrangler-action@v3` to deploy to Cloudflare Pages upon push to `main`.

#### Required GitHub Secrets:
1. In your GitHub repository > **Settings > Secrets and variables > Actions**:
2. Add the following secrets:
   - `CLOUDFLARE_API_TOKEN`: Cloudflare API token with `Cloudflare Pages:Edit` permissions (**My Profile > API Tokens > Create Token > Cloudflare Pages template**).
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID found in the dashboard URL or under **Workers & Pages > Overview > Account ID** in the right sidebar.
   - `CLOUDFLARE_PROJECT_NAME`: (Optional, defaults to `freetoolshub`) Name of the Pages project in Cloudflare.

---

## 🔒 Security & Serverless Architecture

### The `/api/analyze-seo` Endpoint
Because web browsers block cross-origin requests (`CORS`) and web crawlers require raw HTML inspections, the SEO Page Analyzer audits pages via `/api/analyze-seo`.

To protect the server and host network against Server-Side Request Forgery (SSRF), all runtimes (`server.ts`, Netlify Function, and Cloudflare Pages Function) enforce the following defense-in-depth rules:
- **Protocol Enforcement**: Only `http:` and `https:` permitted.
- **Port Whitelisting**: Restricted to standard web ports (`80`, `443`, `8080`, `8443`).
- **Credential Stripping**: Rejects URLs containing embedded user credentials (`user:pass@host`).
- **Loopback & Private IP Filtering**: Blocks `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, CGNAT `100.64.0.0/10`, IPv6 ULA `fc00::/7`, link-local `fe80::/10`, and IPv4-mapped IPv6.
- **Cloud Metadata Safeguards**: Explicitly blocks `metadata.google.internal`, `169.254.169.254`, `instance-data`, and Kubernetes service endpoints.
- **Payload & Memory Caps**: Streams capped at 2 MB with strict request timeouts (`8500ms`) and maximum 4 redirects.

### Headers & Caching Strategy
Configured identically in `netlify.toml`, `public/_headers`, and `server.ts`:
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN`
- Static hashed chunks (`/assets/*`): `Cache-Control: public, max-age=31536000, immutable`
- Progressive Web App scripts (`/sw.js`, `/manifest.webmanifest`): `Cache-Control: public, max-age=0, must-revalidate`

---

## 🗂️ Canonical Routing & Legacy Aliases

FreeTools Hub maintains 301 permanent redirects for all legacy URLs to ensure existing bookmarks and external backlinks never break:

| Canonical Route | Preserved Aliases (301 Permanent Redirect) |
| :--- | :--- |
| `/tools/cv-maker` | `/tools/resume-builder`, `/tools/cv-builder`, `/tools/resume-maker` |
| `/tools/uae-gratuity-calculator` | `/tools/uae-gratuity`, `/tools/gratuity-calculator` |
| `/tools/uae-salary-calculator` | `/tools/dubai-salary-calculator`, `/tools/uae-salary` |
| `/tools/ai-photo-prompt-generator` | `/tools/gemini-photo-prompt`, `/tools/photo-prompt-generator` |
| `/tools/ai-video-prompt-generator` | `/tools/ai-video-prompt`, `/tools/video-prompt-generator` |
| `/tools/markdown-editor` | `/tools/markdown-live-editor` |
| `/tools/seo-page-analyzer` | `/tools/seo-analyzer`, `/tools/page-analyzer` |
| `/tools/seo-meta-generator` | `/tools/meta-tag-generator` |
| `/tools/word-counter` | `/tools/character-counter` |
| `/tools/text-case-converter` | `/tools/case-converter` |
| `/tools/image-compressor` | `/tools/compress-image`, `/tools/photo-compressor` |
| `/tools/qr-code-generator` | `/tools/qr-generator`, `/tools/qr-maker`, `/tools/qrcode-generator` |
| `/tools/color-picker` | `/tools/color-converter`, `/tools/palette-generator` |
| `/tools/loan-calculator` | `/tools/mortgage-calculator`, `/tools/emi-calculator`, `/tools/loan-emi-calculator` |
| `/tools/currency-converter` | `/tools/forex-converter` |
| `/tools/crypto-converter` | `/tools/bitcoin-converter` |
| `/tools/discount-calculator` | `/tools/sale-calculator` |
| `/tools/password-generator` | `/tools/strong-password-generator` |
| `/tools/password-strength` | `/tools/password-checker` |
| `/tools/date-difference` | `/tools/days-between-dates` |
| `/tools/timezone-converter` | `/tools/time-zone-converter`, `/tools/world-clock` |
| `/tools/json-formatter` | `/tools/json-validator`, `/tools/json-beautifier` |
| `/tools/base64-converter` | `/tools/base64-encoder`, `/tools/base64-decoder` |

---

## 📱 Progressive Web App (PWA)

FreeTools Hub is fully PWA-enabled:
- **Offline Reliability**: Assets, fonts, and script bundles are automatically precached on first visit.
- **Installability**: Meets all Web App Manifest criteria for desktop and mobile home screen installation.
- **Service Worker Lifecycle**: Configured via `vite-plugin-pwa` with auto-update validation on network reconnect.

---

## 📄 License & Attribution

Designed and maintained by **AbbasPro**. Released for public use under the Terms of Use published on the site.
