import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Build a fully self-contained single-file `index.html` (all JS, CSS, images
// and fonts inlined) for hosting on IPFS. Enabled with `--mode ipfs`.
//
// On IPFS there is no server to rewrite clean URLs, so the app must:
//   * use hash-based routing (see src/router)          -> __HASH_ROUTER__
//   * reference nothing by absolute path (base './')   -> base
//   * inline every asset instead of emitting files     -> assetsInlineLimit + viteSingleFile
function ipfsHtmlPlugin() {
  return {
    name: 'ipfs-html',
    transformIndexHtml(html) {
      // The runtime `/config.js` file does not exist on IPFS; window._env_ is
      // optional and the app falls back to sane defaults, so drop the tag.
      let out = html.replace(/\s*<script[^>]*src=["']\/config\.js["'][^>]*><\/script>/i, '');

      // Inline the favicon as a data URI so the page has zero external requests.
      try {
        const favicon = readFileSync(fileURLToPath(new URL('./public/favicon.png', import.meta.url)));
        const dataUri = `data:image/png;base64,${favicon.toString('base64')}`;
        out = out.replace(/href=["'][^"']*favicon\.png["']/i, `href="${dataUri}"`);
      } catch {
        /* favicon is optional */
      }
      return out;
    },
  };
}

export default defineConfig(({ mode }) => {
  const isIpfs = mode === 'ipfs';

  return {
    base: isIpfs ? './' : '/',
    define: {
      __HASH_ROUTER__: JSON.stringify(isIpfs),
    },
    plugins: [vue(), ...(isIpfs ? [ipfsHtmlPlugin(), viteSingleFile()] : [])],
    server: {
      // Dev convenience: forward /api calls to a locally running x402-api
      // backend so empty FACILITATORS_API_URL / CP0X_SERVICES_API_URL work in dev.
      proxy: {
        '/api': 'http://localhost:8080',
      },
    },
    build: isIpfs
      ? {
          // Inline every asset (images, fonts) as a base64 data URI.
          assetsInlineLimit: Number.MAX_SAFE_INTEGER,
          cssCodeSplit: false,
          // Emit into a separate dir so it never clobbers the normal build.
          outDir: 'dist-ipfs',
          // Everything is inlined; don't copy public/ (favicon is embedded,
          // config.js is not used on IPFS) so the output is a lone index.html.
          copyPublicDir: false,
        }
      : {},
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
