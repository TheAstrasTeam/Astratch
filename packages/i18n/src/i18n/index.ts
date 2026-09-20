/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhGui from './locales/zh-CN/gui';
import zhVm from './locales/zh-CN/vm';
import zhBlocks from './locales/zh-CN/blocks';
import zhPaint from './locales/zh-CN/paint';
import zhAudio from './locales/zh-CN/audio';

import enGui from './locales/en/gui';
import enVm from './locales/en/vm';
import enBlocks from './locales/en/blocks';
import enPaint from './locales/en/paint';
import enAudio from './locales/en/audio';

/** Astratch 当前内置并允许用户选择的界面语言。 */
const supportedLanguages = ['zh-CN', 'en'] as const;
type TSupportedLanguage = (typeof supportedLanguages)[number];

/** 判断持久化的语言值是否仍受当前版本支持。 */
const isSupportedLanguage = (value: unknown): value is TSupportedLanguage =>
    typeof value === 'string' && supportedLanguages.includes(value as TSupportedLanguage);

const languageResources = {
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

await i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: languageResources,
        fallbackLng: 'en',
        ns: ['gui', 'vm', 'blocks', 'paint', 'audio'],
        defaultNS: 'gui',
        detection: {
            caches: [],
        },
        interpolation: {
            escapeValue: false,
        },
    });

export {
    i18next,
    supportedLanguages,
    type TSupportedLanguage,
    isSupportedLanguage,
    languageResources,
};
