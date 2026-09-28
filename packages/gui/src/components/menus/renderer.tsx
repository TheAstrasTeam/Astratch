import { Menu as SzMenu, type MenuInstance, type MenuProps } from '@szhsin/react-menu';
import { useEffect, useRef, type MouseEventHandler, type ReactNode } from 'react';

/** @author AI */

type MenuWrapperProps = Omit<MenuProps, 'menuButton' | 'instanceRef' | 'portal' | 'children'> & {
    Button: ReactNode;
    children?: ReactNode;
};

let activeMenuInstance: MenuInstance | null = null;

export const Menu = ({
    Button,
    children,
    onMouseUp,
    onMenuChange,
    ...restProps
}: MenuWrapperProps) => {
    const menuRef = useRef<MenuInstance>(null);
    const pressedTriggerRef = useRef(false);

    const openMenu = () => {
        const nextMenuInstance = menuRef.current;
        if (!nextMenuInstance) return;
        if (activeMenuInstance && activeMenuInstance !== nextMenuInstance) {
            activeMenuInstance.closeMenu();
        }
        activeMenuInstance = nextMenuInstance;
        nextMenuInstance.openMenu();
    };

    useEffect(() => {
        const menuInstance = menuRef.current;
        const endPress = () => {
            pressedTriggerRef.current = false;
        };
        window.addEventListener('mouseup', endPress);
        return () => {
            window.removeEventListener('mouseup', endPress);
            if (activeMenuInstance === menuInstance) activeMenuInstance = null;
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
        <SzMenu
            {...restProps}
            onMouseUp={handleMouseUp}
            onMenuChange={event => {
                if (!event.open && activeMenuInstance === menuRef.current) {
                    activeMenuInstance = null;
                }
                onMenuChange?.(event);
            }}
            instanceRef={menuRef}
            portal={{ target: document.body }}
            menuButton={
                <div
                    onMouseEnter={e => {
                        if (e.buttons === 1) {
                            pressedTriggerRef.current = true;
                            openMenu();
                        }
                    }}
                    onMouseDown={() => {
                        pressedTriggerRef.current = true;
                        openMenu();
                    }}
                >
                    {Button}
                </div>
            }
        >
            {children}
        </SzMenu>
    );
};
