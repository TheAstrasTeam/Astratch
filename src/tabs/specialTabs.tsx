/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/** @author AI */
/** @examine Cyberexplorer */

// 内置页面标签的 UI 注册表：为每个内置页面类型注册图标与渲染组件。
// 新增页面类型时，在 tabTypes.ts 登记 meta 后，在这里补上 icon 与 render 即可。

import type { FunctionComponent, SVGProps } from 'react';
import type { IVM } from '../types/vm/vm';
import type { TSpecialTabType } from './tabTypes';
import Start from '../gui/start';
import CreateProject from '../gui/createProjet';
import LogoIcon from '../assets/ashIconTransparent.svg?react';

export interface ISpecialTabDefinition {
    type: TSpecialTabType;
    /** 标签页图标（软件 logo） */
    icon: FunctionComponent<SVGProps<SVGSVGElement>>;
    /** 页面内容渲染 */
    render: (vm: IVM) => React.ReactNode;
}

export const specialTabDefinitions: Record<TSpecialTabType, ISpecialTabDefinition> = {
    welcome: {
        type: 'welcome',
        icon: LogoIcon,
        render: vm => <Start vm={vm} />,
    },
    create_project: {
        type: 'create_project',
        icon: LogoIcon,
        render: vm => <CreateProject vm={vm} />,
    },
};

export const getSpecialTabDefinition = (type: TSpecialTabType): ISpecialTabDefinition =>
    specialTabDefinitions[type];
