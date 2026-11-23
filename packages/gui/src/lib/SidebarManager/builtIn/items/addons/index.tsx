import { t } from 'astratch-i18n';
import { type ISidebarSubmitItem } from '../../..';
import Icon from '@as/targets/target.svg?react';

export default {
    Renderer: () => ({ Node: () => <div>Testing</div>, storage: () => ({}) }),
    Icon,
    name: t('gui:sidebar.addon.name'),
    enable: () => {
        return true;
    },
} satisfies ISidebarSubmitItem;
