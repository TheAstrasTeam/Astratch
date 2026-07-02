// 有关字符串的适用函数

/**
 * 生成一个符合`abc.def`之类的id字符串
 * @param string 字符串
 * @returns 
 */
export const toID = (string: string) => {
    return string
        .trim()
        .toLocaleLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.-]/g, '')
        .replace(/\.+/g, '.')
        .replace(/^\.|\.$/g, '');
};
