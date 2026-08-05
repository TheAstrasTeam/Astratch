#!/usr/bin/env node
// 此文件由 AI 编写
/**
 * 给指定目录下的 .ts/.tsx 文件批量插入 Apache-2.0 许可证头。
 * 已包含 @license 的文件会跳过，不会重复插入。
 *
 * 用法:
 *   node scripts/add-license-header.mjs [目录...]   // 默认 src
 *   node scripts/add-license-header.mjs --dry-run   // 只预览不写盘
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const HEADER = `/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

`;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dirs = args.filter(a => !a.startsWith('--'));
if (dirs.length === 0) dirs.push('src');

async function collectTsFiles(dir) {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
            out.push(...(await collectTsFiles(full)));
        } else if (entry.isFile() && ['.ts', '.tsx'].includes(extname(entry.name))) {
            out.push(full);
        }
    }
    return out;
}

let added = 0;
let skipped = 0;
for (const dir of dirs) {
    for (const file of await collectTsFiles(dir)) {
        const raw = await readFile(file, 'utf8');
        if (raw.includes('@license')) {
            skipped++;
            continue;
        }
        const hasBom = raw.charCodeAt(0) === 0xfeff;
        const content = hasBom ? raw.slice(1) : raw;
        const output = (hasBom ? '\uFEFF' : '') + HEADER + content;
        if (dryRun) {
            console.log(`[preview] ${file}`);
        } else {
            await writeFile(file, output, 'utf8');
            console.log(`[added]   ${file}`);
        }
        added++;
    }
}
console.log(`\nDone: ${added} added, ${skipped} skipped (already has @license).`);
if (dryRun) console.log('Dry run, nothing written.');
