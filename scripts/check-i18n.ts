/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * 检查所有源码内的 i18n key 使用情况：
 * - 从 t() 调用中提取 key（基于 TypeScript AST，准确处理模板字符串、注释、嵌套括号）
 * - key 的 `ns:` 前缀对应 src/i18n/locales/<语言>/<ns>.json，无前缀的 key 归入 defaultNS（从 src/i18n/index.ts 解析）
 * - 静态 key 直接与对应 locale 文件比对；动态 key（含 ${...}）转成模式去匹配
 * - 报告「使用了但未定义」「命名空间无对应文件」和「定义了但未使用」的 key
 *
 * 用法：npx tsx scripts/check-i18n.ts [选项]
 *   --insert-missing   把缺失的 key 插入对应 locale 文件
 *   --prune-unused     从 locale 文件中删除未使用的 key（静态分析看不到的用法会被误删，删前请核对报告）
 *   --fill=<mode>      插入内容：fallback（默认，回退到另一语言的现有翻译）/ empty（空串）/ key（用 key 本身占位）
 * @author AI
 */
/* eslint-disable no-console -- CLI 输出脚本 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import * as ts from 'typescript';

const checkFileExts = new Set(['ts', 'tsx']);
const localeDir = './src/i18n/locales';
const locales = ['zh-CN', 'en'] as const;

type TKeyRef =
    | { kind: 'static'; ns: string; key: string; file: string; line: number; optional: boolean }
    | { kind: 'pattern'; ns: string; pattern: string; file: string; line: number }
    | { kind: 'unknown'; raw: string; file: string; line: number };

/** 找到 t(...) 调用：标识符 t、t?.(...)，以及 xxx.t(...)（如 i18next.t） */
function isTCall(node: ts.Node): node is ts.CallExpression {
    if (!ts.isCallExpression(node)) return false;
    const expr = node.expression;
    if (ts.isIdentifier(expr)) return expr.text === 't';
    return ts.isPropertyAccessExpression(expr) && expr.name.text === 't';
}

/** 判断 t() 第二个参数是否带 defaultValue（key 缺失时可回退，不算错误） */
function hasDefaultValue(node: ts.CallExpression): boolean {
    const arg = node.arguments[1];
    if (node.arguments.length < 2 || !ts.isObjectLiteralExpression(arg)) return false;
    return arg.properties.some(
        p =>
            ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'defaultValue',
    );
}

/** 从第一个参数中提取 key 信息（条件表达式会展开出多个分支） */
function extractKeysFromArg(
    arg: ts.Expression,
    file: string,
    line: number,
    optional: boolean,
): TKeyRef[] {
    if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
        const full = arg.text;
        const colonIdx = full.indexOf(':');
        return [
            {
                kind: 'static',
                // 无前缀的 key 走 i18next 的 defaultNS，ns 留空、检查时再解析
                ns: colonIdx === -1 ? '' : full.slice(0, colonIdx),
                key: colonIdx === -1 ? full : full.slice(colonIdx + 1),
                file,
                line,
                optional,
            },
        ];
    }
    // 条件表达式两个分支都可能是 key，分别提取
    if (ts.isConditionalExpression(arg)) {
        return [
            ...extractKeysFromArg(arg.whenTrue, file, line, optional),
            ...extractKeysFromArg(arg.whenFalse, file, line, optional),
        ];
    }
    if (ts.isTemplateExpression(arg)) {
        // 不用 getTextOfNode：原文含反引号，需从 AST 重建纯模板内容
        const raw =
            arg.head.text +
            arg.templateSpans.map(s => `\${${s.expression.getText()}}${s.literal.text}`).join('');
        const colonIdx = raw.indexOf(':');
        if (colonIdx === -1) return [{ kind: 'unknown', raw, file, line }];
        return [
            {
                kind: 'pattern',
                ns: raw.slice(0, colonIdx),
                pattern: raw.slice(colonIdx + 1),
                file,
                line,
            },
        ];
    }
    return [{ kind: 'unknown', raw: arg.getText(), file, line }];
}

function extractKeysFromFile(code: string, file: string): TKeyRef[] {
    const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, kind);
    const refs: TKeyRef[] = [];

    const visit = (node: ts.Node): void => {
        if (isTCall(node) && node.arguments.length > 0) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            const optional = hasDefaultValue(node);
            refs.push(...extractKeysFromArg(node.arguments[0], file, line + 1, optional));
        }
        node.forEachChild(visit);
    };
    sourceFile.forEachChild(visit);
    return refs;
}

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 把 `gui:scheme.${id}.title` 这类模式转成匹配 locale key 的正则（占位符内部可能含点号，先替换再切分） */
function patternToRegExp(ns: string, pattern: string): RegExp {
    const nsRe = ns.includes('${') ? '[^:]+' : escapeRegExp(ns);
    const PLACEHOLDER = '\u0000';
    const keyRe = pattern
        .replace(/\$\{[^}]*\}/g, PLACEHOLDER)
        .split('.')
        .map(seg => (seg.includes(PLACEHOLDER) ? '[^.]+' : escapeRegExp(seg)))
        .join('\\.');
    return new RegExp(`^${nsRe}:${keyRe}$`);
}

/** 渲染 key 的原始形式（无前缀时不带冒号） */
function formatKey(ns: string, key: string): string {
    return ns ? `${ns}:${key}` : key;
}

/** 读取某个语言下所有 namespace 的 JSON 内容：ns -> 对象（即 <ns>.json） */
async function loadLocaleJsons(locale: string): Promise<Map<string, Record<string, unknown>>> {
    const map = new Map<string, Record<string, unknown>>();
    for (const nsFile of await fs.readdir(path.join(localeDir, locale))) {
        if (!nsFile.endsWith('.json')) continue;
        const ns = nsFile.replace(/\.json$/, '');
        // 兼容可能残留的 BOM，否则 JSON.parse 会失败
        const text = (await fs.readFile(path.join(localeDir, locale, nsFile), 'utf-8')).replace(
            /^\uFEFF/,
            '',
        );
        map.set(ns, JSON.parse(text) as Record<string, unknown>);
    }
    return map;
}

/**
 * 对 <ns>.json 做基于文本行的最小编辑（插入/删除 key），保留空行分组等原有格式。
 * JSON.stringify 整体重写会把文件里的空行分隔全部抹掉，所以不用它。
 */
function applyJsonTextEdits(text: string, insert: [string, string][], remove: Set<string>): string {
    const entryRe = /^(\s*)("(?:[^"\\]|\\.)*")\s*:/;
    const findCloseIdx = (lines: string[]): number => {
        let idx = lines.length - 1;
        while (idx >= 0 && lines[idx].trim() !== '}') idx--;
        return idx;
    };

    let lines = text.split('\n');
    let closeIdx = findCloseIdx(lines);
    if (closeIdx <= 0) return text; // 空对象或无法识别的结构，原样返回

    if (remove.size > 0) {
        lines = lines.filter((line, idx) => {
            if (idx >= closeIdx) return true;
            const m = entryRe.exec(line);
            if (!m) return true;
            let key;
            try {
                key = JSON.parse(m[2]) as string;
            } catch {
                return true;
            }
            return key === '' || !remove.has(key);
        });
        closeIdx = findCloseIdx(lines);
        // 合并删除后产生的连续空行（原有的空行分组会因此少一层，属预期）
        const merged: string[] = [];
        for (const line of lines) {
            if (
                line.trim() === '' &&
                merged.length > 0 &&
                merged[merged.length - 1].trim() === '' &&
                merged.length - 1 < closeIdx
            )
                continue;
            merged.push(line);
        }
        lines = merged;
        closeIdx = findCloseIdx(lines);
    }

    // 删除后，剩下的最后一个条目行可能残留尾逗号，会导致 JSON 非法
    for (let idx = closeIdx - 1; idx >= 0; idx--) {
        if (entryRe.test(lines[idx])) {
            if (/,\s*$/.test(lines[idx])) lines[idx] = lines[idx].replace(/,\s*$/, '');
            break;
        }
    }

    if (insert.length === 0) return lines.join('\n');

    // 找最后一个条目行，作为插入的落点和缩进参考
    let lastEntry = -1;
    for (let idx = closeIdx - 1; idx >= 0; idx--) {
        if (entryRe.test(lines[idx])) {
            lastEntry = idx;
            break;
        }
    }
    if (lastEntry === -1) return text; // 没有任何条目，保持原样，避免猜测结构

    const indent = entryRe.exec(lines[lastEntry])?.[1] ?? '    ';
    // 原最后一项没有尾逗号，追加后需要补上
    if (!/,\s*$/.test(lines[lastEntry])) lines[lastEntry] = `${lines[lastEntry]},`;
    const newLines = insert.map(([k, v], i) => {
        const comma = i < insert.length - 1 ? ',' : '';
        return `${indent}${JSON.stringify(k)}: ${JSON.stringify(v)}${comma}`;
    });
    lines.splice(closeIdx, 0, ...newLines);
    return lines.join('\n');
}

/** 对某个 namespace 的 JSON 做最小文本编辑并写回 */
async function editNsJson(
    locale: string,
    ns: string,
    edits: { insert?: [string, string][]; remove?: string[] },
): Promise<void> {
    const filePath = path.join(localeDir, locale, `${ns}.json`);
    // 统一 UTF-8（无 BOM）
    const raw = (await fs.readFile(filePath, 'utf-8')).replace(/^\uFEFF/, '');
    await fs.writeFile(
        filePath,
        applyJsonTextEdits(raw, edits.insert ?? [], new Set(edits.remove ?? [])),
        'utf-8',
    );
}

/** 从 src/i18n/index.ts 解析 defaultNS（无前缀 key 的归属），解析不到时退回 gui */
async function getDefaultNs(): Promise<string> {
    try {
        const code = await fs.readFile('./src/i18n/index.ts', 'utf-8');
        return /defaultNS:\s*['"]([^'"]+)['"]/.exec(code)?.[1] ?? 'gui';
    } catch {
        return 'gui';
    }
}

async function readFolder(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await readFolder(p)));
        } else if (checkFileExts.has(path.extname(entry.name).slice(1))) {
            files.push(p);
        }
    }
    return files;
}

type TFillMode = 'fallback' | 'empty' | 'key';

/** 按填充模式生成插入的初始内容 */
function fillContent(
    mode: TFillMode,
    ns: string,
    key: string,
    otherLocaleJson: Record<string, unknown> | undefined,
): string {
    if (mode === 'key') return formatKey(ns, key);
    if (mode === 'empty') return '';
    // fallback：另一语言已有翻译就直接搬过来，否则留空
    const value = otherLocaleJson?.[key];
    return typeof value === 'string' ? value : '';
}

async function main() {
    const { values } = parseArgs({
        options: {
            'insert-missing': { type: 'boolean', default: false },
            'prune-unused': { type: 'boolean', default: false },
            fill: { type: 'string', default: 'fallback' },
        },
    });
    const insertMissing = values['insert-missing'] === true;
    const pruneUnused = values['prune-unused'] === true;
    const fill = values.fill as TFillMode;
    if (!['fallback', 'empty', 'key'].includes(fill)) {
        console.error(`无效的 --fill 值: ${fill}（可选 fallback | empty | key）`);
        process.exitCode = 1;
        return;
    }
    if (pruneUnused) {
        console.log(
            '注意：静态分析看不到 t() 之外的引用方式（如拼接、外部配置），清除前请先核对下方「未使用」报告。',
        );
    }

    const files = await readFolder('./src');
    const refs: TKeyRef[] = [];
    for (const file of files) {
        try {
            refs.push(...extractKeysFromFile(await fs.readFile(file, 'utf-8'), file));
        } catch (e) {
            console.warn(`无法处理: ${file}`, e);
        }
    }

    const unknown = refs.filter(
        (r): r is Extract<TKeyRef, { kind: 'unknown' }> => r.kind === 'unknown',
    );
    if (unknown.length > 0) {
        console.log('\n=== 无法静态解析的 t() 调用（请人工确认） ===');
        for (const r of unknown) console.log(`${r.file}:${String(r.line)}  ${r.raw}`);
    }

    const defaultNs = await getDefaultNs();

    // 预加载所有语言的 JSON 内容，插入缺失 key 时可回退到另一语言的现有翻译
    const localeJsons = new Map<string, Map<string, Record<string, unknown>>>();
    for (const locale of locales) localeJsons.set(locale, await loadLocaleJsons(locale));

    for (const locale of locales) {
        const jsons = localeJsons.get(locale) as Map<string, Record<string, unknown>>;
        const nsMap = new Map([...jsons].map(([ns, json]) => [ns, new Set(Object.keys(json))]));
        const otherLocale = locales[(locales.indexOf(locale) + 1) % locales.length];
        const otherJsons = localeJsons.get(otherLocale);

        const patternRefs = refs.filter(
            (r): r is Extract<TKeyRef, { kind: 'pattern' }> => r.kind === 'pattern',
        );
        const patternRegs = patternRefs.map(r => patternToRegExp(r.ns || defaultNs, r.pattern));

        const staticRefs = refs.filter(
            (r): r is Extract<TKeyRef, { kind: 'static' }> => r.kind === 'static',
        );

        // 缺失：namespace 有对应文件但 key 不在里面；未知前缀：namespace 没有对应的 locale 文件
        const missing: typeof staticRefs = [];
        const unknownNs: typeof staticRefs = [];
        for (const r of staticRefs) {
            if (r.optional) continue;
            const ns = r.ns || defaultNs;
            const keys = nsMap.get(ns);
            if (!keys) unknownNs.push(r);
            else if (!keys.has(r.key)) missing.push(r);
        }
        // 动态模式里的字面前缀同样校验；${...} 动态前缀（如插件命名空间）运行时才注册，跳过
        for (const r of patternRefs) {
            const ns = r.ns || defaultNs;
            if (!ns.includes('${') && !nsMap.has(ns))
                unknownNs.push({ ...r, kind: 'static', key: r.pattern, optional: false });
        }

        const unused: string[] = [];
        for (const [ns, keys] of nsMap) {
            for (const key of keys) {
                const isUsed =
                    staticRefs.some(r => (r.ns || defaultNs) === ns && r.key === key) ||
                    patternRegs.some(re => re.test(`${ns}:${key}`));
                if (!isUsed) unused.push(`${ns}:${key}`);
            }
        }

        console.log(`\n=== ${locale} ===`);
        if (unknownNs.length > 0) {
            console.log(`未知命名空间（前缀无对应的 locale 文件）: ${String(unknownNs.length)}`);
            for (const r of unknownNs)
                console.log(`  ${formatKey(r.ns, r.key)}  (${r.file}:${String(r.line)})`);
        } else {
            console.log('未知命名空间: 无');
        }
        if (missing.length > 0) {
            console.log(`缺失（使用了但未定义）: ${String(missing.length)}`);
            for (const r of missing)
                console.log(`  ${formatKey(r.ns, r.key)}  (${r.file}:${String(r.line)})`);
        } else {
            console.log('缺失: 无');
        }
        // if (unused.length > 0) {
        //     console.log(`未使用（定义了但未引用）: ${String(unused.length)}`);
        //     for (const k of unused) console.log(`  ${k}`);
        // } else {
        //     console.log('未使用: 无');
        // }

        // ---- 应用修改 ----
        if (insertMissing && missing.length > 0) {
            // 去重后按 ns 分组
            const toInsert = new Map<string, Set<string>>();
            for (const r of missing) {
                const ns = r.ns || defaultNs;
                if (!toInsert.has(ns)) toInsert.set(ns, new Set());
                toInsert.get(ns)?.add(r.key);
            }
            let inserted = 0;
            for (const [ns, keys] of toInsert) {
                const otherNsJson = otherJsons?.get(ns);
                const entries: [string, string][] = [];
                for (const key of keys) {
                    entries.push([key, fillContent(fill, ns, key, otherNsJson)]);
                    inserted++;
                }
                await editNsJson(locale, ns, { insert: entries });
            }
            console.log(`已插入 ${String(inserted)} 个缺失 key（fill=${fill}）`);
        }
        if (pruneUnused && unused.length > 0) {
            const toPrune = new Map<string, Set<string>>();
            for (const fullKey of unused) {
                const sep = fullKey.indexOf(':');
                const ns = fullKey.slice(0, sep);
                if (!toPrune.has(ns)) toPrune.set(ns, new Set());
                toPrune.get(ns)?.add(fullKey.slice(sep + 1));
            }
            let pruned = 0;
            for (const [ns, keys] of toPrune) {
                await editNsJson(locale, ns, { remove: [...keys] });
                pruned += keys.size;
            }
            console.log(`已清除 ${String(pruned)} 个未使用 key`);
        }
    }
}

await main();
