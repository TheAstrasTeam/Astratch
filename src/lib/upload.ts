import { MIME_TYPES, TYPES_ENUM, type TMIME_TYPES, type TTYPES_ENUM } from '../types/vm/assets';
import type { IVM } from '../types/vm/vm';
import { getFileExtension, getFileNameWithoutExt } from '../utils/ash-data';

function getCategoryByMime(mimeType: string): TTYPES_ENUM {
    for (const [category, mimeTypes] of Object.entries(
        TYPES_ENUM as Record<string, readonly string[]>,
    )) {
        if (mimeTypes.includes(mimeType)) {
            return category as TTYPES_ENUM;
        }
    }
    return 'text';
}

/** 上传资源 */
function uploadAssets(
    vm: IVM,
    onStartUpload?: (totalFileCount: number) => void,
    onUploadSuccessOne?: (fileCount: number, totalFileCount: number) => void,
    onUploadSuccess?: (totalFileCount: number) => void,
) {
    const handleUpload = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        let count = 0;
        const length = target.files?.length ?? 0;
        if (onStartUpload) onStartUpload(length);
        for (const file of target.files ?? []) {
            const fileExtension = getFileExtension(file.name) ?? '';
            const fileMimeType = file.type;
            const fileName = getFileNameWithoutExt(file.name);
            await vm.runtime.assets.loadAsset({
                blob: await file.arrayBuffer(),
                name: fileName,
                extension: fileExtension,
                mimeType: fileMimeType as TMIME_TYPES,
                type: getCategoryByMime(fileMimeType),
            });
            count++;
            if (onUploadSuccessOne) onUploadSuccessOne(count, length);
        }
        if (onUploadSuccess) onUploadSuccess(length);
        fileInput.remove();
    };
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = Object.values(MIME_TYPES).join(',');
    fileInput.multiple = true;
    fileInput.onchange = handleUpload;

    fileInput.click();
}

export { uploadAssets };
