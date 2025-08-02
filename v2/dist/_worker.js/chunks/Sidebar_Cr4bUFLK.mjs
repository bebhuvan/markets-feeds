globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, a as createAstro, m as maybeRenderHead, r as renderTemplate, b as addAttribute } from './astro/server_a_q7el7H.mjs';
/* empty css                              */
import { C as CATEGORIES } from './categories_YOHYfcsb.mjs';

function formatTimeAgo(date) {
  const now = /* @__PURE__ */ new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1e3);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return then.toLocaleDateString();
}

const $$Astro$2 = createAstro();
const $$Header = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Header;
  const { lastUpdate = /* @__PURE__ */ new Date(), totalArticles = 0 } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<header class="header" data-astro-cid-3ef6ksr2> <div class="container" data-astro-cid-3ef6ksr2> <div class="header-top" data-astro-cid-3ef6ksr2> <div class="header-brand" data-astro-cid-3ef6ksr2> <a href="/" class="logo" data-astro-cid-3ef6ksr2> <span class="logo-icon" data-astro-cid-3ef6ksr2>📊</span> <span class="logo-text" data-astro-cid-3ef6ksr2>Markets Feeds</span> </a> <span class="tagline" data-astro-cid-3ef6ksr2>Financial Intelligence Hub</span> </div> <div class="header-stats" data-astro-cid-3ef6ksr2> <div class="stat" data-astro-cid-3ef6ksr2> <span class="stat-value" data-astro-cid-3ef6ksr2>${totalArticles.toLocaleString()}</span> <span class="stat-label" data-astro-cid-3ef6ksr2>articles</span> </div> <div class="stat" data-astro-cid-3ef6ksr2> <span class="stat-value" data-astro-cid-3ef6ksr2>${formatTimeAgo(lastUpdate)}</span> <span class="stat-label" data-astro-cid-3ef6ksr2>updated</span> </div> <a href="/sources" class="header-link" data-astro-cid-3ef6ksr2>Sources</a> <a href="/rss.xml" class="header-link" title="RSS Feed" data-astro-cid-3ef6ksr2> <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-3ef6ksr2> <path d="M3.429 5.1v2.4c7.248 0 13.114 5.886 13.114 13.143h2.4C18.943 12.18 11.891 5.1 3.429 5.1zm0 4.8v2.4c3.832 0 6.857 3.035 6.857 6.857h2.4c0-5.128-4.129-9.257-9.257-9.257zM6.171 16.486c0 1.51-1.224 2.743-2.743 2.743S.686 17.996.686 16.486s1.224-2.743 2.743-2.743 2.742 1.233 2.742 2.743z" data-astro-cid-3ef6ksr2></path> </svg> </a> </div> </div> </div> </header> `;
}, "/home/bhuvanesh/markets-feeds/v2/src/components/Header.astro", void 0);

const $$Astro$1 = createAstro();
const $$Navigation = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Navigation;
  const { currentCategory, categoryCounts } = Astro2.props;
  const mainCategories = ["markets", "earnings", "ma", "crypto", "macro", "technology"];
  const otherCategories = Object.keys(CATEGORIES).filter((cat) => !mainCategories.includes(cat));
  return renderTemplate`${maybeRenderHead()}<nav class="nav" data-astro-cid-pux6a34n> <div class="container" data-astro-cid-pux6a34n> <div class="nav-container" data-astro-cid-pux6a34n> <div class="nav-tabs" data-astro-cid-pux6a34n> <a href="/"${addAttribute(`nav-tab ${!currentCategory ? "active" : ""}`, "class")} data-astro-cid-pux6a34n>
All <span class="count" data-astro-cid-pux6a34n>${Object.values(categoryCounts).reduce((a, b) => a + b, 0)}</span> </a>  ${mainCategories.map(
    (key) => categoryCounts[key] > 0 && renderTemplate`<a${addAttribute(`/${key}`, "href")}${addAttribute(`nav-tab ${currentCategory === key ? "active" : ""}`, "class")} data-astro-cid-pux6a34n> ${CATEGORIES[key]} <span class="count" data-astro-cid-pux6a34n>${categoryCounts[key]}</span> </a>`
  )}  <a href="/ideas"${addAttribute(`nav-tab ${Astro2.url.pathname === "/ideas" ? "active" : ""}`, "class")} data-astro-cid-pux6a34n>
Ideas
<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-pux6a34n> <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" data-astro-cid-pux6a34n></path> </svg> </a>  ${otherCategories.some((cat) => categoryCounts[cat] > 0) && renderTemplate`<div class="nav-dropdown" data-astro-cid-pux6a34n> <button class="nav-tab dropdown-trigger" data-astro-cid-pux6a34n>
More
<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-pux6a34n> <path d="M7 10l5 5 5-5z" data-astro-cid-pux6a34n></path> </svg> </button> <div class="dropdown-menu" data-astro-cid-pux6a34n> ${otherCategories.map(
    (key) => categoryCounts[key] > 0 && renderTemplate`<a${addAttribute(`/${key}`, "href")}${addAttribute(`dropdown-item ${currentCategory === key ? "active" : ""}`, "class")} data-astro-cid-pux6a34n> ${CATEGORIES[key]} <span class="count" data-astro-cid-pux6a34n>${categoryCounts[key]}</span> </a>`
  )} </div> </div>`} </div> <div class="nav-actions" data-astro-cid-pux6a34n> <form method="GET" action="/search" class="search-form" data-astro-cid-pux6a34n> <input type="search" name="q" class="search-box" placeholder="Search articles..." autocomplete="off" data-astro-cid-pux6a34n> <button type="submit" class="search-submit" data-astro-cid-pux6a34n> <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-pux6a34n> <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" data-astro-cid-pux6a34n></path> </svg> </button> </form> </div> </div> </div> </nav>  `;
}, "/home/bhuvanesh/markets-feeds/v2/src/components/Navigation.astro", void 0);

const $$Astro = createAstro();
const $$Sidebar = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Sidebar;
  const { sourceCounts, categoryCounts, currentCategory } = Astro2.props;
  const categoryGroups = {
    "Core Markets": ["markets", "macro", "policy"],
    "Sectors": ["technology", "research"],
    "Analysis": ["blogs", "videos"],
    "Data": ["filings", "news"]
  };
  const topSources = Object.entries(sourceCounts).sort(([, a], [, b]) => b - a).slice(0, 8);
  const quickFilters = [
    { id: "breaking", label: "\u{1F525} Breaking News", count: 12 },
    { id: "earnings", label: "\u{1F4CA} Earnings", count: 28 },
    { id: "fed", label: "\u{1F3DB}\uFE0F Fed News", count: 5 },
    { id: "crypto", label: "\u20BF Crypto", count: 15 }
  ];
  return renderTemplate`${maybeRenderHead()}<aside class="sidebar" data-astro-cid-ssfzsv2f> <!-- Market Data Section Removed --> <!-- Category Navigation --> <div class="sidebar-section" data-astro-cid-ssfzsv2f> <h3 class="sidebar-title" data-astro-cid-ssfzsv2f>Categories</h3> ${Object.entries(categoryGroups).map(([groupName, categories]) => renderTemplate`<div class="category-group" data-astro-cid-ssfzsv2f> <div class="group-label" data-astro-cid-ssfzsv2f>${groupName}</div> <ul class="category-list" data-astro-cid-ssfzsv2f> ${categories.map((categoryKey) => {
    const count = categoryCounts[categoryKey] || 0;
    if (count === 0) return null;
    return renderTemplate`<li class="category-item" data-astro-cid-ssfzsv2f> <a${addAttribute(`/${categoryKey}`, "href")}${addAttribute(`category-link ${currentCategory === categoryKey ? "active" : ""}`, "class")} data-astro-cid-ssfzsv2f> <span class="category-name" data-astro-cid-ssfzsv2f>${CATEGORIES[categoryKey]}</span> <span class="category-count" data-astro-cid-ssfzsv2f>${count}</span> </a> </li>`;
  })} </ul> </div>`)} </div> <!-- Quick Filters --> <div class="sidebar-section" data-astro-cid-ssfzsv2f> <h3 class="sidebar-title" data-astro-cid-ssfzsv2f>Quick Filters</h3> <div class="filter-buttons" data-astro-cid-ssfzsv2f> ${quickFilters.map((filter) => renderTemplate`<button class="filter-btn"${addAttribute(filter.id, "data-filter")} data-astro-cid-ssfzsv2f> <span data-astro-cid-ssfzsv2f>${filter.label}</span> <span class="filter-count" data-astro-cid-ssfzsv2f>${filter.count}</span> </button>`)} </div> </div> <!-- Top Sources --> <div class="sidebar-section" data-astro-cid-ssfzsv2f> <h3 class="sidebar-title" data-astro-cid-ssfzsv2f>Top Sources</h3> <ul class="source-list" data-astro-cid-ssfzsv2f> ${topSources.map(([sourceId, count]) => renderTemplate`<li class="source-item" data-astro-cid-ssfzsv2f> <a${addAttribute(`/source/${sourceId}`, "href")} class="source-link" data-astro-cid-ssfzsv2f> <span class="source-name" data-astro-cid-ssfzsv2f>${sourceId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span> <span class="source-count" data-astro-cid-ssfzsv2f>${count}</span> </a> </li>`)} </ul> </div> <!-- Economic Calendar --> <div class="sidebar-section" data-astro-cid-ssfzsv2f> <h3 class="sidebar-title" data-astro-cid-ssfzsv2f>This Week</h3> <div class="calendar-events" data-astro-cid-ssfzsv2f> <div class="calendar-event" data-astro-cid-ssfzsv2f> <div class="event-date" data-astro-cid-ssfzsv2f>Aug 2</div> <div class="event-title" data-astro-cid-ssfzsv2f>Jobs Report</div> <div class="event-impact high" data-astro-cid-ssfzsv2f>High Impact</div> </div> <div class="calendar-event" data-astro-cid-ssfzsv2f> <div class="event-date" data-astro-cid-ssfzsv2f>Aug 5</div> <div class="event-title" data-astro-cid-ssfzsv2f>Fed Meeting</div> <div class="event-impact medium" data-astro-cid-ssfzsv2f>Medium</div> </div> <div class="calendar-event" data-astro-cid-ssfzsv2f> <div class="event-date" data-astro-cid-ssfzsv2f>Aug 7</div> <div class="event-title" data-astro-cid-ssfzsv2f>CPI Data</div> <div class="event-impact high" data-astro-cid-ssfzsv2f>High Impact</div> </div> </div> </div> </aside>  `;
}, "/home/bhuvanesh/markets-feeds/v2/src/components/Sidebar.astro", void 0);

export { $$Header as $, $$Navigation as a, $$Sidebar as b, formatTimeAgo as f };
