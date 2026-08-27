/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import i18next from 'i18next';

/**
 * i18next v26 将 addResourceBundle 移到了 ResourceStore 上（实例方法已移除），
 * 且其 ESM 类型没有完整声明该方法，这里给出最小类型声明。
 */
interface IResourceStoreWithBundle {
    addResourceBundle(
        lng: string,
        ns: string,
        resources: Record<string, string>,
        deep?: boolean,
        overwrite?: boolean,
    ): void;
}

/**
 * 把插件的翻译资源注册到 addon_<id> 命名空间下。
 * 只注册文件夹里实际存在的语言包，缺少的语言会走 fallback。
 * i18n 尚未初始化（store 未创建）时静默跳过。
 */
export function registerAddonI18n(
    addonId: string,
    resources: Partial<Record<string, Record<string, string>>>,
): void {
    const instance = i18next as unknown as { store?: IResourceStoreWithBundle };
    const store = instance.store;
    if (!store) return;
    for (const [language, bundle] of Object.entries(resources)) {
        if (!bundle) continue;
        store.addResourceBundle(language, `addon_${addonId}`, bundle, true, true);
    }
}
