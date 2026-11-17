import { useEffect, useRef } from 'react';
import { SplitPanel, type ISplitPanelHandle } from '../splitPanel';
import { EditingWorkspace } from './editingWorkspace';
import styles from './index.module.scss';
import { Sidebar } from './sidebar';
import { tabsManager } from '../../lib/TabsManager';
import { StartTab } from '../tabs/start';
import { t } from 'astratch-i18n';
import { vm } from '../../lib/vm';

export const Workspace = () => {
    const splitPanelRef = useRef<ISplitPanelHandle>(null);

    useEffect(() => {
        void (async () => {
            if (await vm.isCreatedProject())
                tabsManager.addGroup(
                    {
                        direction: 'horizontal',
                        firstElement: StartTab,
                        name: t('gui:tab.start'),
                        parent: undefined,
                    },
                    true,
                );
        })();
    }, []);

    return (
        <div className={styles.main}>
            <SplitPanel
                ref={splitPanelRef}
                FirstElement={
                    <Sidebar
                        hideSidebar={value => {
                            splitPanelRef.current?.setHidingFirst(value);
                        }}
                    />
                }
                SecondElement={<EditingWorkspace />}
                direction='horizontal'
                minFirstElementSize={15}
                minSecondElementSize={15}
                hideElement='first'
                defaultSize={25}
            />
        </div>
    );
};
