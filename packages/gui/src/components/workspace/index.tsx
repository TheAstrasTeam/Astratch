import { useRef } from 'react';
import { SplitPanel, type ISplitPanelHandle } from '../splitPanel';
import { EditingWorkspace } from './editingWorkspace';
import styles from './index.module.scss';
import { Sidebar } from './sidebar';

export const Workspace = () => {
    const splitPanelRef = useRef<ISplitPanelHandle>(null);
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
