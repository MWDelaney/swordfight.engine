# API Deployment

The SwordFight static API is automatically deployed to GitHub Pages.

## Setup

1. Enable GitHub Pages in repository settings:
   - Go to **Settings** → **Pages**
   - Source: **GitHub Actions**

2. The workflow will automatically deploy when:
   - Changes are pushed to `main` branch that affect:
     - API files (`api/**`)
     - Character data (`src/characters/**`)
     - Round calculation logic (`src/classes/Round.js`)
   - Or manually triggered from the **Actions** tab

## API URL

After deployment, the API will be available at:

```
https://mwdelaney.github.io/swordfight.engine/
```

## Custom Domain

To use a custom domain (e.g., `api.swordfight.me`):

1. Add a `CNAME` file to `api/src/` containing your domain:
   ```
   api.swordfight.me
   ```

2. Configure DNS with your domain provider:
   ```
   CNAME  api  mwdelaney.github.io
   ```

3. In GitHub Settings → Pages, set the custom domain

4. Update the default API URL in `src/SwordFight.Game.Lite.js`:
   ```javascript
   static apiBase = 'https://api.swordfight.me';
   ```

## Build Info

- **Build time**: ~3-5 seconds
- **Generated files**: 30,864 JSON files
- **Total size**: ~203MB uncompressed, ~20-40MB with gzip/brotli
- **CDN**: Automatically served via GitHub Pages CDN

## Manual Deployment

To manually trigger deployment:

1. Go to **Actions** tab
2. Select **Deploy API to GitHub Pages**
3. Click **Run workflow**
4. Select `main` branch
5. Click **Run workflow**

## Local Testing

Before deploying, test the API build locally:

```bash
npm run build:api
cd api/dist
python3 -m http.server 8080
```

Then test with the lite version:

```javascript
CharacterLoader.setApiBase('http://localhost:8080');
```
