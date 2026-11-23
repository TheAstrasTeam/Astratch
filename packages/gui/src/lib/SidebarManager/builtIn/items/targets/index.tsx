import { t } from 'astratch-i18n';
import { type ISidebarSubmitItem } from '../../..';
import Icon from '@as/targets/target.svg?react';
import { Renderer } from './Renderer';

export default {
    Renderer,
    Icon,
    name: t('gui:sidebar.target.name'),
    enable: () => {
        return true;
    },
} satisfies ISidebarSubmitItem;
