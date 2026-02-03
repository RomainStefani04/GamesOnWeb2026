import { defineConfig } from 'vite';

export default defineConfig({
    optimizeDeps: {
        exclude: ['@babylonjs/havok']
    },
    assetsInclude: ['**/*.wasm'],
    server: {
        headers: {
            // Force le bon MIME type pour les fichiers WASM
            '*.wasm': 'application/wasm'
        }
    }
});