import { MenuDivider, MenuHeader, MenuItem, SubMenu } from '@szhsin/react-menu';
import type { ReactNode } from 'react';

import { Menu } from './renderer';
import { t } from 'astratch-i18n';
import {
    menubarManager,
    type TMenubarManagerPositions,
    type TMenubarManagerValueMeta,
} from '../../lib/MenubarManager';
import React, { useEffect, useState } from 'react';
import { commandManager } from '../../lib/CommandManager';

export const Menubar_RendererMenu = ({
    Button,
    pos,
}: {
    Button: ReactNode;
    pos: TMenubarManagerPositions;
}) => {
    const [times, setUpdateTimes] = useState(0);
    useEffect(() => {
        const update = () => {
            setUpdateTimes(time => time + 1);
        };
        menubarManager.off('ADDED_CATEGORY', update);
        menubarManager.off('ADDED_VALUE', update);
        menubarManager.off('DELETED_CATEGORY', update);
        menubarManager.off('DELETED_VALUE', update);
        menubarManager.off('EDITED_CATEGORY', update);
        menubarManager.on('ADDED_CATEGORY', update);
        menubarManager.on('ADDED_VALUE', update);
        menubarManager.on('DELETED_CATEGORY', update);
        menubarManager.on('DELETED_VALUE', update);
        menubarManager.on('EDITED_CATEGORY', update);
        return () => {
            menubarManager.off('ADDED_CATEGORY', update);
            menubarManager.off('ADDED_VALUE', update);
            menubarManager.off('DELETED_CATEGORY', update);
            menubarManager.off('DELETED_VALUE', update);
            menubarManager.off('EDITED_CATEGORY', update);
        };
    }, []);

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
        <Menu key={times} Button={Button}>
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
