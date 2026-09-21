import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { i18next } from 'astratch-i18n';

// 删除加载页面
document.querySelectorAll('.loading').forEach(ele => ele.remove());

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <StrictMode>
            <span>{i18next.t('gui:button.ok')}</span>
        </StrictMode>,
    );
