import { defineConfig } from 'vitest/config';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import svgr from 'vite-plugin-svgr';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), svgr()],
    test: {
        environment: 'jsdom',
        setupFiles: ['fake-indexeddb/auto'],
    },
    resolve: {
        alias: {
            '@as': resolve(import.meta.dirname, 'src/assets'),
        },
    },
});
