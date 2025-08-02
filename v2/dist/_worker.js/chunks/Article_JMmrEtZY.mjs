globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, a as createAstro, m as maybeRenderHead, b as addAttribute, r as renderTemplate } from './astro/server_a_q7el7H.mjs';
import { f as formatTimeAgo } from './Sidebar_Cr4bUFLK.mjs';

const $$Astro = createAstro();
const $$Article = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Article;
  const { article } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<article class="article"> <div class="article-header"> <span class="source-badge">${article.sourceName}</span> <span class="article-time">${formatTimeAgo(article.publishedAt)}</span> </div> <h2 class="article-title"> <a${addAttribute(article.url, "href")} target="_blank" rel="noopener noreferrer"> ${article.title} </a> </h2> ${article.summary && renderTemplate`<p class="article-excerpt">${article.summary}</p>`} ${article.tags.length > 0 && renderTemplate`<div class="article-tags"> ${article.tags.map((tag) => renderTemplate`<span class="tag">${tag}</span>`)} </div>`} </article>`;
}, "/home/bhuvanesh/markets-feeds/v2/src/components/Article.astro", void 0);

export { $$Article as $ };
