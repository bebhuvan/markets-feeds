				import worker, * as OTHER_EXPORTS from "/home/bhuvanesh/research-feed-aggregator/worker/src/worker.js";
				import * as __MIDDLEWARE_0__ from "/home/bhuvanesh/.nvm/versions/node/v22.17.0/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts";
import * as __MIDDLEWARE_1__ from "/home/bhuvanesh/.nvm/versions/node/v22.17.0/lib/node_modules/wrangler/templates/middleware/middleware-scheduled.ts";
import * as __MIDDLEWARE_2__ from "/home/bhuvanesh/.nvm/versions/node/v22.17.0/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts";

				export * from "/home/bhuvanesh/research-feed-aggregator/worker/src/worker.js";
				const MIDDLEWARE_TEST_INJECT = "__INJECT_FOR_TESTING_WRANGLER_MIDDLEWARE__";
				export const __INTERNAL_WRANGLER_MIDDLEWARE__ = [
					
					__MIDDLEWARE_0__.default,__MIDDLEWARE_1__.default,__MIDDLEWARE_2__.default
				]
				export default worker;