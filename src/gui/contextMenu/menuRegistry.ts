import type { ReactNode } from 'react';
import type { TAllContextMenu } from '../../types/gui';

export type MenuContentRenderer = (closeMenu: () => void) => ReactNode;

export const menuContentRegistry = new Map<TAllContextMenu, MenuContentRenderer>();
