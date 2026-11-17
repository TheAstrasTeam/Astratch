import { useEffect, useState, type ReactNode } from 'react';
import { tabsManager } from '../../lib/TabsManager';
import { SplitPanel } from '../splitPanel';
import styles from './index.module.scss';

export const EditingWorkspace = () => {
    const [updateTimes, setUpdateTimes] = useState(0);
    useEffect(() => {
        const update = () => {
            setUpdateTimes(v => v + 1);
        };
        tabsManager.off('ADD_GROUP', update);
        tabsManager.off('DELETE_GROUP', update);
        tabsManager.off('SET_WATCHING_GROUP', update);
        tabsManager.on('ADD_GROUP', update);
        tabsManager.on('DELETE_GROUP', update);
        tabsManager.on('SET_WATCHING_GROUP', update);
        return () => {
            tabsManager.off('ADD_GROUP', update);
            tabsManager.off('DELETE_GROUP', update);
            tabsManager.off('SET_WATCHING_GROUP', update);
        };
    }, []);
    const renderWorkspace = (id = tabsManager.watchingGroup!): ReactNode => {
        const group = tabsManager.getGroup(id);
        if (!group) return;
        if (group.secondElement)
            return (
                <SplitPanel
                    direction={group.direction}
                    FirstElement={
                        typeof group.firstElement === 'string'
                            ? renderWorkspace(group.firstElement)
                            : group.firstElement(group.id)
                    }
                    SecondElement={
                        typeof group.secondElement === 'string'
                            ? renderWorkspace(group.secondElement)
                            : group.secondElement(group.id)
                    }
                    hideElement='both'
                    minFirstElementSize={group.minFirstElementSize}
                    minSecondElementSize={group.minSecondElementSize}
                />
            );
        else
            return (
                <>
                    {typeof group.firstElement === 'string'
                        ? renderWorkspace(group.firstElement)
                        : group.firstElement(group.id)}
                </>
            );
    };
    return (
        <div className={styles.workspace} key={updateTimes}>
            {renderWorkspace()}
        </div>
    );
};
