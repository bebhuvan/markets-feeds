globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, articleId } = body;
    if (!action || !articleId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Missing required parameters: action and articleId"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let responseMessage = "";
    switch (action) {
      case "togglePriority":
        responseMessage = `Article ${articleId} priority toggled successfully`;
        break;
      case "hideArticle":
        responseMessage = `Article ${articleId} hidden successfully`;
        break;
      case "archive":
        responseMessage = `Article ${articleId} archived successfully`;
        break;
      case "feature":
        responseMessage = `Article ${articleId} featured successfully`;
        break;
      default:
        return new Response(JSON.stringify({
          success: false,
          message: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
    }
    return new Response(JSON.stringify({
      success: true,
      message: responseMessage,
      data: {
        articleId,
        action,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error processing article action:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to process article action",
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
