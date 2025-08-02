# Markets Feeds v2

A modern financial news aggregator built with Astro, featuring automated RSS feed collection and intelligent categorization.

## 🚀 Deployment Instructions

### Option 1: Cloudflare Pages (Recommended)

1. **Connect Repository:**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com)
   - Click "Connect to Git" → Select this repository
   - Choose the `main` branch

2. **Build Configuration:**
   ```
   Build command: cd v2 && npm run build
   Build output directory: v2/dist
   Root directory: /
   ```

3. **Environment Variables:**
   - `NODE_VERSION`: `20`
   - `NPM_FLAGS`: `--legacy-peer-deps` (if needed)

### Option 2: Manual Feed Updates

Since GitHub Actions is having issues, you can manually update feeds:

```bash
cd v2
npm install
npm run fetch-feeds
git add content/links/*.json
git commit -m "Update feeds"
git push
```

## 📊 Features

- **60+ RSS Feeds**: Financial news from major sources
- **Smart Categorization**: 16 focused categories
- **Search & Discovery**: Full-text search with suggestions
- **Admin Dashboard**: Feed management interface
- **Mobile Responsive**: Works on all devices

## 🔧 Local Development

```bash
cd v2
npm install
npm run dev
```

Visit `http://localhost:4321`

## 📁 Project Structure

```
v2/
├── src/
│   ├── pages/          # Astro pages
│   ├── lib/            # Utilities and data loading
│   ├── scripts/        # RSS feed fetchers
│   └── layouts/        # Page layouts
├── content/
│   ├── links/          # Article JSON files
│   └── ideas/          # Curated insights
└── feeds.config.json   # RSS feed configuration
```

## 🤖 Automated Updates

The system is designed to automatically fetch feeds, but if GitHub Actions fails:

1. **Set up a cron job** on any server
2. **Use Cloudflare Workers** with scheduled triggers
3. **Manual updates** as shown above

## 📈 Data Sources

- **Markets**: WSJ, Bloomberg, Reuters, CNBC, FT
- **Indian Markets**: ET Markets, Hindu Business Line, NDTV Profit
- **Central Banking**: Fed, ECB, RBI press releases
- **Analysis**: Matt Levine, Paul Krugman, Stratechery
- **Technology**: TechMeme, The Verge, Wired
- **Research**: NBER, BIS, CEPR papers

## 🎯 Categories

- Markets, Earnings, M&A, Crypto
- Economics, Central Banking, Commodities
- Technology, Regulation, Research
- Videos, Podcasts, Analysis, News

---

**Live Site**: Deploy to see your financial news aggregator in action! 🚀