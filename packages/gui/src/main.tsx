import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from './components/editor';

import './lib/initAstratch';

// 删除加载页面
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
