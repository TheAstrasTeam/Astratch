import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import GUI from './gui/main/index.tsx';
import { VM } from './vm/index.ts';
import i18nReady from './i18n';

// 初始化VM
const vm = new VM();

// 等待国际化初始化
i18nReady.then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Suspense fallback="loading...">
        <GUI
          vm={vm}
        />
      </Suspense>
    </StrictMode>,
  )
})
