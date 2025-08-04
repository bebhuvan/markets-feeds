globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, a as createAstro, f as renderComponent, r as renderTemplate, m as maybeRenderHead, F as Fragment, b as addAttribute } from '../chunks/astro/server_a_q7el7H.mjs';
import { $ as $$Layout } from '../chunks/Layout_C7d_4Fi7.mjs';
import { $ as $$Header, a as $$Navigation } from '../chunks/Navigation_D8ZskTcs.mjs';
import { $ as $$Article } from '../chunks/Article_Bdh5iTQI.mjs';
import { $ as $$Sidebar } from '../chunks/Sidebar_CAaIqBpS.mjs';
import { d as dataLoader } from '../chunks/data-loader_C_xSJv18.mjs';
import { C as CATEGORIES } from '../chunks/categories_YOHYfcsb.mjs';
/* empty css                                      */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const $$category = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$category;
  const { category } = Astro2.params;
  const page = parseInt(Astro2.url.searchParams.get("page") || "1");
  if (!category || !CATEGORIES[category]) {
    return Astro2.redirect("/");
  }
  const categoryItems = await dataLoader.getByCategory(category);
  const categoryCounts = await dataLoader.getCategoryCounts();
  const { items, totalPages, totalItems, hasNext, hasPrev } = dataLoader.paginate(categoryItems, page);
  const categoryLabel = CATEGORIES[category];
  const sourceCounts = await dataLoader.getSourceCounts();
  const lastUpdate = categoryItems.length > 0 ? new Date(Math.max(...categoryItems.map((item) => new Date(item.fetchedAt || item.publishedAt).getTime()))) : /* @__PURE__ */ new Date();
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${categoryLabel} - Markets Feeds` }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, { "lastUpdate": lastUpdate, "totalArticles": categoryItems.length })} ${renderComponent($$result2, "Navigation", $$Navigation, { "currentCategory": category, "categoryCounts": categoryCounts })} ${maybeRenderHead()}<div class="container"> <div class="content-grid"> <!-- Main Feed --> <main class="feed"> <div class="feed-header"> <h1 class="feed-title">${categoryLabel}</h1> <div class="feed-meta">${totalItems} articles</div> </div> ${totalItems === 0 ? renderTemplate`<div style="text-align: center; padding: 80px 20px; color: #6b7280;"> <p>No articles found in ${categoryLabel}</p> </div>` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <div class="articles"> ${items.map((article) => renderTemplate`${renderComponent($$result3, "Article", $$Article, { "article": article })}`)} </div> ${totalPages > 1 && renderTemplate`<div class="pagination"> ${hasPrev ? renderTemplate`<a${addAttribute(`/${category}?page=${page - 1}`, "href")} class="pagination-btn">
← Previous
</a>` : renderTemplate`<span class="pagination-btn disabled">← Previous</span>`} <span class="pagination-info">Page ${page} of ${totalPages}</span> ${hasNext ? renderTemplate`<a${addAttribute(`/${category}?page=${page + 1}`, "href")} class="pagination-btn">
Next →
</a>` : renderTemplate`<span class="pagination-btn disabled">Next →</span>`} </div>`}` })}`} </main> <!-- Sidebar --> ${renderComponent($$result2, "Sidebar", $$Sidebar, { "sourceCounts": sourceCounts, "categoryCounts": categoryCounts, "currentCategory": category })} </div> </div> ` })}`;
}, "/home/bhuvanesh/markets-feeds/v2/src/pages/[category].astro", void 0);

const $$file = "/home/bhuvanesh/markets-feeds/v2/src/pages/[category].astro";
const $$url = "/[category]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$category,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
