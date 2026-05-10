# Free hosting + free domain manual (GitHub Pages)

This project can be hosted for free on GitHub Pages, with a free domain in this format:

- `https://forzaKuba.github.io/GardenDesign/` (project URL)

## 1) What was prepared in this repository

- Added workflow: `.github/workflows/deploy-pages.yml`
- It automatically builds the app and deploys `dist/` to GitHub Pages on every push to `main`.

## 2) One-time GitHub setup

1. Open repository: `forzaKuba/GardenDesign`
2. Go to **Settings → Pages**
3. In **Build and deployment**, set **Source** to **GitHub Actions**
4. Go to **Settings → Actions → General**
5. Ensure Actions are allowed for this repository (if currently restricted)

## 3) Deploy

1. Push your latest changes to `main`
2. Open **Actions** tab and wait for **Deploy to GitHub Pages** workflow to finish
3. Open the published URL:
   - `https://forzaKuba.github.io/GardenDesign/`

## 4) Free domain details

- GitHub Pages gives a free GitHub-owned domain (`github.io`), no payment needed.
- If you also want a separate custom domain, that depends on an external domain provider and DNS setup.

## 5) How updates work

- Any new push to `main` triggers a rebuild and redeploy automatically.
- No manual upload step is required.
