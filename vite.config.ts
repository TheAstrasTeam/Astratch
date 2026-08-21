import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import pageReload from 'vite-plugin-page-reload';
import babel from '@rolldown/plugin-babel';
import svgr from 'vite-plugin-svgr';

const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8')) as {
    version: string;
};

// eslint-disable-next-line no-console
console.log(`\x1b[34m
               ░░░░░░░░░                                
          ░░░░░░░░░░░░░░░░░░░                           
       ░░░░░░░░░░░░░░░░░░░░░░░░░                        
     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                      
   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                    
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                   
 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                  
 ░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒░░                
░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░              
░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░            
░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░          
░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░          
 ░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░          
  ░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░          
  ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░          
   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░          
  ░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░          
  ░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░            
  ░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▓▒▒▒▒░░░░░░░░░░░░░░░              
  ░░░░░░░░░░░░░░░░░░░░░   ░░░░░░░░░░░░                  
    ░░░░░░░░░░░░░░░░░                                   
     ░░░░░░░░░░░░░░░                                    
       ░░░░░░░░░░░                                       
\x1b[0m
\x1b[1mAstratch\x1b[0m

Welcome! GitHub organization at\x1b[34m https://github.com/TheAstrasTeam/Astratch\x1b[0m
Give we a star⭐ in\x1b[34m https://github.com/TheAstrasTeam/Astratch\x1b[0m , Thank you!
\x1b[0m`);

// https://vite.dev/config/
export default defineConfig({
    root: 'src',
    publicDir: resolve(import.meta.dirname, 'src/public'),
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [
        react(),
        svgr(),
        babel({ presets: [reactCompilerPreset()] }),
        pageReload([
            // Blockly 工作区不兼容 HMR，相关文件变更时直接刷新页面
            '/src/vm/runtime/blocks/**/*',
            '/src/gui/blocks/**/*',
            '/src/lib/BlocklyAdapter/**/*',
        ]),
    ],
    css: {
        modules: {
            scopeBehaviour: 'local',
            generateScopedName: '[folder]_[local]_[hash:base64:5]',
            localsConvention: 'camelCaseOnly',
        },
    },
});
