import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from './components/editor';

import './styles/public.scss';
import './styles/menu.scss';
import './lib/initAstratch';

if (!window.isSecureContext) {
    throw new Error(`Astratch need secure context to run.
To view the dist, use \`pnpm preview\`.`);
}

// 删除加载页面和错误界面
document.querySelectorAll('.loading').forEach(ele => {
    ele.remove();
});

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <StrictMode>
            <Editor />
        </StrictMode>,
    );
