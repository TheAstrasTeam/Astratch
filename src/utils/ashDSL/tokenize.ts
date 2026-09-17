/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 词法与宽松对象字面量：把 DSL 文本切成 token，以及解析 `[]` 逃逸舱里的状态描述
 */

import type { TAtom } from './types';

/** 会被单独切出来的符号 */
export const _KEYWORDS = [';', '{', '}', '(', ')', ',', '<', '>', '[', ']', '@', '$'] as const;

export const isKeyword = (word: string | undefined): boolean =>
    word !== undefined && (_KEYWORDS as readonly string[]).includes(word);

/** 把 DSL 源码切成 token：保留字符串字面量、吃掉空白与注释 */
export const tokenize = (content: string): string[] => {
    const tokens: string[] = [];
    let cache = '';
    let inString = false;
    let escaped = false;

    const flush = () => {
        if (cache !== '') tokens.push(cache);
        cache = '';
    };

    for (let index = 0; index < content.length; index++) {
        const char = content[index];
        if (escaped) {
            cache += char;
            escaped = false;
            continue;
        }
        if (char === '\\') {
            cache += char;
            escaped = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            cache += char;
            continue;
        }
        if (!inString && char === '/' && content[index + 1] === '/') {
            flush();
            while (index < content.length && content[index] !== '\n') index++;
            continue;
        }
        if (!inString && char === '/' && content[index + 1] === '*') {
            flush();
            const end = content.indexOf('*/', index + 2);
            index = end === -1 ? content.length : end + 1;
            continue;
        }
        if (!inString && (_KEYWORDS as readonly string[]).includes(char)) {
            // <= / >= 是单个比较运算符，不能拆成两个 token
            if ((char === '<' || char === '>') && content[index + 1] === '=') {
                flush();
                tokens.push(`${char}=`);
                index++;
                continue;
            }
            flush();
            tokens.push(char);
            continue;
        }
        if (inString || !['\n', '\r', '\t', ' '].includes(char)) cache += char;
    }

    flush();
    return tokens;
};

/** 字面量 → 原子：字符串去引号，true/false 转布尔，数字转 number，其余保持字符串（菜单选项等） */
export const parseAtom = (word: string): TAtom => {
    if (word.length >= 2 && word.startsWith('"') && word.endsWith('"')) {
        try {
            return JSON.parse(word) as string;
        } catch {
            return word.slice(1, -1);
        }
    }
    if (word === 'true') return true;
    if (word === 'false') return false;
    const number = Number(word);
    if (word.trim() !== '' && Number.isFinite(number)) return number;
    return word;
};

/**
 * 宽松对象字面量：键可不加引号，字符串可用单/双引号，允许尾逗号和注释
 * 用于 `[]` 逃逸舱里的状态描述
 */
export const parseObjectLiteral = (text: string): Record<string, unknown> => {
    let index = 0;

    const skip = (): void => {
        for (;;) {
            const char = text[index];
            if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
                index++;
                continue;
            }
            if (char === '/' && text[index + 1] === '/') {
                while (index < text.length && text[index] !== '\n') index++;
                continue;
            }
            if (char === '/' && text[index + 1] === '*') {
                const end = text.indexOf('*/', index + 2);
                index = end === -1 ? text.length : end + 2;
                continue;
            }
            return;
        }
    };

    const parseString = (): string => {
        const quote = text[index];
        index++;
        let raw = '';
        while (index < text.length && text[index] !== quote) {
            if (text[index] === '\\') {
                raw += text[index] + (text[index + 1] ?? '');
                index += 2;
                continue;
            }
            raw += text[index];
            index++;
        }
        index++;
        if (quote === '"') {
            try {
                return JSON.parse(`"${raw}"`) as string;
            } catch {
                return raw;
            }
        }
        return raw.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    };

    const parseValue = (): unknown => {
        skip();
        const char = text[index];
        if (char === '{') return parseObject();
        if (char === '[') {
            index++;
            const array: unknown[] = [];
            skip();
            while (index < text.length && text[index] !== ']') {
                array.push(parseValue());
                skip();
                if (text[index] === ',') {
                    index++;
                    skip();
                }
            }
            index++;
            return array;
        }
        if (char === '"' || char === "'") return parseString();
        const start = index;
        while (index < text.length && !',}]'.includes(text[index])) index++;
        const raw = text.slice(start, index).trim();
        if (raw === 'true') return true;
        if (raw === 'false') return false;
        if (raw === 'null') return null;
        const number = Number(raw);
        if (raw !== '' && Number.isFinite(number)) return number;
        return raw;
    };

    const parseObject = (): Record<string, unknown> => {
        index++; // {
        const object: Record<string, unknown> = {};
        skip();
        while (index < text.length && text[index] !== '}') {
            let key: string;
            if (text[index] === '"' || text[index] === "'") {
                key = parseString();
            } else {
                const start = index;
                while (index < text.length && !':,}'.includes(text[index])) index++;
                key = text.slice(start, index).trim();
            }
            skip();
            if (text[index] !== ':') {
                throw new Error(`object literal error: missing ':' after key '${key}'`);
            }
            index++;
            object[key] = parseValue();
            skip();
            if (text[index] === ',') {
                index++;
                skip();
            }
        }
        index++; // }
        return object;
    };

    skip();
    if (text[index] !== '{') throw new Error('object literal error: must start with {');
    return parseObject();
};
