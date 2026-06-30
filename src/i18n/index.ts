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
import { localStorageIDs, readLocalStorage } from '../utils/localstorage';

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
        // 检测已设定的语言
        const latestLanguage = readLocalStorage(localStorageIDs.Language) as string | null;
        if (latestLanguage) {
            await i18n.changeLanguage(latestLanguage);
        }
    });

export default i18nReady;
