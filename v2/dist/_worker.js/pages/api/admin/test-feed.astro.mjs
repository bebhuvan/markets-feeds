globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

async function testFeedUrl(url) {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15e3);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Markets-Feeds-Bot/2.0 (+https://markets-feeds.com)",
        "Accept": "application/rss+xml, application/xml, text/xml, application/atom+xml"
      }
    });
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    if (!response.ok) {
      return {
        url,
        status: "error",
        responseTime,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    if (!text.includes("<") || !text.includes(">")) {
      return {
        url,
        status: "error",
        responseTime,
        statusCode: response.status,
        contentType,
        error: "Response does not appear to be XML/RSS content"
      };
    }
    const result = {
      url,
      status: "success",
      responseTime,
      statusCode: response.status,
      contentType,
      warnings: []
    };
    try {
      const isRSS = text.includes("<rss") || text.includes("<feed");
      if (!isRSS) {
        result.warnings?.push("Content may not be a valid RSS/Atom feed");
      }
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        result.title = titleMatch[1].trim();
      }
      const descMatch = text.match(/<description[^>]*>([^<]+)<\/description>/i);
      if (descMatch) {
        result.description = descMatch[1].trim();
      }
      const dateMatch = text.match(/<(?:lastBuildDate|updated)[^>]*>([^<]+)<\/(?:lastBuildDate|updated)>/i);
      if (dateMatch) {
        result.lastBuildDate = dateMatch[1].trim();
      }
      const itemMatches = text.match(/<(?:item|entry)[^>]*>/gi);
      result.itemCount = itemMatches ? itemMatches.length : 0;
      if (result.itemCount === 0) {
        result.warnings?.push("Feed contains no items");
        result.status = "warning";
      }
      if (!result.title) {
        result.warnings?.push("Feed has no title");
      }
      if (!result.description) {
        result.warnings?.push("Feed has no description");
      }
      if (!result.lastBuildDate) {
        result.warnings?.push("Feed has no publication date");
      }
      if (!contentType.includes("xml") && !contentType.includes("rss") && !contentType.includes("atom")) {
        result.warnings?.push(`Unexpected content type: ${contentType}`);
      }
      if (result.warnings && result.warnings.length > 0 && result.status === "success") {
        result.status = "warning";
      }
    } catch (parseError) {
      result.warnings?.push("Failed to parse feed metadata");
      result.status = "warning";
    }
    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    if (error instanceof Error && error.name === "AbortError") {
      return {
        url,
        status: "error",
        responseTime,
        error: "Request timeout (15 seconds)"
      };
    }
    return {
      url,
      status: "error",
      responseTime,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { url, feedId } = body;
    if (!url) {
      return new Response(JSON.stringify({
        success: false,
        message: "Feed URL is required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    try {
      new URL(url);
    } catch {
      return new Response(JSON.stringify({
        success: false,
        message: "Invalid URL format"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const testResult = await testFeedUrl(url);
    return new Response(JSON.stringify({
      success: true,
      message: `Feed test completed: ${testResult.status}`,
      data: {
        feedId: feedId || null,
        test: testResult,
        recommendations: generateRecommendations(testResult)
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to test feed",
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
function generateRecommendations(testResult) {
  const recommendations = [];
  if (testResult.status === "error") {
    recommendations.push("Fix the connection or URL issue before adding this feed");
    if (testResult.statusCode === 404) {
      recommendations.push("Check if the feed URL is correct and still exists");
    } else if (testResult.statusCode === 403) {
      recommendations.push("The feed may require authentication or have access restrictions");
    } else if (testResult.statusCode && testResult.statusCode >= 500) {
      recommendations.push("The feed server appears to be experiencing issues");
    }
  }
  if (testResult.responseTime > 1e4) {
    recommendations.push("Feed response time is slow (>10s) - consider monitoring performance");
  }
  if (testResult.itemCount && testResult.itemCount < 5) {
    recommendations.push("Feed has very few items - verify it's actively updated");
  }
  if (testResult.itemCount && testResult.itemCount > 100) {
    recommendations.push("Feed has many items - consider using pagination if available");
  }
  if (testResult.warnings && testResult.warnings.length > 0) {
    recommendations.push("Address the warnings to ensure optimal feed processing");
  }
  if (testResult.status === "success" && testResult.itemCount && testResult.itemCount > 0) {
    recommendations.push("Feed looks good and ready to be added to the system");
  }
  return recommendations;
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
