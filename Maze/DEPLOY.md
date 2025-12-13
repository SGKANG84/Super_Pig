Netlify automatic deploy

This repository includes a GitHub Actions workflow that builds the app and deploys to Netlify on every push to `main`.

Files added:
- .github/workflows/deploy-netlify.yml — builds and runs `netlify deploy` using repo secrets
- netlify.toml — sets publish directory and headers for embedding

Setup (one-time):
1. Create a Personal Access Token on Netlify: https://app.netlify.com/user/applications#personal-access-tokens
2. From your Netlify site, copy the Site ID (Site settings → Site information).
3. In your GitHub repository, go to Settings → Secrets → Actions and add two secrets:
   - `NETLIFY_AUTH_TOKEN` = your Netlify personal access token
   - `NETLIFY_SITE_ID` = your Netlify site id

How to trigger:
- Push to the `main` branch. The workflow `.github/workflows/deploy-netlify.yml` will run automatically.

Notes on Notion embedding:
- The repo includes `netlify.toml` (and `vercel.json`) that set `Content-Security-Policy` `frame-ancestors` and `X-Frame-Options` headers to allow embedding in Notion. If Notion still blocks the embed, check the response headers in a browser and adjust the CSP accordingly.
