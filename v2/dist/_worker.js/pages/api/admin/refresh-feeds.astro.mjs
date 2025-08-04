globalThis.process ??= {}; globalThis.process.env ??= {};
import { d as dataLoader } from '../../../chunks/data-loader_C_xSJv18.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request }) => {
  try {
    dataLoader.clearCache();
    const allItems = await dataLoader.loadData();
    const categoryCounts = await dataLoader.getCategoryCounts();
    const sourceCounts = await dataLoader.getSourceCounts();
    const last24Hours = allItems.filter((item) => {
      const itemDate = new Date(item.publishedAt);
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1e3);
      return itemDate >= cutoff;
    }).length;
    const lastUpdate = allItems.length > 0 ? new Date(Math.max(...allItems.map((item) => new Date(item.fetchedAt || item.publishedAt).getTime()))) : /* @__PURE__ */ new Date();
    return new Response(JSON.stringify({
      success: true,
      message: "Feeds refreshed successfully",
      data: {
        totalArticles: allItems.length,
        last24Hours,
        activeFeeds: Object.keys(sourceCounts).length,
        lastUpdate: lastUpdate.toISOString(),
        categoryCounts,
        sourceCounts
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error refreshing feeds:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to refresh feeds",
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
