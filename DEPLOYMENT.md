# Deployment Guide

## 🚀 Quick Deployment to Cloudflare Pages

### Prerequisites
- GitHub account
- Cloudflare account
- Node.js 20+ and Python 3.11+

### Step 1: Repository Setup
1. Fork or clone this repository
2. Push to your GitHub account

### Step 2: Cloudflare Configuration
1. Log into Cloudflare Dashboard
2. Go to **Pages** > **Create a project**
3. Connect to your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `20`

### Step 3: Environment Variables
In Cloudflare Pages > Settings > Environment variables, add:
- `NODE_VERSION`: `20`

### Step 4: GitHub Secrets
In your GitHub repository > Settings > Secrets, add:
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

### Step 5: Enable GitHub Actions
Push any change to trigger the workflows. They will:
1. Run RSS aggregation every 30 minutes during market hours
2. Auto-deploy to Cloudflare Pages on successful aggregation

---

## 📊 RSS Sources Status

### ✅ Working Sources
- Bloomberg Markets
- The Economist Finance
- Economic Times Markets

### ⚠️ Requires Configuration
- Reuters (SSL/DNS issues)
- Mint (403 Forbidden - needs user agent)
- RBI (XML parsing issues)

### 🔧 To Fix
Update `scripts/aggregate_feeds.py` with proper headers and error handling for problematic sources.

---

## 🛠️ Local Development

```bash
# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# Or manual setup:
npm install
cd scripts && pip install -r requirements.txt
python aggregate_feeds.py
cd .. && npm run dev
```

---

## 📈 Performance Metrics

- **RSS Aggregation**: ~1 minute for all sources
- **Build Time**: ~30 seconds
- **Bundle Size**: ~15KB gzipped
- **Items Processed**: 130+ items successfully fetched

---

## 🔄 Automation Schedule (IST)

**Weekdays (Mon-Fri):**
- **6:00 AM** - Pre-market news aggregation
- **9:45 AM** - Market opening coverage
- **3:00 PM** - Market close analysis  
- **6:00 PM** - Post-market updates
- **9:00 PM** - Evening news digest

**Weekends:**
- **9:00 AM** - Global finance updates

**Manual trigger**: Available in GitHub Actions tab

---

## 🆘 Troubleshooting

### RSS Feeds Not Updating
1. Check GitHub Actions logs
2. Verify RSS source URLs
3. Check network connectivity

### Build Failures
1. Run `npm run astro check`
2. Verify content schema matches data
3. Check TypeScript errors

### Styling Issues
1. Clear browser cache
2. Check Tailwind CSS compilation
3. Verify CSS custom properties

---

Ready for production deployment! 🎉