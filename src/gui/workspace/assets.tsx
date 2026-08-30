import { useEffect, useRef, useState } from 'react';
import { events, type IVM } from '../../types/vm/vm';
import styles from './assets.module.scss';
import type { IAsset, TMIME_TYPES } from '../../types/vm/assets';

import RemoveIcon from '../../assets/remove.svg?react';
import AddIcon from '../../assets/add.svg?react';
import { t } from 'i18next';
import { AllContextMenu } from '../../types/gui';
import { MenuItem } from '@szhsin/react-menu';
import { useContextMenu } from '../contextMenu';
import { openMenuByMouseDown } from '../../utils/ash-gui';
import { uploadAssets } from '../../lib/upload';
import { Toast } from '../../lib/ToastManager';
import { spawnRandomString } from '../../utils/ash-data';

/** 缓存 */
const objectURLCache = new WeakMap<ArrayBuffer, string>();

const ArrayBufferToImage = ({
    arrayBuffer,
    mimeType,
}: {
    arrayBuffer: ArrayBuffer;
    mimeType: TMIME_TYPES;
}) => {
    let url = objectURLCache.get(arrayBuffer);
    if (!url) {
        url = URL.createObjectURL(new Blob([arrayBuffer], { type: mimeType }));
        objectURLCache.set(arrayBuffer, url);
    }
    return <img src={url}></img>;
};

const AssetPreview = ({ asset }: { asset: IAsset }) => {
    if (asset.type === 'image') {
        return <ArrayBufferToImage arrayBuffer={asset.blob} mimeType={asset.mimeType} />;
    }
    return <span className={styles.fileTip}>.{asset.extension}</span>;
};

const AssetsPanel = ({ vm }: { vm: IVM }) => {
    const [assets, setAssets] = useState<IAsset[]>(vm.runtime.assets.listAssets());
    const [searchContent, setSearchContent] = useState('');
    const toastID = useRef('Upload_10086');

    const isSearching = searchContent.trim() !== '';
    const filteredAssets = assets.filter(asset => {
        if (!isSearching) return true;
        return asset.name.toLowerCase().includes(searchContent.trim().toLowerCase());
    });

    const onStartUpload = (totalFileCount: number) => {
        toastID.current = spawnRandomString();
        Toast.create({
            id: toastID.current,
            type: 'progress',
            progress: 0,
            text: t('gui:assets.uploadingProgress', {
                now: 0,
                total: totalFileCount,
            }),
        });
    };
    const onUploadSuccessOne = (fileCount: number, totalFileCount: number) => {
        Toast.setProgress(toastID.current, fileCount / totalFileCount);
        Toast.setText(
            toastID.current,
            t('gui:assets.uploadingProgress', {
                now: fileCount,
                total: totalFileCount,
            }),
        );
    };
    const onUploadSuccess = () => {
        Toast.removeToast(toastID.current);
    };
    const { openMenu: openAddMenu } = useContextMenu(AllContextMenu.ADD_ASSET, () => (
        <>
            <MenuItem
                onClick={() => {
                    uploadAssets(vm, onStartUpload, onUploadSuccessOne, onUploadSuccess);
                }}
            >
                {t('gui:assets.uploadFile')}
            </MenuItem>
            <MenuItem onClick={() => {}}>{t('gui:assets.addText')}</MenuItem>
            <MenuItem onClick={() => {}}>{t('gui:assets.addImage')}</MenuItem>
        </>
    ));

    useEffect(() => {
        const handleVMAssetUpdate = () => {
            setAssets(vm.runtime.assets.listAssets());
        };
        vm.on(events.LOAD_ASSET, handleVMAssetUpdate);
        vm.on(events.REMOVE_ASSET, handleVMAssetUpdate);
        return () => {
            vm.off(events.LOAD_ASSET, handleVMAssetUpdate);
            vm.off(events.REMOVE_ASSET, handleVMAssetUpdate);
        };
    }, [vm]);

    const handleRemoveAsset = (assetID: string) => {
        vm.runtime.assets.removeAsset(assetID);
    };
    return (
        <div className={styles.main}>
            <div className={styles.toolbar}>
                <input
                    className={styles.assetsSearch}
                    placeholder={t('gui:search.assets.tip')}
                    value={searchContent}
                    onChange={e => {
                        setSearchContent(e.target.value);
                    }}
                />

                <button
                    className={styles.assetsAdd}
                    onMouseDown={openMenuByMouseDown(openAddMenu)}
                    title={t('gui:target.create')}
                >
                    <AddIcon />
                </button>
            </div>
            <hr />
            <div className={styles.assets}>
                {isSearching && filteredAssets.length === 0 && (
                    <div className={styles.empty}>{t('gui:search.nothing')}</div>
                )}
                {filteredAssets.length === 0 && !isSearching ? (
                    <div className={styles.empty}>{t('gui:assets.nothing')}</div>
                ) : (
                    filteredAssets.map(asset => (
                        <div key={asset.id} className={styles.asset} title={asset.name}>
                            <div className={styles.image}>
                                <AssetPreview asset={asset} />
                            </div>
                            <div className={styles.bar}>
                                <span className={styles.name}>{asset.name}</span>
                                <button
                                    className={styles.remove}
                                    onClick={() => {
                                        handleRemoveAsset(asset.id);
                                    }}
                                >
                                    <RemoveIcon />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export { AssetsPanel };
