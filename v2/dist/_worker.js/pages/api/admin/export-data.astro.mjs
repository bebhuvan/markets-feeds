globalThis.process ??= {}; globalThis.process.env ??= {};
import { d as dataLoader } from '../../../chunks/data-loader_oNe7eG_G.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async ({ url }) => {
  try {
    const format = url.searchParams.get("format") || "json";
    const category = url.searchParams.get("category");
    const source = url.searchParams.get("source");
    const days = parseInt(url.searchParams.get("days") || "7");
    const allItems = await dataLoader.loadData();
    const categoryCounts = await dataLoader.getCategoryCounts();
    const sourceCounts = await dataLoader.getSourceCounts();
    let filteredItems = allItems;
    if (category) {
      filteredItems = filteredItems.filter((item) => item.category === category);
    }
    if (source) {
      filteredItems = filteredItems.filter((item) => item.sourceId === source);
    }
    if (days > 0) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1e3);
      filteredItems = filteredItems.filter((item) => new Date(item.publishedAt) >= cutoff);
    }
    const exportData = {
      metadata: {
        exportDate: (/* @__PURE__ */ new Date()).toISOString(),
        totalArticles: filteredItems.length,
        dateRange: days > 0 ? `Last ${days} days` : "All time",
        filters: { category, source },
        categoryCounts,
        sourceCounts
      },
      articles: filteredItems.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        publishedAt: item.publishedAt,
        fetchedAt: item.fetchedAt,
        category: item.category,
        sourceId: item.sourceId,
        sourceName: item.sourceName,
        summary: item.summary,
        authors: item.authors,
        tags: item.tags
      }))
    };
    if (format === "csv") {
      const headers = ["ID", "Title", "URL", "Published", "Category", "Source", "Summary"];
      const csvRows = [headers.join(",")];
      filteredItems.forEach((item) => {
        const row = [
          item.id,
          `"${item.title.replace(/"/g, '""')}"`,
          item.url,
          item.publishedAt,
          item.category,
          item.sourceName,
          `"${(item.summary || "").replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      });
      return new Response(csvRows.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="markets-feeds-export-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv"`
        }
      });
    }
    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="markets-feeds-export-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json"`
      }
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to export data",
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
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
