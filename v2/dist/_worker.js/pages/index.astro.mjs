globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, a as createAstro, f as renderComponent, r as renderTemplate, m as maybeRenderHead, b as addAttribute } from '../chunks/astro/server_a_q7el7H.mjs';
import { $ as $$Layout } from '../chunks/Layout_C7d_4Fi7.mjs';
import { $ as $$Header, a as $$Navigation, b as $$Sidebar } from '../chunks/Sidebar_C31tbuui.mjs';
import { $ as $$Article } from '../chunks/Article_9MQxMFuT.mjs';
import { d as dataLoader } from '../chunks/data-loader_C_xSJv18.mjs';
/* empty css                                      */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const page = parseInt(Astro2.url.searchParams.get("page") || "1");
  const allItems = await dataLoader.loadData();
  const categoryCounts = await dataLoader.getCategoryCounts();
  const { items, totalPages, totalItems, hasNext, hasPrev } = dataLoader.paginate(allItems, page);
  const lastUpdate = allItems.length > 0 ? new Date(Math.max(...allItems.map((item) => new Date(item.fetchedAt || item.publishedAt).getTime()))) : /* @__PURE__ */ new Date();
  const sourceCounts = await dataLoader.getSourceCounts();
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Markets Feeds - Financial News Aggregator" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, { "lastUpdate": lastUpdate })} ${renderComponent($$result2, "Navigation", $$Navigation, { "categoryCounts": categoryCounts })} ${maybeRenderHead()}<div class="container"> <div class="content-grid"> <!-- Main Feed --> <main class="feed"> <div class="feed-header"> <h1 class="feed-title">All Sources</h1> <div class="feed-meta">${totalItems} articles</div> </div> <div class="articles"> ${items.map((article) => renderTemplate`${renderComponent($$result2, "Article", $$Article, { "article": article })}`)} </div> ${totalPages > 1 && renderTemplate`<div class="pagination"> ${hasPrev ? renderTemplate`<a${addAttribute(`/?page=${page - 1}`, "href")} class="pagination-btn">
← Previous
</a>` : renderTemplate`<span class="pagination-btn disabled">← Previous</span>`} <span class="pagination-info">Page ${page} of ${totalPages}</span> ${hasNext ? renderTemplate`<a${addAttribute(`/?page=${page + 1}`, "href")} class="pagination-btn">
Next →
</a>` : renderTemplate`<span class="pagination-btn disabled">Next →</span>`} </div>`} </main> <!-- Sidebar --> ${renderComponent($$result2, "Sidebar", $$Sidebar, { "sourceCounts": sourceCounts, "categoryCounts": categoryCounts })} </div> </div> ` })}`;
}, "/home/bhuvanesh/markets-feeds/v2/src/pages/index.astro", void 0);

const $$file = "/home/bhuvanesh/markets-feeds/v2/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
