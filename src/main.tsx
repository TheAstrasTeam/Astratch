import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import GUI from './gui/main/index.tsx';
import { VM } from './vm/index.ts';
import i18nReady from './i18n';
import Failed from './gui/failed/index.tsx';
import { applyGuiTheme } from './lib/Theme/guiThemeManager.ts';

// 初始化VM
const vm = new VM();
Object.assign(window, {
    vm,
});

// 等待国际化初始化
await i18nReady.then(() => {
    applyGuiTheme(); //初始化主题
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <Suspense fallback='loading...'>
                {vm.projectManager.isAPIAvailable ? (
                    <GUI vm={vm} />
                ) : (
                    <Failed reason='file_system_access_api_not_supported' />
                )}
            </Suspense>
        </StrictMode>,
    );
});
