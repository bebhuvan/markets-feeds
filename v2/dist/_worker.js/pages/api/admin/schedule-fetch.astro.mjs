globalThis.process ??= {}; globalThis.process.env ??= {};
import { f as feedFetcher } from '../../../chunks/feed-fetcher_R7hQxynI.mjs';
export { renderers } from '../../../renderers.mjs';

class FeedScheduler {
  static instance;
  static getInstance() {
    if (!this.instance) {
      this.instance = new FeedScheduler();
    }
    return this.instance;
  }
  /**
   * Process all active feeds - designed to be called by Cloudflare Cron
   */
  async processAllFeeds(feeds) {
    const startTime = Date.now();
    const errors = [];
    console.log(`🕐 Starting scheduled feed fetch at ${(/* @__PURE__ */ new Date()).toISOString()}`);
    const activeFeeds = feeds.filter((f) => f.active);
    const results = await feedFetcher.fetchMultipleFeeds(activeFeeds);
    let successCount = 0;
    let failureCount = 0;
    let totalNewItems = 0;
    for (const result of results) {
      if (result.success) {
        successCount++;
        totalNewItems += result.itemCount;
      } else {
        failureCount++;
        errors.push({
          feedId: result.sourceId,
          error: result.error || "Unknown error"
        });
      }
    }
    const fetchResult = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      feedsProcessed: activeFeeds.length,
      successCount,
      failureCount,
      totalNewItems,
      errors
    };
    console.log(`✅ Feed fetch completed in ${Date.now() - startTime}ms`);
    console.log(`📊 Results: ${successCount} success, ${failureCount} failed, ${totalNewItems} new items`);
    return fetchResult;
  }
  /**
   * Get feeds that need updating based on their fetchInterval
   */
  getFeedsToUpdate(feeds, lastFetchTimes) {
    const now = /* @__PURE__ */ new Date();
    return feeds.filter((feed) => {
      if (!feed.active) return false;
      const lastFetch = lastFetchTimes.get(feed.id);
      if (!lastFetch) return true;
      const minutesSinceLastFetch = (now.getTime() - lastFetch.getTime()) / (1e3 * 60);
      return minutesSinceLastFetch >= feed.fetchInterval;
    });
  }
  /**
   * Generate fetch schedule report
   */
  generateScheduleReport(feeds) {
    const activeFeeds = feeds.filter((f) => f.active).length;
    const inactiveFeeds = feeds.filter((f) => !f.active).length;
    const feedsByInterval = {};
    const feedsByCategory = {};
    for (const feed of feeds) {
      if (feed.active) {
        feedsByInterval[feed.fetchInterval] = (feedsByInterval[feed.fetchInterval] || 0) + 1;
        feedsByCategory[feed.category] = (feedsByCategory[feed.category] || 0) + 1;
      }
    }
    return {
      activeFeeds,
      inactiveFeeds,
      feedsByInterval,
      feedsByCategory
    };
  }
}
const feedScheduler = FeedScheduler.getInstance();

const POST = async ({ request }) => {
  try {
    const authToken = request.headers.get("X-CF-Cron-Auth");
    console.log("📅 Scheduled feed fetch triggered");
    const feeds = [
      {
        id: "wsj_markets",
        name: "WSJ Markets",
        url: "https://feeds.wsj.com/public/resources/MWI_NEWS_MARKETS",
        sourceId: "wsj",
        category: "markets",
        fetchInterval: 30,
        active: true
      },
      {
        id: "bloomberg_economics",
        name: "Bloomberg Economics",
        url: "https://feeds.bloomberg.com/economics/news.rss",
        sourceId: "bloomberg",
        category: "macro",
        fetchInterval: 60,
        active: true
      }
    ];
    const result = await feedScheduler.processAllFeeds(feeds);
    return new Response(JSON.stringify({
      success: true,
      result,
      message: `Processed ${result.feedsProcessed} feeds, ${result.totalNewItems} new items`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Scheduled fetch error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
