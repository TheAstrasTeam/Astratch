/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 *
 * 由 AstrasTeam 创建于 2026/7/25:
 * - 提供连续工具箱的操作按钮
 * - 通过回调与翻译函数保持按钮组件和工具箱逻辑解耦
 */

/** 翻译连续工具箱按钮使用的文本。 */
export type ContinuousToolboxControlTranslator = (key: string) => string;

/** 由工具箱提供给按钮组件的操作回调。 */
export interface ContinuousToolboxControlCallbacks {
    collapseOtherCategories(): void;
}
export let translate: ContinuousToolboxControlTranslator = key => key;

/** 配置之后创建的工具箱按钮所使用的翻译函数。 */
export function setContinuousToolboxControlTranslator(
    translator?: ContinuousToolboxControlTranslator,
) {
    translate = translator ?? (key => key);
}

/** 创建显示在工具箱分类上方的操作按钮。 */
export function createContinuousToolboxControls(
    callbacks: ContinuousToolboxControlCallbacks,
): HTMLDivElement {
    const controls = document.createElement('div');
    controls.classList.add('ash-toolbox-tools');

    const collapseOtherCategoriesButton = document.createElement('button');
    const collapseOtherCategoriesLabel = translate('blocks:utils.collapseOther');
    collapseOtherCategoriesButton.type = 'button';
    collapseOtherCategoriesButton.classList.add('ash-toolbox-tools-collapseAll');
    collapseOtherCategoriesButton.title = collapseOtherCategoriesLabel;
    collapseOtherCategoriesButton.setAttribute('aria-label', collapseOtherCategoriesLabel);
    collapseOtherCategoriesButton.addEventListener('click', () => {
        callbacks.collapseOtherCategories();
    });

    controls.appendChild(collapseOtherCategoriesButton);
    return controls;
}
