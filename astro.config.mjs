// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  site: 'https://martinteoyz.com',
  // View Transitions are enabled per-page via the <ClientRouter /> in TVLayout.
  integrations: [svelte()],
});
