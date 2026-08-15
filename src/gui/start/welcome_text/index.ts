/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 此部分内容经过AI编辑
 */

import i18next from 'i18next';

// 后续可以加入更多语言
import zhTexts from './zh-CN.json';
import enTexts from './en.json';

const texts: Record<string, string[]> = {
    'zh-CN': zhTexts,
    en: enTexts,
};

export const getWelcomeText = (name: string): string => {
    const lang = i18next.language;
    const arr = lang in texts ? texts[lang] : texts.en;
    const pick = arr.length ? arr[Math.floor(Math.random() * arr.length)] : '';
    return pick.replaceAll('{{name}}', name);
};
