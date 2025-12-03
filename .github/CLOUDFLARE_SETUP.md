# GitHub Actions Setup for CloudFlare Deployment

This guide explains how to set up automatic deployment of the multiplayer server to CloudFlare Workers via GitHub Actions.

## Prerequisites

- CloudFlare account (free tier works)
- GitHub repository with Actions enabled
- Wrangler CLI configured locally (for initial setup)

## Step 1: Get CloudFlare API Token

1. Go to [CloudFlare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template
4. Configure token:
   - **Permissions**: `Account > Cloudflare Workers Scripts > Edit`
   - **Account Resources**: Include > Your Account
5. Click "Continue to summary"
6. Click "Create Token"
7. **Copy the token** (you won't see it again!)

## Step 2: Add Secret to GitHub

1. Go to your GitHub repository
2. Navigate to: **Settings > Secrets and variables > Actions**
3. Click "New repository secret"
4. Add secret:
   - **Name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: Paste the token from Step 1
5. Click "Add secret"

## Step 3: Configure CloudFlare Account ID (Optional)

If your `wrangler.toml` doesn't include `account_id`, add it as a secret:

1. Get your account ID from CloudFlare Dashboard (right sidebar)
2. Add another secret:
   - **Name**: `CLOUDFLARE_ACCOUNT_ID`
   - **Value**: Your account ID

3. Update `server/wrangler.toml`:
   ```toml
   name = "swordfight-multiplayer"
   # account_id is read from CLOUDFLARE_ACCOUNT_ID env var in CI
   ```

Or simply add it directly to `wrangler.toml` (it's not sensitive):
```toml
name = "swordfight-multiplayer"
account_id = "your-account-id-here"
```

## Step 4: Verify Workflow

The workflow (`.github/workflows/deploy-cloudflare.yml`) will:

1. **Trigger on**:
   - Push to `main` branch (only when files in `server/` change)
   - Manual trigger via Actions tab

2. **Deploy**:
   - Install dependencies in `server/`
   - Run `wrangler deploy`
   - Output the worker URL

## Step 5: Deploy

### Automatic Deployment

Push changes to the `server/` directory:

```bash
git add server/
git commit -m "Update multiplayer server"
git push origin main
```

The workflow will automatically deploy to CloudFlare.

### Manual Deployment

1. Go to **Actions** tab in GitHub
2. Select "Deploy to CloudFlare"
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow"

## Step 6: Get Your Worker URL

After successful deployment, your worker will be available at:

```
https://swordfight-multiplayer.<your-username>.workers.dev
```

For WebSocket connections, use:

```
wss://swordfight-multiplayer.<your-username>.workers.dev
```

## Troubleshooting

### Error: "Authentication error"

- Verify `CLOUDFLARE_API_TOKEN` is set correctly in GitHub Secrets
- Ensure token has "Edit Cloudflare Workers" permission
- Check token hasn't expired

### Error: "Account ID not found"

- Add `account_id` to `server/wrangler.toml`
- Or set `CLOUDFLARE_ACCOUNT_ID` secret in GitHub

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

- API tokens are stored as encrypted GitHub Secrets
- Never commit tokens to the repository
- Rotate tokens periodically via CloudFlare Dashboard
- Use minimal permissions (Workers Edit only)

## Next Steps

1. Set up the CloudFlare API token (Step 1-2)
2. Push to main branch to trigger deployment
3. Update your client with the worker URL
4. Test the connection!

See [server/README.md](../server/README.md) for server configuration details.
