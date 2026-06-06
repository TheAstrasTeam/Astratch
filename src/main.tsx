import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import GUI from './gui/main/index.tsx';
import { VM } from './vm/index.ts';
import i18nReady from './i18n';
import type { TFunction } from 'i18next';

declare global {
  interface Window {
    t: TFunction;
    i18n: import('i18next').i18n;
  }
}

const vm = new VM();
i18nReady.then(i18n => {
  window.t = i18n.t.bind(i18n);
  window.i18n = i18n;
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
