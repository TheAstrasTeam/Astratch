import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import GUI from './gui/main/index.tsx';
import { VM } from './vm/index.ts';
import i18nReady from './i18n';
import Failed from './gui/failed/index.tsx';

// 初始化VM
const vm = new VM();
Object.assign(window, {
  vm,
});

// 等待国际化初始化
i18nReady.then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Suspense fallback="loading...">
        {vm.ProjectManager.isAPIAvailable ? (
          <GUI
            vm={vm}
          />
        ) : (
          <Failed 
            reason='file_system_access_api_not_supported'
          />
        )}
      </Suspense>
    </StrictMode>,
  )
})
