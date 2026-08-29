/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { events, type IFolder, type TEmit, type TFolderInfo } from '../../types/vm/vm';

export const DEFAULT_FOLDERINFO: TFolderInfo = {
    name: '',
    id: '',
    color: '#000000',
    parentID: null,
};

/**
 * 文件夹
 */
class Folder implements IFolder {
    name: string;
    id: string;
    color: string;
    parentID: string | null;

    private emit: TEmit;

    constructor(emit: TEmit) {
        this.emit = emit;
        this.name = '';
        this.id = '';
        this.color = '#000000';
        this.parentID = null;
    }

    rename(name: string) {
        this.name = name;
        this.emit(events.UPDATE_TARGET_STRUCTURE);
    }

    setColor(color: string) {
        this.color = color;
        this.emit(events.UPDATE_TARGET_STRUCTURE);
    }

    setParent(parentID: string | null) {
        this.parentID = parentID;
        this.emit(events.UPDATE_TARGET_STRUCTURE);
    }

    cloneAsNode() {
        return Object.assign(Object.create(Folder.prototype), this, {
            type: 'folder',
        }) as IFolder & { type: 'folder' };
    }

    static fromJSON(json: TFolderInfo, emit: TEmit): Folder {
        const folder = new Folder(emit);
        Object.assign(folder, DEFAULT_FOLDERINFO, json);
        return folder;
    }
}

export default Folder;
