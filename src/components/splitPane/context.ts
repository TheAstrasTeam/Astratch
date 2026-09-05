/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 *
 * @author AI
 */

import { createContext, useContext } from 'react';

/** 分割位置变化的来源：用户拖拽分割条，或程序化设置尺寸/clamp 修正 */
export type TSplitPaneMoveSource = 'drag' | 'api';

export interface ISplitPaneApi {
    /** 设置第一面板的占用尺寸（px），内部会经 clampRatio 约束；animate 为 true 时带过渡动画 */
    setFirstSize: (size: number, animate?: boolean) => void;
    /** 设置第二面板的占用尺寸（px），内部会经 clampRatio 约束；animate 为 true 时带过渡动画 */
    setSecondSize: (size: number, animate?: boolean) => void;
    /** 读取第一面板当前占用尺寸（px） */
    getFirstSize: () => number;
    /** 读取第二面板当前占用尺寸（px） */
    getSecondSize: () => number;
    /** 用户是否正在拖拽分割条（仅反映用户手势，程序化 set 不影响） */
    isDragging: boolean;
    /**
     * 订阅分割位置变化（ratio 为第一面板占比）。
     * 用户拖动时以 mousemove 频率触发，程序化 set / clamp 修正时也会触发，
     * 通过 source 区分。返回取消订阅函数。
     */
    subscribeMove: (listener: (ratio: number, source: TSplitPaneMoveSource) => void) => () => void;
}

export const SplitPaneContext = createContext<ISplitPaneApi | null>(null);

/** 获取所在 SplitPane 的尺寸控制 API，供内部子元素调整面板占用尺寸 */
export const useSplitPane = (): ISplitPaneApi => {
    const api = useContext(SplitPaneContext);
    if (!api) {
        throw new Error('useSplitPane must be used within a SplitPane');
    }
    return api;
};
