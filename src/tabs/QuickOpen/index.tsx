/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

// QuickOpen 统一悬浮容器：根据当前模式装入不同内容。
// - 搜索模式（mod+p / 点击菜单栏搜索框）：搜索框 + Target/命令结果列表
// - Tab 切换模式（Ctrl+Tab）：按 MRU 列出已打开标签，按住循环、松开提交
// 两种模式都锚定到菜单栏搜索框：面板上端恰好覆盖工具栏搜索框、与之同宽。
// 状态与键盘逻辑各自独立（useQuickOpenStore / useTabSwitcherStore），
// 仅共享外壳容器（定位 / 层级 / 视觉）。层级压在所有可拖动模态框之上。

import { useLayoutEffect, useState, type CSSProperties } from 'react';
import styles from './index.module.scss';
import { useQuickOpen } from './useQuickOpen';
import { SearchPanel } from './SearchPanel';
import { useQuickOpenStore } from '../../stores/useQuickOpenStore';
import { useTabSwitcherStore } from '../../stores/useTabSwitcherStore';
import { useTabSwitcher } from '../TabSwitcher/useTabSwitcher';
import { TabSwitcherList } from '../TabSwitcher';
import type { IVM } from '../../types/vm';

interface IAnchorRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

const QuickOpen = ({ vm }: { vm: IVM }): React.ReactNode => {
    // 两个键盘控制器都在此挂载，各自独立
    useQuickOpen();
    useTabSwitcher();

    const quickOpenOpen = useQuickOpenStore(state => state.isOpen);
    const tabSwitcherOpen = useTabSwitcherStore(state => state.isOpen);
    // 任一模式打开即需要锚定
    const anyOpen = quickOpenOpen || tabSwitcherOpen;

    // 锚定矩形：菜单栏搜索框的位置与尺寸（面板上端覆盖搜索框、与之同宽）
    const [anchorRect, setAnchorRect] = useState<IAnchorRect | null>(null);

    // 面板打开期间测量菜单栏搜索框：上端覆盖搜索框、同宽；窗口缩放时跟随更新。
    // 找不到锚点时退回 CSS 中的居中默认位置。
    // useLayoutEffect 在首帧绘制前测量并对齐，避免先渲染兜底位置再跳变。
    // 注：effect 体内的 setState 属于“将 DOM 测量同步到状态”的合法
    // useLayoutEffect 用法，此处豁免 set-state-in-effect 规则。
    useLayoutEffect(() => {
        if (!anyOpen) return;
        const el = document.getElementById('menubar-search');
        if (!el) return;
        const rect = el.getBoundingClientRect();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAnchorRect({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
        });
        const update = () => {
            const r = el.getBoundingClientRect();
            setAnchorRect({
                left: r.left,
                top: r.top,
                width: r.width,
                height: r.height,
            });
        };
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('resize', update);
        };
    }, [anyOpen]);

    const activeMode: 'search' | 'tabSwitch' | null = quickOpenOpen
        ? 'search'
        : tabSwitcherOpen
          ? 'tabSwitch'
          : null;

    if (activeMode === null) return null;

    // 两种模式都锚定到菜单栏搜索框：上端恰好覆盖搜索框、与之同宽。
    // 面板自身 1px 边框需向外补偿，使面板边框与搜索框边框重合。
    const containerStyle: CSSProperties | undefined = anchorRect
        ? {
              left: anchorRect.left - 1,
              top: anchorRect.top - 1,
              width: anchorRect.width,
              transform: 'none',
          }
        : undefined;

    return (
        <div className={styles.quickOpen} style={containerStyle}>
            {activeMode === 'search' ? (
                <SearchPanel vm={vm} anchorRect={anchorRect} />
            ) : (
                <div className={styles.resultList}>
                    <TabSwitcherList />
                </div>
            )}
        </div>
    );
};

export default QuickOpen;
