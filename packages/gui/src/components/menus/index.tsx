import { MenuDivider, MenuHeader, MenuItem, SubMenu } from '@szhsin/react-menu';
import type { ReactNode } from 'react';

import { Menu } from './renderer';
import { t } from 'astratch-i18n';
import {
    menubarManager,
    type TMenubarManagerPositions,
    type TMenubarManagerValueMeta,
} from '../../lib/MenubarManager';
import React from 'react';
import { commandManager } from '../../lib/CommandManager';

export const Menubar_RendererMenu = ({
    Button,
    pos,
}: {
    Button: ReactNode;
    pos: TMenubarManagerPositions;
}) => {
    const renderValue = (value: TMenubarManagerValueMeta) => {
        if (value.isDivider) return <MenuDivider />;
        const text = value.translate ? t(`gui:${value.nameID}`) : value.name;
        if ((value.children ?? []).length !== 0)
            return (
                <SubMenu label={text}>
                    {value.children?.map(child => (
                        <React.Fragment key={child.id}>{renderValue(child)}</React.Fragment>
                    ))}
                </SubMenu>
            );
        const handleClick = () => {
            if (!value.commandID) return;
            void commandManager.getCommandCallback(value.commandID)?.(undefined);
        };
        return (
            <MenuItem disabled={!value.isEnable()} onClick={handleClick}>
                {text}
            </MenuItem>
        );
    };
    return (
        <Menu Button={Button}>
            {Array.from(menubarManager.listPosition(pos)).map(([_, category], index) => (
                <React.Fragment key={category.meta.id}>
                    {/* 第一个 category 不需要分隔符 */}
                    {index > 0 && <MenuDivider />}
                    <MenuHeader>
                        {category.meta.translate
                            ? t(`gui:${category.meta.nameID}`)
                            : category.meta.name}
                    </MenuHeader>

                    {category.children.map(child => (
                        <React.Fragment key={child.id}>{renderValue(child)}</React.Fragment>
                    ))}
                </React.Fragment>
            ))}
        </Menu>
    );
};
