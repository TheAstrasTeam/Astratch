import { ControlledMenu, useMenuState, type MenuProps } from '@szhsin/react-menu';
import { useEffect, useRef, useState, type MouseEventHandler, type ReactNode } from 'react';

/**
 * @author AI
 * @checked
 */

type MenuWrapperProps = Omit<MenuProps, 'menuButton' | 'instanceRef' | 'portal' | 'children'> & {
    Button: ReactNode;
    children?: ReactNode;
    classname?: string;
    /** 按下什么键时触发 */
    keyMode?: 'left' | 'right' | 'all';
    /** 是否通过鼠标指针定位 */
    positioningByPointer?: boolean;
};

interface AnchorPoint {
    x: number;
    y: number;
}

let activeMenu: { token: object; close: () => void } | null = null;

export const Menu = ({
    Button,
    children,
    onMouseUp,
    onMenuChange,
    classname,
    keyMode = 'left',
    positioningByPointer = false,
    ...restProps
}: MenuWrapperProps) => {
    const triggerRef = useRef<HTMLDivElement>(null);
    /** 这个菜单 */
    const tokenRef = useRef({});
    const pressedTriggerRef = useRef(false);
    /** 用来再点击触发按钮时关闭菜单 */
    const skipOpenRef = useRef(false);
    const [anchorPoint, setAnchorPoint] = useState<AnchorPoint>();

    const [menuProps, toggleMenu] = useMenuState({
        onMenuChange: event => {
            if (!event.open && activeMenu?.token === tokenRef.current) activeMenu = null;
            onMenuChange?.(event);
        },
    });

    const openMenu = (point?: AnchorPoint) => {
        if (activeMenu && activeMenu.token !== tokenRef.current) activeMenu.close();
        activeMenu = {
            token: tokenRef.current,
            close: () => {
                toggleMenu(false);
            },
        };
        // 右键菜单锚在鼠标位置，左键菜单锚在触发元素左下角（等价于默认的 bottom-start）
        const rect = triggerRef.current?.getBoundingClientRect();
        setAnchorPoint(point ?? (rect ? { x: rect.left, y: rect.bottom } : undefined));
        toggleMenu(true);
    };

    useEffect(() => {
        const token = tokenRef.current;
        const endPress = () => {
            pressedTriggerRef.current = false;
        };
        window.addEventListener('mouseup', endPress);
        return () => {
            window.removeEventListener('mouseup', endPress);
            if (activeMenu?.token === token) activeMenu = null;
        };
    }, []);

    // 让松手也能选中
    const handleMouseUp: MouseEventHandler<HTMLElement> = event => {
        if (pressedTriggerRef.current && event.target instanceof HTMLElement) {
            const item =
                event.target.closest<HTMLElement>('.szh-menu__item') ??
                event.target.closest('li')?.querySelector<HTMLElement>('.szh-menu__item');
            item?.click();
        }
        onMouseUp?.(event);
    };

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={e => {
                    if (e.buttons === 1 && activeMenu) {
                        pressedTriggerRef.current = true;
                        openMenu(positioningByPointer ? { x: e.clientX, y: e.clientY } : undefined);
                    }
                }}
                onMouseDown={e => {
                    if (e.button !== 0) return;
                    if (keyMode === 'right') return;
                    skipOpenRef.current = menuProps.state !== 'closed';
                    pressedTriggerRef.current = true;
                    openMenu(positioningByPointer ? { x: e.clientX, y: e.clientY } : undefined);
                }}
                onClick={e => {
                    if (keyMode === 'right') return;
                    // 按下时菜单是打开的，点击后已经（通过失焦）关掉了，不要再打开
                    if (skipOpenRef.current) {
                        skipOpenRef.current = false;
                        return;
                    }
                    openMenu(positioningByPointer ? { x: e.clientX, y: e.clientY } : undefined);
                }}
                onKeyDown={e => {
                    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
                    e.preventDefault();
                    openMenu();
                }}
                onContextMenu={e => {
                    if (keyMode === 'left') return;
                    e.preventDefault();
                    openMenu(positioningByPointer ? { x: e.clientX, y: e.clientY } : undefined);
                }}
                className={classname}
            >
                {Button}
            </div>
            <ControlledMenu
                {...restProps}
                {...menuProps}
                onClose={() => {
                    toggleMenu(false);
                }}
                portal={{ target: document.body }}
                anchorPoint={anchorPoint}
                onMouseUp={handleMouseUp}
            >
                {children}
            </ControlledMenu>
        </>
    );
};
