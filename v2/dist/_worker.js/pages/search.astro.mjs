globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, a as createAstro, f as renderComponent, r as renderTemplate, m as maybeRenderHead, b as addAttribute, F as Fragment } from '../chunks/astro/server_a_q7el7H.mjs';
import { $ as $$Layout } from '../chunks/Layout_C7d_4Fi7.mjs';
import { $ as $$Header, a as $$Navigation, b as $$Sidebar } from '../chunks/Sidebar_C31tbuui.mjs';
import { $ as $$Article } from '../chunks/Article_9MQxMFuT.mjs';
import { d as dataLoader } from '../chunks/data-loader_C_xSJv18.mjs';
/* empty css                                      */
/* empty css                                  */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const $$Search = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Search;
  const url = Astro2.url;
  const query = url.searchParams.get("q") || "";
  const category = url.searchParams.get("category") || "";
  const source = url.searchParams.get("source") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const filters = {};
  if (category) filters.categories = [category];
  if (source) filters.sources = [source];
  const categoryCounts = await dataLoader.getCategoryCounts();
  const sourceCounts = await dataLoader.getSourceCounts();
  let searchResults = null;
  let totalArticles = 0;
  if (query.trim()) {
    searchResults = await dataLoader.searchArticles(query, filters, page, 50);
    totalArticles = searchResults.total;
  } else {
    const allItems = await dataLoader.loadData();
    let filteredItems = allItems;
    if (category) {
      filteredItems = filteredItems.filter((item) => item.category === category);
    }
    if (source) {
      filteredItems = filteredItems.filter((item) => item.sourceId === source);
    }
    const paginationResult = dataLoader.paginate(filteredItems, page, 50);
    searchResults = {
      items: paginationResult.items,
      total: filteredItems.length,
      query: ""
    };
    totalArticles = filteredItems.length;
  }
  const items = searchResults.items;
  const hasResults = items.length > 0;
  const isSearch = query.trim().length > 0;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": query ? `Search: ${query} - Markets Feeds` : "Search - Markets Feeds", "data-astro-cid-ipsxrsrh": true }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, { "data-astro-cid-ipsxrsrh": true })} ${renderComponent($$result2, "Navigation", $$Navigation, { "categoryCounts": categoryCounts, "data-astro-cid-ipsxrsrh": true })} ${maybeRenderHead()}<div class="container" data-astro-cid-ipsxrsrh> <!-- Search Header --> <div class="search-header" data-astro-cid-ipsxrsrh> <h1 class="search-title" data-astro-cid-ipsxrsrh> ${isSearch ? `Search Results` : "Browse Articles"} </h1> <div class="search-form" data-astro-cid-ipsxrsrh> <form method="GET" action="/search" class="search-form-container" data-astro-cid-ipsxrsrh> <div class="search-input-group" data-astro-cid-ipsxrsrh> <input type="search" name="q"${addAttribute(query, "value")} placeholder="Search articles, companies, topics..." class="search-input" autocomplete="off" data-astro-cid-ipsxrsrh> <button type="submit" class="search-button" data-astro-cid-ipsxrsrh> <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-ipsxrsrh> <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" data-astro-cid-ipsxrsrh></path> </svg> </button> </div> <!-- Search Filters --> <div class="search-filters" data-astro-cid-ipsxrsrh> <select name="category" class="filter-select" data-astro-cid-ipsxrsrh> <option value="" data-astro-cid-ipsxrsrh>All Categories</option> ${Object.entries(categoryCounts).map(([key, count]) => renderTemplate`<option${addAttribute(key, "value")}${addAttribute(category === key, "selected")} data-astro-cid-ipsxrsrh> ${key.charAt(0).toUpperCase() + key.slice(1)} (${count})
</option>`)} </select> <input type="hidden" name="page" value="1" data-astro-cid-ipsxrsrh> </div> </form> </div> <!-- Search Results Info --> <div class="search-info" data-astro-cid-ipsxrsrh> ${isSearch ? renderTemplate`<p data-astro-cid-ipsxrsrh>
Found <strong data-astro-cid-ipsxrsrh>${totalArticles.toLocaleString()}</strong> results for
<strong data-astro-cid-ipsxrsrh>"${query}"</strong> ${category && ` in ${category}`} ${source && ` from ${source}`} </p>` : renderTemplate`<p data-astro-cid-ipsxrsrh>
Showing <strong data-astro-cid-ipsxrsrh>${totalArticles.toLocaleString()}</strong> articles
${category && ` in ${category}`} ${source && ` from ${source}`} </p>`} </div> </div> <div class="content-grid" data-astro-cid-ipsxrsrh> <!-- Main Results --> <main class="feed" data-astro-cid-ipsxrsrh> ${!hasResults ? renderTemplate`<div class="no-results" data-astro-cid-ipsxrsrh> <div class="no-results-icon" data-astro-cid-ipsxrsrh>🔍</div> <h2 data-astro-cid-ipsxrsrh>No articles found</h2> <p data-astro-cid-ipsxrsrh>Try adjusting your search terms or filters</p> <div class="search-suggestions" data-astro-cid-ipsxrsrh> <h3 data-astro-cid-ipsxrsrh>Popular searches:</h3> <div class="suggestion-tags" data-astro-cid-ipsxrsrh> <a href="/search?q=earnings" class="suggestion-tag" data-astro-cid-ipsxrsrh>earnings</a> <a href="/search?q=fed" class="suggestion-tag" data-astro-cid-ipsxrsrh>federal reserve</a> <a href="/search?q=inflation" class="suggestion-tag" data-astro-cid-ipsxrsrh>inflation</a> <a href="/search?q=markets" class="suggestion-tag" data-astro-cid-ipsxrsrh>stock markets</a> <a href="/search?q=ai" class="suggestion-tag" data-astro-cid-ipsxrsrh>artificial intelligence</a> </div> </div> </div>` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-ipsxrsrh": true }, { "default": async ($$result3) => renderTemplate` <div class="articles" data-astro-cid-ipsxrsrh> ${items.map((article) => renderTemplate`${renderComponent($$result3, "Article", $$Article, { "article": article, "data-astro-cid-ipsxrsrh": true })}`)} </div> ${totalArticles > 50 && renderTemplate`<div class="pagination" data-astro-cid-ipsxrsrh> ${page > 1 ? renderTemplate`<a${addAttribute(`/search?q=${encodeURIComponent(query)}&category=${category}&page=${page - 1}`, "href")} class="pagination-btn" data-astro-cid-ipsxrsrh>
← Previous
</a>` : renderTemplate`<span class="pagination-btn disabled" data-astro-cid-ipsxrsrh>← Previous</span>`} <span class="pagination-info" data-astro-cid-ipsxrsrh>
Page ${page} of ${Math.ceil(totalArticles / 50)} </span> ${page < Math.ceil(totalArticles / 50) ? renderTemplate`<a${addAttribute(`/search?q=${encodeURIComponent(query)}&category=${category}&page=${page + 1}`, "href")} class="pagination-btn" data-astro-cid-ipsxrsrh>
Next →
</a>` : renderTemplate`<span class="pagination-btn disabled" data-astro-cid-ipsxrsrh>Next →</span>`} </div>`}` })}`} </main> <!-- Sidebar --> ${renderComponent($$result2, "Sidebar", $$Sidebar, { "sourceCounts": sourceCounts, "categoryCounts": categoryCounts, "data-astro-cid-ipsxrsrh": true })} </div> </div> ` })}  `;
}, "/home/bhuvanesh/markets-feeds/v2/src/pages/search.astro", void 0);

const $$file = "/home/bhuvanesh/markets-feeds/v2/src/pages/search.astro";
const $$url = "/search";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Search,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
