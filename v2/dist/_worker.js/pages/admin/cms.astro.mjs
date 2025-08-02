globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, f as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_a_q7el7H.mjs';
import { $ as $$Layout } from '../../chunks/Layout_C7d_4Fi7.mjs';
/* empty css                                  */
export { renderers } from '../../renderers.mjs';

const prerender = false;
const $$Cms = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Content Management - Markets Feeds", "data-astro-cid-vegzd7he": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="cms-page" data-astro-cid-vegzd7he> <div class="container" data-astro-cid-vegzd7he> <div class="cms-header" data-astro-cid-vegzd7he> <div class="header-content" data-astro-cid-vegzd7he> <div class="header-left" data-astro-cid-vegzd7he> <a href="/ideas" class="back-link" data-astro-cid-vegzd7he> <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-vegzd7he> <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" data-astro-cid-vegzd7he></path> </svg> </a> <div class="header-title" data-astro-cid-vegzd7he> <h1 class="page-title" data-astro-cid-vegzd7he>Content Management System</h1> <span class="page-subtitle" data-astro-cid-vegzd7he>Powered by PagesCMS</span> </div> </div> </div> </div> <div class="cms-content" data-astro-cid-vegzd7he> <div class="cms-info" data-astro-cid-vegzd7he> <div class="info-card" data-astro-cid-vegzd7he> <div class="info-icon" data-astro-cid-vegzd7he>📝</div> <div class="info-content" data-astro-cid-vegzd7he> <h3 data-astro-cid-vegzd7he>Ideas & Insights</h3> <p data-astro-cid-vegzd7he>Create and manage team insights, commentary, and discoveries using our integrated content management system.</p> </div> </div> <div class="info-card" data-astro-cid-vegzd7he> <div class="info-icon" data-astro-cid-vegzd7he>🔗</div> <div class="info-content" data-astro-cid-vegzd7he> <h3 data-astro-cid-vegzd7he>RSS Sources</h3> <p data-astro-cid-vegzd7he>Manage feed sources, categories, and fetching preferences for the automated content aggregation system.</p> </div> </div> <div class="info-card" data-astro-cid-vegzd7he> <div class="info-icon" data-astro-cid-vegzd7he>👥</div> <div class="info-content" data-astro-cid-vegzd7he> <h3 data-astro-cid-vegzd7he>Team Management</h3> <p data-astro-cid-vegzd7he>Configure team member access, roles, and notification preferences for collaborative content creation.</p> </div> </div> </div> <div class="cms-actions" data-astro-cid-vegzd7he> <div class="action-group" data-astro-cid-vegzd7he> <h3 data-astro-cid-vegzd7he>Access PagesCMS</h3> <p data-astro-cid-vegzd7he>Use the PagesCMS interface to create and manage content with a user-friendly editor.</p> <div class="cms-buttons" data-astro-cid-vegzd7he> <a href="https://app.pagescms.org" target="_blank" class="cms-btn primary" data-astro-cid-vegzd7he> <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-vegzd7he> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" data-astro-cid-vegzd7he></path> </svg>
Open PagesCMS
</a> <a href="/admin/ideas" class="cms-btn secondary" data-astro-cid-vegzd7he> <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" data-astro-cid-vegzd7he> <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" data-astro-cid-vegzd7he></path> </svg>
View Analytics
</a> </div> </div> <div class="setup-guide" data-astro-cid-vegzd7he> <h3 data-astro-cid-vegzd7he>Quick Setup Guide</h3> <ol class="setup-steps" data-astro-cid-vegzd7he> <li data-astro-cid-vegzd7he> <strong data-astro-cid-vegzd7he>Connect to PagesCMS:</strong>
Visit <a href="https://app.pagescms.org" target="_blank" class="setup-link" data-astro-cid-vegzd7he>app.pagescms.org</a> and sign in with your GitHub account
</li> <li data-astro-cid-vegzd7he> <strong data-astro-cid-vegzd7he>Select Repository:</strong>
Choose this repository from your GitHub organizations/repos
</li> <li data-astro-cid-vegzd7he> <strong data-astro-cid-vegzd7he>Start Creating:</strong>
Use the "Ideas & Insights" collection to create new posts with rich media support
</li> <li data-astro-cid-vegzd7he> <strong data-astro-cid-vegzd7he>Publish & Share:</strong>
Your content will automatically appear in the Ideas feed after publishing
</li> </ol> </div> <div class="features-grid" data-astro-cid-vegzd7he> <div class="feature-card" data-astro-cid-vegzd7he> <div class="feature-icon" data-astro-cid-vegzd7he>✍️</div> <h4 data-astro-cid-vegzd7he>Rich Text Editor</h4> <p data-astro-cid-vegzd7he>Full markdown support with live preview and rich media embedding</p> </div> <div class="feature-card" data-astro-cid-vegzd7he> <div class="feature-icon" data-astro-cid-vegzd7he>🎯</div> <h4 data-astro-cid-vegzd7he>Content Types</h4> <p data-astro-cid-vegzd7he>Text posts, link previews, video embeds, tweet embeds, and images</p> </div> <div class="feature-card" data-astro-cid-vegzd7he> <div class="feature-icon" data-astro-cid-vegzd7he>🏷️</div> <h4 data-astro-cid-vegzd7he>Smart Tagging</h4> <p data-astro-cid-vegzd7he>Automatic categorization and tag management for better discoverability</p> </div> <div class="feature-card" data-astro-cid-vegzd7he> <div class="feature-icon" data-astro-cid-vegzd7he>👥</div> <h4 data-astro-cid-vegzd7he>Team Collaboration</h4> <p data-astro-cid-vegzd7he>Multi-author support with role-based permissions and review workflows</p> </div> <div class="feature-card" data-astro-cid-vegzd7he> <div class="feature-icon" data-astro-cid-vegzd7he>📊</div> <h4 data-astro-cid-vegzd7he>Analytics</h4> <p data-astro-cid-vegzd7he>Track engagement, popular topics, and content performance metrics</p> </div> <div class="feature-card" data-astro-cid-vegzd7he> <div class="feature-icon" data-astro-cid-vegzd7he>⚡</div> <h4 data-astro-cid-vegzd7he>Real-time Updates</h4> <p data-astro-cid-vegzd7he>Content appears instantly on the site after publishing through CMS</p> </div> </div> </div> </div> </div> </div> ` })} `;
}, "/home/bhuvanesh/markets-feeds/v2/src/pages/admin/cms.astro", void 0);

const $$file = "/home/bhuvanesh/markets-feeds/v2/src/pages/admin/cms.astro";
const $$url = "/admin/cms";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Cms,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
