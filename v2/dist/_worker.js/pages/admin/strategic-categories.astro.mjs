globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, f as renderComponent, r as renderTemplate, m as maybeRenderHead, b as addAttribute } from '../../chunks/astro/server_a_q7el7H.mjs';
import { $ as $$Layout } from '../../chunks/Layout_C7d_4Fi7.mjs';
/* empty css                                                   */
export { renderers } from '../../renderers.mjs';

const prerender = false;
const $$StrategicCategories = createComponent(($$result, $$props, $$slots) => {
  const strategicBreakdown = {
    "Core Navigation": {
      "markets": {
        name: "Markets",
        description: "Main destination for stocks, trading, general market news",
        example: "Stock movements, market analysis, trading volumes"
      },
      "earnings": {
        name: "Earnings",
        description: "Quarterly results, guidance, analyst calls",
        example: "Apple Q3 results, Microsoft earnings beat"
      },
      "ma": {
        name: "M&A",
        description: "Mergers, acquisitions, deals",
        example: "Microsoft acquires AI startup, merger announcements"
      },
      "crypto": {
        name: "Crypto",
        description: "Digital assets, blockchain news",
        example: "Bitcoin price, Ethereum updates, DeFi news"
      },
      "macro": {
        name: "Economics",
        description: "Economic data, policy, analysis",
        example: "GDP data, inflation reports, economic forecasts"
      },
      "technology": {
        name: "Technology",
        description: "Tech industry news, innovation",
        example: "AI developments, tech company news, innovation"
      }
    },
    "Specialized Tabs": {
      "central-banking": {
        name: "Central Banking",
        description: "Fed, ECB, monetary policy decisions",
        example: "Fed meeting minutes, Powell speeches, rate decisions"
      },
      "commodities": {
        name: "Commodities",
        description: "Oil, gold, agricultural products",
        example: "Oil price movements, gold futures, wheat exports"
      },
      "regulation": {
        name: "Regulation",
        description: "Financial rules, compliance, enforcement",
        example: "SEC actions, new banking rules, compliance updates"
      },
      "research": {
        name: "Research",
        description: "Academic papers, analysis, studies",
        example: "NBER papers, economic research, market studies"
      }
    },
    "Media Types": {
      "videos": { name: "Videos", description: "Video content, interviews, presentations" },
      "podcasts": { name: "Podcasts", description: "Audio content, financial podcasts" },
      "blogs": { name: "Analysis", description: "Opinion pieces, commentary, blogs" },
      "news": { name: "News", description: "Breaking news, general updates" }
    }
  };
  const expectedDistribution = [
    { category: "Markets", oldPercent: 43, newPercent: 28, change: -15 },
    { category: "Earnings", oldPercent: 0, newPercent: 8, change: 8 },
    { category: "M&A", oldPercent: 0, newPercent: 3, change: 3 },
    { category: "Crypto", oldPercent: 0, newPercent: 4, change: 4 },
    { category: "Economics", oldPercent: 8, newPercent: 6, change: -2 },
    { category: "Technology", oldPercent: 6, newPercent: 4, change: -2 },
    { category: "Central Banking", oldPercent: 0, newPercent: 5, change: 5 },
    { category: "Commodities", oldPercent: 0, newPercent: 3, change: 3 }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Strategic Categories - Markets Feeds", "data-astro-cid-uhxhf7zz": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="strategic-page" data-astro-cid-uhxhf7zz> <div class="container" data-astro-cid-uhxhf7zz> <!-- Header --> <header class="page-header" data-astro-cid-uhxhf7zz> <div class="header-content" data-astro-cid-uhxhf7zz> <div class="header-left" data-astro-cid-uhxhf7zz> <a href="/admin/recategorization" class="back-link" data-astro-cid-uhxhf7zz> <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-uhxhf7zz> <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" data-astro-cid-uhxhf7zz></path> </svg> </a> <div class="header-title" data-astro-cid-uhxhf7zz> <h1 class="page-title" data-astro-cid-uhxhf7zz>Strategic Categorization</h1> <span class="page-subtitle" data-astro-cid-uhxhf7zz>Minimal, focused splits for better UX</span> </div> </div> </div> </header> <!-- Strategy Overview --> <section class="strategy-section" data-astro-cid-uhxhf7zz> <div class="strategy-card" data-astro-cid-uhxhf7zz> <h2 class="strategy-title" data-astro-cid-uhxhf7zz>🎯 Strategic Approach</h2> <div class="strategy-content" data-astro-cid-uhxhf7zz> <div class="strategy-point" data-astro-cid-uhxhf7zz> <strong data-astro-cid-uhxhf7zz>Keep "Markets" as Main Hub</strong> <p data-astro-cid-uhxhf7zz>Markets remains the primary destination for general stock news, trading, and market analysis</p> </div> <div class="strategy-point" data-astro-cid-uhxhf7zz> <strong data-astro-cid-uhxhf7zz>Extract Distinct Content Types</strong> <p data-astro-cid-uhxhf7zz>Pull out earnings, M&A, and crypto - content types that have dedicated audiences</p> </div> <div class="strategy-point" data-astro-cid-uhxhf7zz> <strong data-astro-cid-uhxhf7zz>Add Strategic Categories</strong> <p data-astro-cid-uhxhf7zz>Central Banking and Commodities for specialized financial professionals</p> </div> <div class="strategy-point" data-astro-cid-uhxhf7zz> <strong data-astro-cid-uhxhf7zz>Avoid Over-Categorization</strong> <p data-astro-cid-uhxhf7zz>14 focused categories instead of 37+ granular ones</p> </div> </div> </div> </section> <!-- Category Breakdown --> <div class="breakdown-grid" data-astro-cid-uhxhf7zz> ${Object.entries(strategicBreakdown).map(([groupName, categories]) => renderTemplate`<section class="breakdown-section" data-astro-cid-uhxhf7zz> <h3 class="breakdown-title" data-astro-cid-uhxhf7zz>${groupName}</h3> <div class="categories-list" data-astro-cid-uhxhf7zz> ${Object.entries(categories).map(([key, category]) => renderTemplate`<div class="category-card" data-astro-cid-uhxhf7zz> <div class="category-header" data-astro-cid-uhxhf7zz> <span class="category-name" data-astro-cid-uhxhf7zz>${category.name}</span> <span class="category-key" data-astro-cid-uhxhf7zz>${key}</span> </div> <p class="category-description" data-astro-cid-uhxhf7zz>${category.description}</p> ${category.example && renderTemplate`<div class="category-example" data-astro-cid-uhxhf7zz> <strong data-astro-cid-uhxhf7zz>Examples:</strong> ${category.example} </div>`} </div>`)} </div> </section>`)} </div> <!-- Expected Impact --> <section class="impact-section" data-astro-cid-uhxhf7zz> <h2 class="impact-title" data-astro-cid-uhxhf7zz>📊 Expected Distribution Changes</h2> <div class="impact-grid" data-astro-cid-uhxhf7zz> ${expectedDistribution.map((item) => renderTemplate`<div class="impact-card" data-astro-cid-uhxhf7zz> <div class="impact-category" data-astro-cid-uhxhf7zz>${item.category}</div> <div class="impact-change" data-astro-cid-uhxhf7zz> <div class="old-percent" data-astro-cid-uhxhf7zz> <span class="label" data-astro-cid-uhxhf7zz>Before:</span> <span class="value" data-astro-cid-uhxhf7zz>${item.oldPercent}%</span> </div> <div class="arrow" data-astro-cid-uhxhf7zz>→</div> <div class="new-percent" data-astro-cid-uhxhf7zz> <span class="label" data-astro-cid-uhxhf7zz>After:</span> <span class="value" data-astro-cid-uhxhf7zz>${item.newPercent}%</span> </div> </div> <div${addAttribute(`impact-indicator ${item.change > 0 ? "positive" : item.change < 0 ? "negative" : "neutral"}`, "class")} data-astro-cid-uhxhf7zz> ${item.change > 0 ? `+${item.change}%` : item.change < 0 ? `${item.change}%` : "No change"} </div> </div>`)} </div> </section> <!-- Benefits --> <section class="benefits-section" data-astro-cid-uhxhf7zz> <h2 class="benefits-title" data-astro-cid-uhxhf7zz>✅ Key Benefits</h2> <div class="benefits-grid" data-astro-cid-uhxhf7zz> <div class="benefit-card" data-astro-cid-uhxhf7zz> <div class="benefit-icon" data-astro-cid-uhxhf7zz>🎯</div> <h4 data-astro-cid-uhxhf7zz>Focused Discovery</h4> <p data-astro-cid-uhxhf7zz>Users can find earnings, deals, or crypto content directly without digging through general markets</p> </div> <div class="benefit-card" data-astro-cid-uhxhf7zz> <div class="benefit-icon" data-astro-cid-uhxhf7zz>🏠</div> <h4 data-astro-cid-uhxhf7zz>Familiar Navigation</h4> <p data-astro-cid-uhxhf7zz>Markets remains the main hub that users expect, with logical additions</p> </div> <div class="benefit-card" data-astro-cid-uhxhf7zz> <div class="benefit-icon" data-astro-cid-uhxhf7zz>📈</div> <h4 data-astro-cid-uhxhf7zz>Professional Segments</h4> <p data-astro-cid-uhxhf7zz>Central Banking and Commodities serve specialized financial professionals</p> </div> <div class="benefit-card" data-astro-cid-uhxhf7zz> <div class="benefit-icon" data-astro-cid-uhxhf7zz>🚀</div> <h4 data-astro-cid-uhxhf7zz>Clean Interface</h4> <p data-astro-cid-uhxhf7zz>14 strategic categories vs 37 granular ones - easier to navigate</p> </div> <div class="benefit-card" data-astro-cid-uhxhf7zz> <div class="benefit-icon" data-astro-cid-uhxhf7zz>🔄</div> <h4 data-astro-cid-uhxhf7zz>Future Flexibility</h4> <p data-astro-cid-uhxhf7zz>Can add more categories later based on user behavior and content growth</p> </div> <div class="benefit-card" data-astro-cid-uhxhf7zz> <div class="benefit-icon" data-astro-cid-uhxhf7zz>📊</div> <h4 data-astro-cid-uhxhf7zz>Better Analytics</h4> <p data-astro-cid-uhxhf7zz>Clearer content performance metrics with meaningful category distinctions</p> </div> </div> </section> <!-- Action Panel --> <section class="action-panel" data-astro-cid-uhxhf7zz> <div class="panel-content" data-astro-cid-uhxhf7zz> <div class="panel-info" data-astro-cid-uhxhf7zz> <h3 data-astro-cid-uhxhf7zz>Ready to Implement Strategic Categories?</h3> <p data-astro-cid-uhxhf7zz>
This approach balances discoverability with simplicity, keeping Markets as the main hub 
              while extracting the most distinct content types for focused audiences.
</p> </div> <div class="panel-actions" data-astro-cid-uhxhf7zz> <a href="/admin/recategorization" class="panel-btn secondary" data-astro-cid-uhxhf7zz> <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-uhxhf7zz> <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" data-astro-cid-uhxhf7zz></path> </svg>
View Preview
</a> <button class="panel-btn primary" onclick="alert('Strategic recategorization will be implemented!')" data-astro-cid-uhxhf7zz> <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-uhxhf7zz> <path d="M8 5v14l11-7z" data-astro-cid-uhxhf7zz></path> </svg>
Implement Changes
</button> </div> </div> </section> </div> </div> ` })} `;
}, "/home/bhuvanesh/markets-feeds/v2/src/pages/admin/strategic-categories.astro", void 0);

const $$file = "/home/bhuvanesh/markets-feeds/v2/src/pages/admin/strategic-categories.astro";
const $$url = "/admin/strategic-categories";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$StrategicCategories,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
