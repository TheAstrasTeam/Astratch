import { useEffect, useState } from 'react';
import * as Comlink from 'comlink';
import { vm } from '../../../../vm/vm';
import type { TINFO_TREE } from 'astratch-vm';

import styles from './index.module.scss';
import classNames from 'classnames';

import { Box } from '../../../../../components/box';
import type { ISidebarSubmitItem } from '../../..';
import { create } from 'zustand';

import EntityIcon from '@as/targets/entity.svg?react';
import ExpandIcon from '@as/expand.svg?react';
import ProjectIcon from '@as/project.svg?react';

const useTargetsListStore = create<{
    entitiesList: TINFO_TREE<'entity'>;
    setEntitiesList: (newEntitiesList: TINFO_TREE<'entity'>) => void;

    expandIDs: string[];
    setExpand: (id: string) => void;
    setCollapse: (id: string) => void;
}>(set => ({
    entitiesList: [],
    setEntitiesList: (newEntitiesList: TINFO_TREE<'entity'>) => {
        set(() => ({
            entitiesList: newEntitiesList,
        }));
    },
    expandIDs: [],
    setExpand(id) {
        set(state => ({
            expandIDs: [...state.expandIDs, id],
        }));
    },
    setCollapse(id) {
        set(state => ({
            expandIDs: state.expandIDs.filter(_id => _id !== id),
        }));
    },
}));

export const TargetsList = () => {
    const { entitiesList, setEntitiesList, expandIDs, setExpand, setCollapse } =
        useTargetsListStore();
    const [projectName, setProjectName] = useState('Project');

    useEffect(() => {
        const update = Comlink.proxy(() => {
            void (async () => {
                const entitiesList = (await vm.getProject?.getTargets.listTargetsInfoTree(
                    'entity',
                )) as TINFO_TREE<'entity'> | undefined;
                if (!entitiesList) return;
                setEntitiesList(entitiesList);
                setProjectName(await vm.getProject!.meta.name);
            })();
        });
        update();
        void vm.off('CREATE_TARGET', update);
        void vm.off('MOVE_TARGET', update);
        void vm.off('SWITCH_TARGET', update);
        void vm.off('ADD_PATH', update);
        void vm.off('DELETE_PATH', update);
        void vm.off('REMOVE_TARGET', update);
        void vm.on('CREATE_TARGET', update);
        void vm.on('MOVE_TARGET', update);
        void vm.on('SWITCH_TARGET', update);
        void vm.on('ADD_PATH', update);
        void vm.on('DELETE_PATH', update);
        void vm.on('REMOVE_TARGET', update);
        return () => {
            void vm.off('CREATE_TARGET', update);
            void vm.off('MOVE_TARGET', update);
            void vm.off('SWITCH_TARGET', update);
            void vm.off('ADD_PATH', update);
            void vm.off('DELETE_PATH', update);
            void vm.off('REMOVE_TARGET', update);
        };
    }, [setEntitiesList]);

    const renderEntityMap = (_entitiesList: TINFO_TREE<'entity'> = entitiesList) => {
        return (
            <>
                {_entitiesList.map(target => {
                    if (!target.isFolder) return;
                    return (
                        <li key={target.folder.id}>
                            <Box
                                className={classNames(styles.targetNode, styles.folderNode)}
                                onClick={() => {
                                    if (expandIDs.includes(target.folder.id))
                                        setCollapse(target.folder.id);
                                    else setExpand(target.folder.id);
                                }}
                            >
                                <ExpandIcon
                                    style={{
                                        transform: expandIDs.includes(target.folder.id)
                                            ? 'rotate(180deg)'
                                            : '',
                                        transition: 'transform 0.2s ease',
                                    }}
                                />
                                <button className={classNames(styles.folderExpandButton)}>
                                    {target.folder.name}
                                </button>
                            </Box>
                            {expandIDs.includes(target.folder.id) && (
                                <ul className={styles.targetsNode}>
                                    {renderEntityMap(target.children)}
                                </ul>
                            )}
                        </li>
                    );
                })}
                {_entitiesList.map(target => {
                    if (target.isFolder) return;
                    return (
                        <li key={target.target.id}>
                            <Box
                                Tip={
                                    <div className={styles.targetDialog}>
                                        <EntityIcon />
                                        <span>TESTING</span>
                                    </div>
                                }
                                tipPosition='pointer'
                                tipMode='react'
                                className={styles.targetNode}
                            >
                                <EntityIcon />
                                <button className={classNames(styles.targetButton)}>
                                    {target.target.name}
                                </button>
                            </Box>
                        </li>
                    );
                })}
            </>
        );
    };

    return (
        <div className={styles.main}>
            <div className={styles.projectBar}>
                <ProjectIcon />
                <span className={styles.projectName}>{projectName}</span>
            </div>
            <ul className={classNames(styles.targetsList, styles.targetsNode)}>
                {renderEntityMap()}
            </ul>
        </div>
    );
};

export const Renderer = () =>
    ({
        Node: TargetsList,
        storage() {
            return {};
        },
    }) satisfies ReturnType<ISidebarSubmitItem['Renderer']>;
