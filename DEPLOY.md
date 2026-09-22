# Deploy Trip Explorer demo (Render free)

Same flow as the EIS Addis Tech demo.

## Repo
Push this project to GitHub, then connect it on Render.

## Render settings
- **Runtime:** Node
- **Build command:** `npm ci && npm install @rolldown/binding-linux-x64-gnu && npm run build`
- **Start command:** `npm start`
- **Plan:** Free
- Env: `NODE_ENV=production`, `HOST=0.0.0.0`, `NODE_VERSION=22`, `NPM_CONFIG_OPTIONAL=true`, `NPM_CONFIG_PRODUCTION=false`, plus a generated `SESSION_SECRET`

Or use Blueprint: Render → New → Blueprint → select this repo (`render.yaml`).

## After deploy
1. Open the service → Environment
2. Set `APP_URL` to the live URL (example: `https://trip-booking-demo-xxxx.onrender.com`)
3. Redeploy once so password-reset links and sitemap use that URL

Use the Render URL as the Addis Tech demo project link.

## Demo login
- Admin: `admin@tripexplorer.com` / `admin123`

Free tier sleeps when idle; first open can take ~30–60s.
