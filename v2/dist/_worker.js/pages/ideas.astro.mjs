globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, a as createAstro, f as renderComponent, r as renderTemplate, m as maybeRenderHead, u as unescapeHTML, b as addAttribute } from '../chunks/astro/server_a_q7el7H.mjs';
import { $ as $$Layout } from '../chunks/Layout_C7d_4Fi7.mjs';
import { $ as $$Header, a as $$Navigation } from '../chunks/Navigation_D8ZskTcs.mjs';
import { $ as $$Sidebar } from '../chunks/Sidebar_CAaIqBpS.mjs';
import { i as ideasLoader } from '../chunks/ideas-loader_DKY5xBjU.mjs';
import { d as dataLoader } from '../chunks/data-loader_C_xSJv18.mjs';
/* empty css                                      */
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const $$Ideas = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Ideas;
  const page = parseInt(Astro2.url.searchParams.get("page") || "1");
  const allPosts = await ideasLoader.loadPosts();
  const { posts, totalPages, totalPosts, hasNext, hasPrev } = ideasLoader.paginate(allPosts, page, 10);
  await ideasLoader.getPopularTags(8);
  const allItems = await dataLoader.loadData();
  const categoryCounts = await dataLoader.getCategoryCounts();
  const sourceCounts = await dataLoader.getSourceCounts();
  const lastUpdate = allItems.length > 0 ? new Date(Math.max(...allItems.map((item) => new Date(item.fetchedAt || item.publishedAt).getTime()))) : /* @__PURE__ */ new Date();
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Ideas - Markets Feeds", "data-astro-cid-blbmxt5i": true }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, { "lastUpdate": lastUpdate, "totalArticles": allItems.length, "data-astro-cid-blbmxt5i": true })} ${renderComponent($$result2, "Navigation", $$Navigation, { "categoryCounts": categoryCounts, "currentCategory": "ideas", "data-astro-cid-blbmxt5i": true })} ${maybeRenderHead()}<div class="container" data-astro-cid-blbmxt5i> <div class="content-grid" data-astro-cid-blbmxt5i> <!-- Main Ideas Feed --> <main class="feed" data-astro-cid-blbmxt5i> <div class="feed-header" data-astro-cid-blbmxt5i> <h1 class="feed-title" data-astro-cid-blbmxt5i>Ideas & Insights</h1> <div class="feed-meta" data-astro-cid-blbmxt5i>${totalPosts} posts</div> </div> <!-- Compose Box --> <div class="compose-box" id="composeBox" data-astro-cid-blbmxt5i> <div class="compose-header" data-astro-cid-blbmxt5i> <div class="avatar" data-astro-cid-blbmxt5i>RF</div> <textarea class="compose-input" placeholder="Share an insight, link, or observation..." rows="3" data-astro-cid-blbmxt5i></textarea> </div> <div class="compose-actions" data-astro-cid-blbmxt5i> <div class="compose-tools" data-astro-cid-blbmxt5i> <button class="tool-btn" title="Add Link" data-astro-cid-blbmxt5i> <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-blbmxt5i> <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" data-astro-cid-blbmxt5i></path> </svg> </button> <button class="tool-btn" title="Add Tags" data-astro-cid-blbmxt5i> <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-blbmxt5i> <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z" data-astro-cid-blbmxt5i></path> </svg> </button> </div> <div class="compose-submit" data-astro-cid-blbmxt5i> <button class="share-btn" disabled data-astro-cid-blbmxt5i>Share</button> </div> </div> </div> <!-- Feed --> ${posts.length === 0 ? renderTemplate`<div class="no-posts" data-astro-cid-blbmxt5i> <h3 data-astro-cid-blbmxt5i>No ideas yet</h3> <p data-astro-cid-blbmxt5i>Share your first insight using the compose button above.</p> </div>` : renderTemplate`<div class="ideas-posts" data-astro-cid-blbmxt5i> ${posts.map((post) => renderTemplate`<article class="idea-post" data-astro-cid-blbmxt5i> <div class="post-header" data-astro-cid-blbmxt5i> <div class="post-avatar" data-astro-cid-blbmxt5i> ${post.authorName ? post.authorName.split(" ").map((n) => n[0]).join("") : "T"} </div> <div class="post-meta" data-astro-cid-blbmxt5i> <div class="post-author" data-astro-cid-blbmxt5i>${post.authorName || post.author}</div> <div class="post-time" data-astro-cid-blbmxt5i> ${new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })} </div> </div> </div> <div class="post-content" data-astro-cid-blbmxt5i> <h3 class="post-title" data-astro-cid-blbmxt5i>${post.title || post.frontmatter?.title}</h3> <div class="post-text" data-astro-cid-blbmxt5i>${unescapeHTML(post.content)}</div> ${post.type === "link" && post.linkPreview && renderTemplate`<div class="link-preview"${addAttribute(`openLink('${post.linkPreview.url}')`, "onclick")} data-astro-cid-blbmxt5i> ${post.linkPreview.image && renderTemplate`<img${addAttribute(post.linkPreview.image, "src")}${addAttribute(post.linkPreview.title, "alt")} class="preview-image" data-astro-cid-blbmxt5i>`} <div class="preview-content" data-astro-cid-blbmxt5i> <div class="preview-title" data-astro-cid-blbmxt5i>${post.linkPreview.title}</div> <div class="preview-description" data-astro-cid-blbmxt5i>${post.linkPreview.description}</div> <div class="preview-domain" data-astro-cid-blbmxt5i>${post.linkPreview.domain}</div> </div> </div>`} ${post.type === "video" && post.videoEmbed && renderTemplate`<div class="video-embed" data-astro-cid-blbmxt5i> <div class="video-placeholder"${addAttribute(`background-image: url(${post.videoEmbed.thumbnail})`, "style")} data-astro-cid-blbmxt5i> <div class="play-button" data-astro-cid-blbmxt5i> <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-blbmxt5i> <path d="M8 5v14l11-7z" data-astro-cid-blbmxt5i></path> </svg> </div> <div class="video-title" data-astro-cid-blbmxt5i>${post.videoEmbed.title}</div> </div> </div>`} ${post.type === "tweet" && post.tweetEmbed && renderTemplate`<div class="tweet-embed" data-astro-cid-blbmxt5i> <div class="tweet-header" data-astro-cid-blbmxt5i> <div class="tweet-avatar" data-astro-cid-blbmxt5i></div> <div class="tweet-author-info" data-astro-cid-blbmxt5i> <span class="tweet-author" data-astro-cid-blbmxt5i>${post.tweetEmbed.author}</span> <span class="tweet-handle" data-astro-cid-blbmxt5i>${post.tweetEmbed.handle}</span> </div> </div> <div class="tweet-content" data-astro-cid-blbmxt5i>${post.tweetEmbed.content}</div> </div>`} </div> ${post.tags && post.tags.length > 0 && renderTemplate`<div class="post-tags" data-astro-cid-blbmxt5i> ${post.tags.map((tag) => renderTemplate`<span class="tag" data-astro-cid-blbmxt5i>${tag}</span>`)} </div>`} <div class="post-actions" data-astro-cid-blbmxt5i> <button class="action-btn" data-action="insight" data-astro-cid-blbmxt5i> <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-blbmxt5i> <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" data-astro-cid-blbmxt5i></path> </svg> <span data-astro-cid-blbmxt5i>${post.reactions.insights}</span> </button> <button class="action-btn" data-action="comment" data-astro-cid-blbmxt5i> <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-blbmxt5i> <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" data-astro-cid-blbmxt5i></path> </svg> <span data-astro-cid-blbmxt5i>${post.reactions.comments}</span> </button> <button class="action-btn" data-action="share" data-astro-cid-blbmxt5i> <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-blbmxt5i> <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92S19.61 16.08 18 16.08z" data-astro-cid-blbmxt5i></path> </svg> <span data-astro-cid-blbmxt5i>Share</span> </button> </div> </article>`)}  ${totalPages > 1 && renderTemplate`<div class="pagination" data-astro-cid-blbmxt5i> ${hasPrev ? renderTemplate`<a${addAttribute(`/ideas?page=${page - 1}`, "href")} class="pagination-btn" data-astro-cid-blbmxt5i>
← Previous
</a>` : renderTemplate`<span class="pagination-btn disabled" data-astro-cid-blbmxt5i>← Previous</span>`} <span class="pagination-info" data-astro-cid-blbmxt5i>Page ${page} of ${totalPages}</span> ${hasNext ? renderTemplate`<a${addAttribute(`/ideas?page=${page + 1}`, "href")} class="pagination-btn" data-astro-cid-blbmxt5i>
Next →
</a>` : renderTemplate`<span class="pagination-btn disabled" data-astro-cid-blbmxt5i>Next →</span>`} </div>`} </div>`} </main> <!-- Sidebar --> ${renderComponent($$result2, "Sidebar", $$Sidebar, { "sourceCounts": sourceCounts, "categoryCounts": categoryCounts, "currentCategory": "ideas", "data-astro-cid-blbmxt5i": true })} </div> </div> ` })}  `;
}, "/home/bhuvanesh/markets-feeds/v2/src/pages/ideas.astro", void 0);

const $$file = "/home/bhuvanesh/markets-feeds/v2/src/pages/ideas.astro";
const $$url = "/ideas";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Ideas,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
