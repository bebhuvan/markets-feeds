globalThis.process ??= {}; globalThis.process.env ??= {};
import { d as dataLoader } from '../../../chunks/data-loader_oNe7eG_G.mjs';
import { i as ideasLoader } from '../../../chunks/ideas-loader_DKY5xBjU.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { cacheType = "all" } = body;
    let clearedCaches = [];
    if (cacheType === "all" || cacheType === "feeds") {
      dataLoader.clearCache();
      clearedCaches.push("feeds");
    }
    if (cacheType === "all" || cacheType === "ideas") {
      if ("clearCache" in ideasLoader) {
        ideasLoader.clearCache();
      }
      clearedCaches.push("ideas");
    }
    const metrics = {
      totalArticles: 0,
      totalIdeas: 0,
      lastUpdate: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      const allItems = await dataLoader.loadData();
      metrics.totalArticles = allItems.length;
      metrics.lastUpdate = allItems.length > 0 ? new Date(Math.max(...allItems.map((item) => new Date(item.fetchedAt || item.publishedAt).getTime()))).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
    } catch (error) {
      console.error("Error reloading feeds after cache clear:", error);
    }
    try {
      const allIdeas = await ideasLoader.loadPosts();
      metrics.totalIdeas = allIdeas.length;
    } catch (error) {
      console.error("Error reloading ideas after cache clear:", error);
    }
    return new Response(JSON.stringify({
      success: true,
      message: `Cache cleared successfully: ${clearedCaches.join(", ")}`,
      data: {
        clearedCaches,
        metrics,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to clear cache",
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
