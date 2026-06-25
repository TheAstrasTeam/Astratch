import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import pageReload from 'vite-plugin-page-reload';
import babel from '@rolldown/plugin-babel';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        babel({ presets: [reactCompilerPreset()] }),
        pageReload([
            // Blockly 工作区不兼容 HMR，相关文件变更时直接刷新页面
            '/src/vm/blocks/**/*',
            '/src/gui/blocks/**/*',
        ]),
    ],
    css: {
        modules: {
            scopeBehaviour: 'local',
            generateScopedName: '[name]_[local]_[hash:base64:5]',
            localsConvention: 'camelCaseOnly',
        },
    },
});
