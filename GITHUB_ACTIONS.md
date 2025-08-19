# GitHub Actions RSS Feed Fetcher

This project uses GitHub Actions to automatically fetch RSS feeds every 30 minutes, providing better reliability and execution time than Cloudflare Workers cron jobs.

## Setup Instructions

### 1. Repository Secrets

You need to configure these secrets in your GitHub repository:

**Not required currently** - The setup uses public API endpoints that don't require authentication.

### 2. Workflow Configuration

The workflow is configured in `.github/workflows/fetch-feeds.yml` and:

- **Runs 3 times daily** at 5:00 AM, 10:00 AM, and 6:00 PM IST
- **Can be manually triggered** via GitHub Actions UI
- **Has 30-minute timeout** to handle all 62 RSS feeds
- **Provides detailed logging** of the fetch process

### 3. How It Works

1. **Health Check**: Verifies worker API is responsive
2. **Initial Count**: Records current article count
3. **Feed Fetch**: Triggers the worker's `/fetch-feeds` endpoint
4. **Verification**: Checks if new articles were added
5. **Reporting**: Logs statistics and results

### 4. Manual Triggering

You can manually trigger the workflow:

1. Go to **Actions** tab in GitHub repository
2. Select **"Fetch RSS Feeds"** workflow  
3. Click **"Run workflow"**
4. Optionally specify a limit for testing

### 5. Monitoring

Check the **Actions** tab to monitor:
- Execution logs and timing
- Success/failure status  
- Article count changes
- Any error messages

### 6. Benefits over Worker Cron

- **Longer execution time** (30 minutes vs 30 seconds)
- **Better error handling** and retry logic
- **Detailed logging** and monitoring
- **Manual triggering** capability
- **No additional Cloudflare costs**

### 7. Worker Configuration

The Cloudflare Worker cron job has been disabled in `worker/wrangler.toml` to avoid conflicts:

```toml
# [triggers]  
# crons = ["*/30 * * * *"]  # Disabled - using GitHub Actions instead
```

### 7. Schedule Details

The workflow runs at optimal times for Indian markets:
- **5:00 AM IST**: Pre-market preparation (global overnight news)
- **10:00 AM IST**: Mid-morning update (market open + morning news)  
- **6:00 PM IST**: End-of-day wrap-up (market close + evening analysis)

### 8. Troubleshooting

If feeds aren't being fetched:

1. Check **Actions** tab for workflow execution status
2. Review logs for any error messages
3. Verify worker API is accessible at: https://markets-feeds.r-bhuvanesh2007.workers.dev/api/sources
4. Manually trigger workflow to test

The system is designed to be robust - even if one fetch fails, the next scheduled run will continue the process.