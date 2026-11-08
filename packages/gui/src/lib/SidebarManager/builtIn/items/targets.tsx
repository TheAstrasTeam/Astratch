import { t } from 'astratch-i18n';
import { type ISidebarSubmitItem } from '../../';
import Icon from '@as/targets/target.svg?react';

const Renderer = <div>Hello World!</div>;

export default {
    Renderer,
    Icon,
    name: t('gui:target'),
} satisfies ISidebarSubmitItem;
