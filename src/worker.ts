// Worker entry: Astro handles requests; the cron trigger (wrangler.jsonc) runs the daily data purge.
import { handle } from '@astrojs/cloudflare/handler';
import { purgeExpiredPersonalData, purgeRateLimits } from './lib/server/db';

export default {
  fetch: handle,
  async scheduled(_controller, _env, ctx) {
    ctx.waitUntil(Promise.all([purgeExpiredPersonalData(), purgeRateLimits()]));
  },
} satisfies ExportedHandler<Env>;
