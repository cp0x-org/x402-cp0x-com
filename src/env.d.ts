/// <reference types="vite/client" />

// Injected by vite.config.js `define`: true for the single-file IPFS build.
declare const __HASH_ROUTER__: boolean;

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
