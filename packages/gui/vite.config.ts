import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), svgr()],
    root: 'src',
    publicDir: resolve(import.meta.dirname, 'public'),
    css: {
        modules: {
            scopeBehaviour: 'local',
            generateScopedName: '[folder]_[local]_[hash:base64:5]',
            localsConvention: 'camelCaseOnly',
        },
    },
    resolve: {
        alias: {
            '@as': resolve(import.meta.dirname, 'src/assets'),
        },
    },
});
