# Automated RSS Feed System

This system is fully automated and requires no manual intervention after setup.

## How It Works

### 🤖 Automated Feed Fetching
- **Schedule**: 5 times daily at 6 AM, 8 AM, 10:50 AM, 3 PM, 6 PM UTC via GitHub Actions
- **Process**: Fetches all 157 active RSS feeds with smart rate limiting
- **Updates**: Automatically commits new articles to the repository

### 🚀 Automated Deployment
- **Trigger**: Any push to the main branch
- **Platform**: Cloudflare Pages (configured in wrangler.toml)
- **Speed**: Site updates live within 2-5 minutes

### 📊 Rate Limiting Strategy
- **NSE Feeds**: 15-second delays (prevents blocking)
- **YouTube Feeds**: 3-second delays 
- **Eclectic Feeds**: 5-second delays (Substack/intellectual content)
- **Regular Feeds**: Concurrent fetching for speed

## GitHub Actions Workflows

### 1. `fetch-feeds.yml` - RSS Automation
```yaml
Schedule: 
  - 0 6,8,15,18 * * *   # 6 AM, 8 AM, 3 PM, 6 PM UTC
  - 50 10 * * *         # 10:50 AM UTC
Process:
  1. Fetch all RSS feeds
  2. Check for new content
  3. Commit changes if found
  4. Push to main branch
  5. Trigger Cloudflare deployment
```

### 2. `deploy.yml` - Build Verification
```yaml
Trigger: Push to main branch
Process:
  1. Install dependencies
  2. Build project
  3. Verify artifacts
  4. Confirm deployment
```

## Feed Categories & Sources

- **Markets & Trading**: 📈 Real-time market data and analysis
- **Economics & Policy**: 🏛️ Central bank updates and policy analysis  
- **Technology**: 💻 Fintech and innovation coverage
- **Research & Analysis**: 📊 Investment research and market insights
- **Corporate Filings**: 📋 NSE/BSE announcements and regulatory updates
- **Eclectic & Commentary**: 📚 Intellectual content from Substack authors
- **Video Content**: 📺 Educational and analysis videos

## Zero-Maintenance Operation

Once deployed, the system:
- ✅ Automatically fetches fresh content 5 times daily at key market hours
- ✅ Handles feed failures gracefully (continues with other feeds)
- ✅ Commits and deploys updates without human intervention
- ✅ Filters out invalid articles (empty titles, malformed content)
- ✅ Maintains consistent performance with smart rate limiting

## Monitoring

- GitHub Actions logs show feed fetch status
- Cloudflare Pages dashboard shows deployment status
- Site automatically displays latest articles within minutes of RSS updates

**Result**: A fully autonomous financial news aggregator that stays current 24/7.