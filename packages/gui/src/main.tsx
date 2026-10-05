import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from './components/editor';

import './styles/public.scss';
import './styles/menu.scss';
import './lib/initAstratch';

if (!window.isSecureContext) {
    document.querySelector('.errorMessage')!.textContent = `Astratch need secure context to run.
To view the dist, use \`pnpm preview\`.`;
    throw new Error('Astratch need run in safe page!');
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
