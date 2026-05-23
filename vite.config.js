import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: [
      '@babylonjs/core',
      '@babylonjs/gui',
      '@babylonjs/havok',
      '@babylonjs/materials',
      '@babylonjs/inspector',
    ]
  },
  assetsInclude: ['**/*.wasm'],
  server: {
    headers: {
      '*.wasm': 'application/wasm'
    }
  }
});