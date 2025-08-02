globalThis.process ??= {}; globalThis.process.env ??= {};
const CATEGORIES = {
  // Core content types - strategic split
  "markets": "Markets",
  // Main hub for stocks, trading, general market news
  "earnings": "Earnings",
  // Distinct content type with dedicated audience
  "ma": "M&A",
  // Mergers & acquisitions for deal-focused readers
  "crypto": "Crypto",
  // Cryptocurrency for crypto audience
  // Major content areas
  "macro": "Economics",
  // Economic data, policy, analysis
  "technology": "Technology",
  // Tech industry news, innovation
  "research": "Research",
  // Academic papers, analysis, studies
  // Strategic additions for specialized audiences
  "central-banking": "Central Banking",
  // Fed, ECB, monetary policy
  "commodities": "Commodities",
  // Oil, gold, agricultural products
  "regulation": "Regulation",
  // Financial rules, compliance
  // Media types
  "videos": "Videos",
  "blogs": "Analysis",
  "news": "News",
  "podcasts": "Podcasts"
};

export { CATEGORIES as C };
