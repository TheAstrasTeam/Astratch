import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhGui from './locales/zh-CN/gui.json';
import zhVm from './locales/zh-CN/vm.json';
import zhBlocks from './locales/zh-CN/blocks.json';
import zhPaint from './locales/zh-CN/paint.json';
import zhAudio from './locales/zh-CN/audio.json';

import enGui from './locales/en/gui.json';
import enVm from './locales/en/vm.json';
import enBlocks from './locales/en/blocks.json';
import enPaint from './locales/en/paint.json';
import enAudio from './locales/en/audio.json';
import { readLocalStorage } from '../utils/localstorage';
import { setItemToLocalStorage } from '../utils/localstorage';
import { localStorageIDs } from '../types/storage';

/** Astratch 当前内置并允许用户选择的界面语言。 */
export const supportedLanguages = ['zh-CN', 'en'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

/** 判断持久化的语言值是否仍受当前版本支持。 */
export const isSupportedLanguage = (value: unknown): value is SupportedLanguage =>
    typeof value === 'string' && supportedLanguages.includes(value as SupportedLanguage);

export const languageResources = {
    'zh-CN': {
        gui: zhGui,
        vm: zhVm,
        blocks: zhBlocks,
        paint: zhPaint,
        audio: zhAudio,
    },
    en: {
        gui: enGui,
        vm: enVm,
        blocks: enBlocks,
        paint: enPaint,
        audio: enAudio,
    },
};

const i18nReady = i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: languageResources,
        fallbackLng: 'en',
        debug: import.meta.env.DEV,
        ns: ['gui', 'vm', 'blocks', 'paint', 'audio'],
        defaultNS: 'gui',
        detection: {
            caches: [],
        },
        interpolation: {
            escapeValue: false,
        },
    })
    .then(async () => {
        // 兼容语言设置尚未迁移到 Settings 时使用的旧存储键。
        const latestLanguage = readLocalStorage(localStorageIDs.Language) as string | null;
        if (isSupportedLanguage(latestLanguage)) {
            await i18n.changeLanguage(latestLanguage);
        }

        setItemToLocalStorage(localStorageIDs.Language, i18n.language);
    });

// Settings 仍会同步这个旧键，避免已有用户的语言偏好在升级后丢失。
i18n.on('languageChanged', language => {
    if (isSupportedLanguage(language)) {
        setItemToLocalStorage(localStorageIDs.Language, language);
    }
});

export default i18nReady;
