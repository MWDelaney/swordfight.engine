# GitHub Actions Setup for CloudFlare Deployment

This guide explains how to set up automatic deployment of the multiplayer server to CloudFlare Workers via GitHub Actions.

## Prerequisites

- CloudFlare account (free tier works)
- GitHub repository with Actions enabled
- Wrangler CLI configured locally (for initial setup)

## Step 1: Get CloudFlare API Token

1. **Log in to Cloudflare** at https://dash.cloudflare.com
2. **Click your profile icon** (top right corner) → Select **"My Profile"**
3. In the left sidebar, click **"API Tokens"**
4. Click the blue **"Create Token"** button
5. Find **"Edit Cloudflare Workers"** template and click **"Use template"**
6. **Token configuration** (should be pre-filled):
   - Permissions: `Account > Cloudflare Workers Scripts > Edit`
   - Account Resources: `Include > [Your Account Name]`
7. Scroll down and click **"Continue to summary"**
8. Review and click **"Create Token"**
9. **IMPORTANT**: Copy the token that appears - you cannot see it again after closing this page
   - It looks like: `abcdef123456789...`

## Step 2: Add Secrets to GitHub

You need to add two secrets: your API token and account ID.

### Add API Token

1. **Go to your GitHub repository** at https://github.com/MWDelaney/swordfight.engine
2. Click the **"Settings"** tab (top right, next to Insights)
3. In the left sidebar, expand **"Secrets and variables"** → click **"Actions"**
4. Click the green **"New repository secret"** button (top right)
5. Fill in the form:
   - **Name**: Type exactly `CLOUDFLARE_API_TOKEN`
   - **Secret**: Paste the token you copied from Step 1
6. Click **"Add secret"**

### Add Account ID

1. Go back to the Cloudflare Dashboard at <https://dash.cloudflare.com>
2. In the main dashboard, look at the **right sidebar**
3. You'll see **"Account ID"** with a string like `abc123def456...`
4. Click the **copy icon** next to it
5. Go back to your GitHub repository **Settings → Secrets and variables → Actions**
6. Click **"New repository secret"** again
7. Fill in the form:
   - **Name**: Type exactly `CLOUDFLARE_ACCOUNT_ID`
   - **Secret**: Paste your account ID
8. Click **"Add secret"**
9. You should now see both `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in your secrets list

## Step 3: Verify Workflow

The workflow (`.github/workflows/deploy-cloudflare.yml`) will:

1. **Trigger on**:
   - Push to `main` branch (only when files in `server/` change)
   - Manual trigger via Actions tab

2. **Deploy**:
   - Install dependencies in `server/`
   - Run `wrangler deploy`
   - Output the worker URL

## Step 4: Deploy

### Automatic Deployment

Any time you push changes to the `server/` directory, GitHub Actions will automatically deploy:

```bash
git add server/
git commit -m "Update multiplayer server"
git push origin main
```

**Watch the deployment:**

1. Go to your repository on GitHub
2. Click the **"Actions"** tab (top navigation)
3. You'll see your deployment running with a yellow dot (in progress) or green checkmark (complete)
4. Click on the workflow run to see details and the deployed URL

### Manual Deployment (Testing)

To trigger a deployment without making changes:

1. Go to your repository on GitHub
2. Click the **"Actions"** tab
3. In the left sidebar, click **"Deploy to CloudFlare"**
4. Click the **"Run workflow"** dropdown button (top right)
5. Ensure `main` branch is selected
6. Click the green **"Run workflow"** button

## Step 5: Get Your Worker URL

After successful deployment, find your URL:

**Option 1: From GitHub Actions**

1. Go to **Actions** tab → Click your workflow run
2. Scroll to the bottom of the logs
3. Look for: `Published swordfight-multiplayer` followed by your URL

**Option 2: From Cloudflare Dashboard**

1. Go to <https://dash.cloudflare.com>
2. Click **"Workers & Pages"** in the left sidebar
3. Click **"swordfight-multiplayer"**
4. Your URL is shown at the top: `https://swordfight-multiplayer.YOUR-SUBDOMAIN.workers.dev`

**Use these URLs in your client:**

- HTTP/HTTPS: `https://swordfight-multiplayer.YOUR-SUBDOMAIN.workers.dev`
- WebSocket: `wss://swordfight-multiplayer.YOUR-SUBDOMAIN.workers.dev`

## Troubleshooting

### Error: "Authentication error"

- Verify `CLOUDFLARE_API_TOKEN` is set correctly in GitHub Secrets
- Ensure token has "Edit Cloudflare Workers" permission
- Check token hasn't expired

### Error: "Account ID not found"

- Verify `CLOUDFLARE_ACCOUNT_ID` is set correctly in GitHub Secrets
- Make sure you copied the entire account ID from Cloudflare Dashboard

### Error: "Durable Objects not available"

- Ensure you've run the first migration locally: `cd server && npx wrangler deploy`
- Durable Objects require initial setup via CLI

### Workflow doesn't trigger

- Check the workflow file path: `.github/workflows/deploy-cloudflare.yml`
- Verify `paths` in workflow matches your changes
- Try manual trigger from Actions tab

## Custom Domain (Optional)

To use a custom domain:

1. Add domain in CloudFlare Dashboard:
   - Workers & Pages > swordfight-multiplayer > Triggers
   - Add Custom Domain
   - Enter domain (e.g., `games.yourdomain.com`)

2. Update your client code:
   ```javascript
   serverUrl: 'wss://games.yourdomain.com'
   ```

## Local vs CI Deployment

| Method | Use Case |
|--------|----------|
| Local (`npm run deploy` in `/server`) | Development, testing |
| GitHub Actions | Production, automatic deploys |

Both methods deploy to the same CloudFlare account - no configuration difference needed.

## Workflow File Location

The workflow is in: `.github/workflows/deploy-cloudflare.yml`

To disable automatic deployment, remove or rename this file.

## Cost

CloudFlare Workers are free for:
- 100,000 requests/day
- 10ms CPU time per request

Your multiplayer server will stay well within free tier limits at 10,000+ games/day.

## Security Notes

- API tokens and account IDs are stored as encrypted GitHub Secrets
- Never commit tokens to the repository
- Account IDs are not sensitive, but using secrets keeps your config clean
- Rotate tokens periodically via CloudFlare Dashboard
- Use minimal permissions (Workers Edit only)

## Next Steps

1. Get your CloudFlare API token (Step 1)
2. Add both secrets to GitHub (Step 2)
3. Push to main branch to trigger deployment (Step 4)
4. Get your worker URL (Step 5)
5. Update your client with the worker URL
6. Test the connection!

See [server/README.md](../server/README.md) for server configuration details.
