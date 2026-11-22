import { t } from 'astratch-i18n';
import { tabsManager, type ITabGroup } from '../../../../TabsManager';
import { useEffect, useState } from 'react';

export const EditingTabHint = () => {
    const [focusingName, setFocusingName] = useState('');
    useEffect(() => {
        const update = (data: {
            id: string | undefined;
            group: ITabGroup | undefined;
            pos: 'first' | 'second';
        }) => {
            if (!data.group) return;
            if (typeof data.group.firstElement === 'string') return;
            if (typeof data.group.secondElement === 'string') return;
            setFocusingName(
                data.pos === 'first'
                    ? data.group.firstElement.name
                    : (data.group.secondElement?.name ?? ''),
            );
        };
        tabsManager.off('SET_FOCUSING_GROUP', update);
        tabsManager.on('SET_FOCUSING_GROUP', update);
        return () => {
            tabsManager.off('SET_FOCUSING_GROUP', update);
        };
    }, []);
    return (
        <>
            {focusingName && (
                <span>
                    {t('gui:bottomBar.editingTabHint')}
                    {focusingName}
                </span>
            )}
        </>
    );
};
