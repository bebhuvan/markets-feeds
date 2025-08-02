globalThis.process ??= {}; globalThis.process.env ??= {};
import { f as feedFetcher } from '../../../chunks/feed-fetcher_CAAq_HPv.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { feedId, testAll = false } = body;
    const testFeeds = [
      {
        id: "test_wsj_markets",
        name: "Wall Street Journal Markets",
        url: "https://feeds.wsj.com/public/resources/MWI_NEWS_MARKETS",
        sourceId: "wsj",
        category: "markets",
        fetchInterval: 3e5,
        active: true
      },
      {
        id: "test_reuters_business",
        name: "Reuters Business",
        url: "https://feeds.reuters.com/reuters/businessNews",
        sourceId: "reuters",
        category: "markets",
        fetchInterval: 3e5,
        active: true
      },
      {
        id: "test_ft_markets",
        name: "Financial Times Markets",
        url: "https://www.ft.com/markets?format=rss",
        sourceId: "ft",
        category: "markets",
        fetchInterval: 3e5,
        active: true
      }
    ];
    if (testAll) {
      console.log("🧪 Testing all feeds...");
      const results = await feedFetcher.fetchMultipleFeeds(testFeeds);
      return new Response(JSON.stringify({
        success: true,
        results,
        summary: {
          totalFeeds: results.length,
          successfulFeeds: results.filter((r) => r.success).length,
          failedFeeds: results.filter((r) => !r.success).length,
          totalItems: results.reduce((sum, r) => sum + r.itemCount, 0),
          avgResponseTime: Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length)
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const feed = testFeeds.find((f) => f.id === feedId) || testFeeds[0];
      console.log(`🧪 Testing single feed: ${feed.name}`);
      const result = await feedFetcher.fetchFeed(feed);
      return new Response(JSON.stringify({
        success: true,
        result,
        sampleItems: result.items.slice(0, 3)
        // Return first 3 items as examples
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Feed fetcher test error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : null
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
