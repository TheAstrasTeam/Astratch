#!/usr/bin/env node
// 此文件由AI生成
/**
 * 同步 i18n 各语言文件：找出缺失/多余的 key，并自动从基准语言（base）补齐缺失项。
 * 采用文本级插入，保留原文件的手工格式（空行、BOM 等），只新增缺失行。
 * 所有 key 会按点号路径扁平化比较，支持任意层级的嵌套结构。
 *
 * 用法:
 *   node scripts/sync-i18n.mjs                 // 基准为 zh-CN，自动补齐其它语言
 *   node scripts/sync-i18n.mjs --base en       // 自定义基准语言
 *   node scripts/sync-i18n.mjs --dry-run       // 只预览不写盘
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const LOCALES_DIR = 'src/i18n/locales';
const INDENT = '    ';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
let baseName = 'zh-CN';
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base' && args[i + 1]) {
        baseName = args[i + 1];
        i++;
    }
}

// 将嵌套对象扁平化为 { "a.b.c": value }
function flatten(obj, prefix = '', out = {}) {
    for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            flatten(value, path, out);
        } else {
            out[path] = value;
        }
    }
    return out;
}

// 去除 UTF-8 BOM
function stripBom(raw) {
    return raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
}

// 加载一个语言目录下的所有 json，返回 { 文件名: 原始文本 }
async function loadLocale(dir) {
    const result = {};
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (entry.isFile() && extname(entry.name) === '.json') {
            result[entry.name] = await readFile(join(dir, entry.name), 'utf8');
        }
    }
    return result;
}

// 找到某个 key 所在的行号（精确匹配 "key": 前缀）
function findKeyLine(lines, key) {
    const prefix = `"${key}":`;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trimStart().startsWith(prefix)) return i;
    }
    return -1;
}

// 将缺失的 key 文本级插入原始文本，保留原有格式
function insertMissingKeys(raw, flatBase, existingFlat) {
    const baseKeys = Object.keys(flatBase);
    const missing = baseKeys.filter(k => !(k in existingFlat));
    if (!missing.length) return raw;

    const lines = raw.split('\n');
    const closeIdx = (() => {
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim() === '}') return i;
        }
        return lines.length - 1;
    })();

    // 判断从 at 开始到右花括号之间是否已没有其它 key（插入块即为最后一个 key）
    const isLastBlock = at => {
        for (let i = at; i < closeIdx; i++) {
            if (lines[i].trim() !== '') return false;
        }
        return true;
    };

    // 把缺失 key 插到前一个已存在 key 之后；没有则放到文件末尾
    const groups = new Map();
    for (let i = 0; i < baseKeys.length; i++) {
        const key = baseKeys[i];
        if (key in existingFlat) continue;
        let anchor = -1;
        for (let j = i - 1; j >= 0; j--) {
            const idx = findKeyLine(lines, baseKeys[j]);
            if (idx !== -1) {
                anchor = idx + 1;
                break;
            }
        }
        if (anchor === -1) anchor = closeIdx;
        if (!groups.has(anchor)) groups.set(anchor, []);
        groups.get(anchor).push(key);
    }

    // 若插入块会成为最后一个 key：给其上方最近的 key 行补逗号
    for (const [at] of groups) {
        if (!isLastBlock(at)) continue;
        for (let i = at - 1; i >= 0; i--) {
            const t = lines[i].trim();
            if (t === '') continue;
            if (t.startsWith('"') && !t.endsWith(',')) lines[i] += ',';
            break;
        }
    }

    // 从后往前插入，保持行号稳定
    for (const at of [...groups.keys()].sort((a, b) => b - a)) {
        const keys = groups.get(at);
        const last = isLastBlock(at);
        const insertLines = keys.map((key, idx) => {
            const comma = last && idx === keys.length - 1 ? '' : ',';
            return `${INDENT}${JSON.stringify(key)}: ${JSON.stringify(flatBase[key])}${comma}`;
        });
        lines.splice(at, 0, ...insertLines);
    }
    return lines.join('\n');
}

const localeDirs = (await readdir(LOCALES_DIR, { withFileTypes: true }))
    .filter(e => e.isDirectory())
    .map(e => e.name);
if (!localeDirs.includes(baseName)) {
    console.error(`[error] 基准语言目录 "${baseName}" 不存在于 ${LOCALES_DIR}`);
    process.exit(1);
}

const locales = {};
for (const name of localeDirs) {
    locales[name] = await loadLocale(join(LOCALES_DIR, name));
}

// 基准的扁平化 key 集合：{ 文件名: { key: value } }
const flatBase = {};
for (const [file, raw] of Object.entries(locales[baseName])) {
    flatBase[file] = flatten(JSON.parse(stripBom(raw)));
}

let totalAdded = 0;
const reports = [];

for (const name of localeDirs) {
    if (name === baseName) continue;
    const locale = locales[name];

    for (const file of new Set([...Object.keys(flatBase), ...Object.keys(locale)])) {
        const baseFlat = flatBase[file];
        if (!baseFlat) {
            reports.push(`[extra-file] ${name}/${file} 在基准 ${baseName} 中不存在`);
            continue;
        }

        if (!locale[file]) {
            // 目标语言缺少整个文件：直接用基准内容补上
            reports.push(`[filled]   ${name}/${file}: 整个文件缺失，已从基准 ${baseName} 补齐`);
            const missing = Object.keys(baseFlat);
            if (!dryRun) locale[file] = locales[baseName][file];
            totalAdded += missing.length;
            continue;
        }

        const raw = locale[file];
        const existingFlat = flatten(JSON.parse(stripBom(raw)));
        const filled = Object.keys(baseFlat).filter(k => !(k in existingFlat));
        const extra = Object.keys(existingFlat).filter(k => !(k in baseFlat));

        if (filled.length) {
            reports.push(
                `[filled]   ${name}/${file}: ${filled.length} 个缺失 key\n` +
                    `           ${filled.join('\n           ')}`,
            );
            totalAdded += filled.length;
            if (!dryRun) locale[file] = insertMissingKeys(raw, baseFlat, existingFlat);
        }
        if (extra.length) {
            reports.push(
                `[extra]    ${name}/${file}: ${extra.length} 个 key 在基准 ${baseName} 中不存在\n` +
                    `           ${extra.join('\n           ')}`,
            );
        }
    }
}

for (const line of reports) console.log(line);

if (!dryRun) {
    for (const name of localeDirs) {
        if (name === baseName) continue;
        for (const [file, raw] of Object.entries(locales[name])) {
            await writeFile(join(LOCALES_DIR, name, file), raw, 'utf8');
        }
    }
}

if (totalAdded === 0 && !reports.length) {
    console.log(`所有语言文件与基准 ${baseName} 保持一致。`);
} else {
    console.log(`\nDone: 共填充 ${totalAdded} 个缺失 key。`);
    if (dryRun) console.log('Dry run, nothing written.');
}
