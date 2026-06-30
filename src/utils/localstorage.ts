// 存储关于本地存储的实用函数

/**
 * 从本地存储读取一个值
 * @param key 存储键名
 * @returns 解析后的数据，不存在时返回 null
 */
const readLocalStorage = (key: string): unknown => {
    try {
        const data = localStorage.getItem(key);
        if (!data) return null;

        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    } catch {
        return null;
    }
};

const localStorageIDs = {
    /**
     * 当前使用的界面语言
     */
    Language: 'ash_language',
};

export { localStorageIDs, readLocalStorage };
