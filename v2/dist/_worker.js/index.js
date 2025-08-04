globalThis.process ??= {}; globalThis.process.env ??= {};
import { renderers } from './renderers.mjs';
import { createExports } from './_@astrojs-ssr-adapter.mjs';
import { manifest } from './manifest_BYxhIOd3.mjs';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/admin/cache-status.astro.mjs');
const _page2 = () => import('./pages/admin/cms.astro.mjs');
const _page3 = () => import('./pages/admin/dashboard.astro.mjs');
const _page4 = () => import('./pages/admin/feeds.astro.mjs');
const _page5 = () => import('./pages/admin/ideas.astro.mjs');
const _page6 = () => import('./pages/admin/recategorization.astro.mjs');
const _page7 = () => import('./pages/admin/strategic-categories.astro.mjs');
const _page8 = () => import('./pages/api/admin/article-actions.astro.mjs');
const _page9 = () => import('./pages/api/admin/clear-cache.astro.mjs');
const _page10 = () => import('./pages/api/admin/export-data.astro.mjs');
const _page11 = () => import('./pages/api/admin/feeds.astro.mjs');
const _page12 = () => import('./pages/api/admin/refresh-feeds.astro.mjs');
const _page13 = () => import('./pages/api/admin/schedule-fetch.astro.mjs');
const _page14 = () => import('./pages/api/admin/test-feed.astro.mjs');
const _page15 = () => import('./pages/api/admin/test-feed-fetcher.astro.mjs');
const _page16 = () => import('./pages/ideas.astro.mjs');
const _page17 = () => import('./pages/search.astro.mjs');
const _page18 = () => import('./pages/_category_.astro.mjs');
const _page19 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
    ["src/pages/admin/cache-status.astro", _page1],
    ["src/pages/admin/cms.astro", _page2],
    ["src/pages/admin/dashboard.astro", _page3],
    ["src/pages/admin/feeds.astro", _page4],
    ["src/pages/admin/ideas.astro", _page5],
    ["src/pages/admin/recategorization.astro", _page6],
    ["src/pages/admin/strategic-categories.astro", _page7],
    ["src/pages/api/admin/article-actions.ts", _page8],
    ["src/pages/api/admin/clear-cache.ts", _page9],
    ["src/pages/api/admin/export-data.ts", _page10],
    ["src/pages/api/admin/feeds.ts", _page11],
    ["src/pages/api/admin/refresh-feeds.ts", _page12],
    ["src/pages/api/admin/schedule-fetch.ts", _page13],
    ["src/pages/api/admin/test-feed.ts", _page14],
    ["src/pages/api/admin/test-feed-fetcher.ts", _page15],
    ["src/pages/ideas.astro", _page16],
    ["src/pages/search.astro", _page17],
    ["src/pages/[category].astro", _page18],
    ["src/pages/index.astro", _page19]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _exports = createExports(_manifest);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
