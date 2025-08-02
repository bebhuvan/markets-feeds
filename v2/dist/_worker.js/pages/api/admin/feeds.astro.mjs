globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

let feedsStore = [
  {
    "id": "feed_1704067200_sample1",
    "name": "Wall Street Journal Markets",
    "url": "https://feeds.wsj.com/public/resources/MWI_NEWS_MARKETS",
    "sourceId": "wsj-markets",
    "category": "markets",
    "fetchInterval": 30,
    "active": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "tags": ["finance", "markets"],
    "description": "Latest market news and analysis from WSJ"
  },
  {
    "id": "feed_1704067260_sample2",
    "name": "Bloomberg Economics",
    "url": "https://feeds.bloomberg.com/economics/news.rss",
    "sourceId": "bloomberg-economics",
    "category": "macro",
    "fetchInterval": 60,
    "active": true,
    "createdAt": "2025-01-01T00:01:00.000Z",
    "updatedAt": "2025-01-01T00:01:00.000Z",
    "tags": ["economics", "macro"],
    "description": "Economic news and data from Bloomberg"
  },
  {
    "id": "feed_1704067320_sample3",
    "name": "Financial Times Technology",
    "url": "https://www.ft.com/technology?format=rss",
    "sourceId": "ft-technology",
    "category": "technology",
    "fetchInterval": 120,
    "active": false,
    "createdAt": "2025-01-01T00:02:00.000Z",
    "updatedAt": "2025-01-01T00:02:00.000Z",
    "tags": ["technology", "fintech"],
    "description": "Technology news affecting financial markets"
  }
];
async function loadFeedsConfig() {
  return [...feedsStore];
}
async function saveFeedsConfig(feeds) {
  feedsStore = [...feeds];
}
function generateFeedId() {
  return `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function validateFeed(feed) {
  const errors = [];
  if (!feed.name?.trim()) {
    errors.push("Feed name is required");
  }
  if (!feed.url?.trim()) {
    errors.push("Feed URL is required");
  } else {
    try {
      new URL(feed.url);
    } catch {
      errors.push("Invalid feed URL");
    }
  }
  if (!feed.sourceId?.trim()) {
    errors.push("Source ID is required");
  } else if (!/^[a-z0-9-]+$/.test(feed.sourceId)) {
    errors.push("Source ID must contain only lowercase letters, numbers, and hyphens");
  }
  if (!feed.category?.trim()) {
    errors.push("Category is required");
  }
  if (!feed.fetchInterval || feed.fetchInterval < 5 || feed.fetchInterval > 1440) {
    errors.push("Fetch interval must be between 5 and 1440 minutes");
  }
  return errors;
}
const GET = async ({ url }) => {
  try {
    const feeds = await loadFeedsConfig();
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    let filteredFeeds = feeds;
    if (status) {
      filteredFeeds = filteredFeeds.filter(
        (feed) => status === "active" ? feed.active : !feed.active
      );
    }
    if (category) {
      filteredFeeds = filteredFeeds.filter((feed) => feed.category === category);
    }
    return new Response(JSON.stringify({
      success: true,
      data: {
        feeds: filteredFeeds,
        total: filteredFeeds.length,
        active: feeds.filter((f) => f.active).length,
        inactive: feeds.filter((f) => !f.active).length
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to load feeds",
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, url, sourceId, category, fetchInterval = 30, active = true, tags, description } = body;
    const errors = validateFeed({ name, url, sourceId, category, fetchInterval });
    if (errors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        message: "Validation failed",
        errors
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const feeds = await loadFeedsConfig();
    if (feeds.some((feed) => feed.sourceId === sourceId)) {
      return new Response(JSON.stringify({
        success: false,
        message: "Source ID already exists",
        errors: ["A feed with this source ID already exists"]
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const newFeed = {
      id: generateFeedId(),
      name: name.trim(),
      url: url.trim(),
      sourceId: sourceId.trim(),
      category: category.trim(),
      fetchInterval: parseInt(fetchInterval),
      active: Boolean(active),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      tags: Array.isArray(tags) ? tags : [],
      description: description?.trim() || ""
    };
    feeds.push(newFeed);
    await saveFeedsConfig(feeds);
    return new Response(JSON.stringify({
      success: true,
      message: "Feed added successfully",
      data: newFeed
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to add feed",
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, name, url, sourceId, category, fetchInterval, active, tags, description } = body;
    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        message: "Feed ID is required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const errors = validateFeed({ name, url, sourceId, category, fetchInterval });
    if (errors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        message: "Validation failed",
        errors
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const feeds = await loadFeedsConfig();
    const feedIndex = feeds.findIndex((feed) => feed.id === id);
    if (feedIndex === -1) {
      return new Response(JSON.stringify({
        success: false,
        message: "Feed not found"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (feeds.some((feed) => feed.sourceId === sourceId && feed.id !== id)) {
      return new Response(JSON.stringify({
        success: false,
        message: "Source ID already exists",
        errors: ["A feed with this source ID already exists"]
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const existingFeed = feeds[feedIndex];
    feeds[feedIndex] = {
      ...existingFeed,
      name: name.trim(),
      url: url.trim(),
      sourceId: sourceId.trim(),
      category: category.trim(),
      fetchInterval: parseInt(fetchInterval),
      active: Boolean(active),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      tags: Array.isArray(tags) ? tags : existingFeed.tags || [],
      description: description?.trim() || existingFeed.description || ""
    };
    await saveFeedsConfig(feeds);
    return new Response(JSON.stringify({
      success: true,
      message: "Feed updated successfully",
      data: feeds[feedIndex]
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to update feed",
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const DELETE = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, ids } = body;
    if (!id && (!ids || !Array.isArray(ids))) {
      return new Response(JSON.stringify({
        success: false,
        message: "Feed ID or IDs array is required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const feeds = await loadFeedsConfig();
    const idsToDelete = id ? [id] : ids;
    const feedsToDelete = feeds.filter((feed) => idsToDelete.includes(feed.id));
    if (feedsToDelete.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: "No feeds found with the provided ID(s)"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const remainingFeeds = feeds.filter((feed) => !idsToDelete.includes(feed.id));
    await saveFeedsConfig(remainingFeeds);
    return new Response(JSON.stringify({
      success: true,
      message: `${feedsToDelete.length} feed(s) deleted successfully`,
      data: {
        deletedFeeds: feedsToDelete.length,
        deletedIds: idsToDelete,
        remainingFeeds: remainingFeeds.length
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to delete feed(s)",
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  POST,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
