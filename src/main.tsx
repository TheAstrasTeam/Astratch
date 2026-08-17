/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import GUI from './gui/index.tsx';
import { VM } from './vm/index.ts';
import i18nReady from './i18n';
import ErrorPage from './gui/error/index.tsx';
import { applyGuiTheme } from './lib/Theme/guiThemeManager.ts';
import './gui/styles/constants.scss';
import './gui/styles/zIndex.scss';
import { modal } from './components/Modal/modal.ts';
import { ModalProvider } from '@reactleaf/modal';
import { initBuiltInSettings } from './settings/index.ts';
import { Settings } from './settings/SettingsRegistry.ts';
import { events } from './types/vm.ts';
import { Toast } from './lib/ToastManager/index.ts';
import i18next from 'i18next';
import { isSupportedLanguage } from './i18n/index.ts';

// 等待国际化初始化
await i18nReady.then(async () => {
    await initBuiltInSettings();
    // 导入设置项
    // 一个很有趣的动画效果，渐隐加载
    const Loading: HTMLElement | null = document.querySelector('.loading');
    if (Loading) {
        // 热加载没必要播放动画
        if (import.meta.hot) {
            Loading.remove();
        } else {
            Loading.style.animation = 'loadingOut 0.3s forwards';
            setTimeout(() => {
                Loading.remove();
            }, 300);
        }
    }

    // 初始化VM
    const vm = new VM();
    Object.assign(window, {
        vm,
        Settings,
        Toast,
    });

    applyGuiTheme(); //初始化主题

    Settings.store.subscribe((state, prevState) => {
        if (
            state.guiThemeMode !== prevState.guiThemeMode ||
            state.guiThemeAccent !== prevState.guiThemeAccent
        ) {
            applyGuiTheme();
            vm.emit(events.UPDATE_THEME);
        }

        if (state.language !== prevState.language && isSupportedLanguage(state.language)) {
            void i18next.changeLanguage(state.language);
        }
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <Suspense fallback='loading...'>
                {/*  不加延迟会导致错误的关闭 */}
                <ModalProvider manager={modal} defaultLayerOptions={{ closeDelay: 180 }}>
                    {vm.projectManager.isAPIAvailable ? <GUI vm={vm} /> : <ErrorPage />}
                </ModalProvider>
            </Suspense>
        </StrictMode>,
    );
});
