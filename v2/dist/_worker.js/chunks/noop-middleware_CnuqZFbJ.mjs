globalThis.process ??= {}; globalThis.process.env ??= {};
import { N as NOOP_MIDDLEWARE_HEADER } from './astro/server_a_q7el7H.mjs';

const NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

export { NOOP_MIDDLEWARE_FN as N };
