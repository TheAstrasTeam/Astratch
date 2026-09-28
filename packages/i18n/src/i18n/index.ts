/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhGui from './locales/zh-CN/gui';
import zhBlocks from './locales/zh-CN/blocks';

import enGui from './locales/en/gui';
import enBlocks from './locales/en/blocks';

/** Astratch 当前内置并允许用户选择的界面语言。 */
const supportedLanguages = ['zh-CN', 'en'] as const;
type TSupportedLanguage = (typeof supportedLanguages)[number];

/** 判断持久化的语言值是否仍受当前版本支持。 */
const isSupportedLanguage = (value: unknown): value is TSupportedLanguage =>
    typeof value === 'string' && supportedLanguages.includes(value as TSupportedLanguage);

const languageResources = {
    'zh-CN': {
        gui: zhGui,
        blocks: zhBlocks,
    },
    en: {
        gui: enGui,
        blocks: enBlocks,
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
const t = i18next.t;

export {
    i18next,
    t,
    supportedLanguages,
    type TSupportedLanguage,
    isSupportedLanguage,
    languageResources,
};
