# Deployment Guide

This guide covers deploying Markets Feeds to Cloudflare Pages with automated RSS aggregation.

## 📋 Prerequisites

- GitHub repository with the Markets Feeds code
- Cloudflare account with Pages access
- Cloudflare API token with appropriate permissions

## 🔧 Setup Instructions

### 1. Cloudflare API Token Setup

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. Configure permissions:
   - **Account**: `Cloudflare Pages:Edit`
   - **Zone**: `Zone:Read` (if using custom domain)
   - **Account Resources**: Include your account
5. Copy the generated token

### 2. GitHub Secrets Configuration

Add these secrets to your GitHub repository:

```
Settings → Secrets and variables → Actions → New repository secret
```

**Required Secrets:**
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

**Finding Account ID:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Copy the Account ID from the right sidebar

### 3. Cloudflare Pages Project

The GitHub Action will automatically create the Cloudflare Pages project on first deployment. The project will be named `markets-feeds`.

## 🚀 Deployment Process

### Automatic Deployment

The site deploys automatically when:

1. **RSS Aggregation Completes** (5x daily)
   - 6:00 AM IST (Pre-market)
   - 9:45 AM IST (Market open)
   - 3:00 PM IST (Market close)
   - 6:00 PM IST (Post-market)
   - 9:00 PM IST (Evening news)

2. **Code Changes** pushed to `main` branch
3. **Manual Trigger** from GitHub Actions tab

### Manual Deployment

```bash
# Local build and deploy
npm run build
npx wrangler pages deploy dist --project-name=markets-feeds
```

## 🔄 Workflow Details

### RSS Aggregation Workflow

```yaml
# .github/workflows/aggregate-feeds.yml
- Runs on schedule (5x daily)
- Fetches RSS from 100+ sources
- Processes and deduplicates content
- Commits new content to repository
- Triggers deployment workflow
```

### Deployment Workflow

```yaml
# .github/workflows/deploy.yml
- Triggered by aggregation completion or code push
- Injects build timestamp for cache invalidation
- Builds static site with Astro
- Deploys to Cloudflare Pages
- Updates deployment status
```

## 📊 Monitoring Deployment

### GitHub Actions

Monitor deployment status:
1. Go to your repository
2. Click "Actions" tab
3. View workflow runs and logs

### Cloudflare Dashboard

Check deployment details:
1. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. Click on `markets-feeds` project
3. View deployment history and logs

## 🐛 Troubleshooting

### Common Issues

**Deployment Fails with API Token Error:**
- Verify token has correct permissions
- Check Account ID is correct
- Ensure token hasn't expired

**Build Fails:**
- Check build logs in GitHub Actions
- Verify all dependencies are installed
- Check for TypeScript errors

**RSS Aggregation Not Running:**
- Check aggregation workflow schedule
- Verify Python dependencies
- Check for RSS feed accessibility issues

**Cache Issues After Deployment:**
- Cache automatically invalidates with build timestamp
- Force refresh in browser (Ctrl+F5)
- Check service worker console logs

### Debug Commands

```bash
# Test build locally
npm run build

# Check RSS aggregation
python scripts/aggregate_feeds.py

# Validate content schema
npm run astro check

# Preview production build
npm run preview
```

## 🔐 Security Considerations

### API Token Security
- Use minimum required permissions
- Rotate tokens regularly
- Never commit tokens to repository
- Use GitHub repository secrets only

### Content Security
- RSS feeds are validated and sanitized
- No user-generated content accepted
- All external links open in new tabs
- HTTPS enforced for all connections

## 🌍 Custom Domain (Optional)

To use a custom domain:

1. **Add Domain in Cloudflare Pages:**
   - Go to Pages project settings
   - Add custom domain
   - Follow DNS setup instructions

2. **Update Repository Settings:**
   ```yaml
   # In .github/workflows/deploy.yml
   environment_url: 'https://your-domain.com'
   ```

## 📈 Performance Optimization

### Build Optimization
- Static site generation for maximum speed
- Automated cache invalidation on deployments
- Optimized asset bundling with Vite
- Image optimization and lazy loading

### Cache Strategy
- Service worker with intelligent TTL
- Network-first for HTML content
- Cache-first for static assets
- Automatic cleanup of expired entries

## 🔄 Backup & Recovery

### Content Backup
- All RSS content stored in Git repository
- Historical content preserved in `/src/content/links/`
- Aggregator state tracked in `scripts/aggregator_state.json`

### Recovery Process
1. Repository contains all historical data
2. Redeploy from any commit in history
3. RSS aggregation resumes automatically
4. No data loss during outages

---

**Need Help?** Check the [main README](../README.md) or create an issue in the repository.