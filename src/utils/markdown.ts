/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 轻量 Markdown → HTML 转换器（仅支持常用语法）。
 * 不引入第三方库，适合渲染插件 README。
 */
export const renderMarkdown = (md: string): string => {
    const lines = md.split('\n');
    const out: string[] = [];
    let inCodeBlock = false;
    let codeBuf: string[] = [];

    for (const line of lines) {
        // fenced code block
        if (line.trimStart().startsWith('```')) {
            if (inCodeBlock) {
                out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
                codeBuf = [];
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
            }
            continue;
        }
        if (inCodeBlock) {
            codeBuf.push(line);
            continue;
        }

        // blank line
        if (line.trim() === '') {
            out.push('');
            continue;
        }

        // headings
        const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            out.push(`<h${level}>${inlineMd(headingMatch[2])}</h${level}>`);
            continue;
        }

        // unordered list
        const ulMatch = line.match(/^(\s*)[-*]\s+(.*)/);
        if (ulMatch) {
            out.push(`<li>${inlineMd(ulMatch[2])}</li>`);
            continue;
        }

        // ordered list
        const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
        if (olMatch) {
            out.push(`<li>${inlineMd(olMatch[2])}</li>`);
            continue;
        }

        // table (simple: detect pipes)
        if (line.includes('|') && line.trim().startsWith('|')) {
            const cells = line
                .split('|')
                .slice(1, -1)
                .map(c => c.trim());
            if (cells.every(c => /^[-:]+$/.test(c))) {
                // separator row — skip
                continue;
            }
            const tag = out.length > 0 && out[out.length - 1].startsWith('<tr>')
                ? 'td'
                : 'th';
            const row = cells.map(c => `<${tag}>${inlineMd(c)}</${tag}>`).join('');
            if (tag === 'th') {
                out.push(`<tr>${row}</tr>`);
            } else {
                // continue table
                const last = out[out.length - 1];
                if (last && last.includes('<tr>')) {
                    out[out.length - 1] = last + `<tr>${row}</tr>`;
                } else {
                    out.push(`<tr>${row}</tr>`);
                }
            }
            continue;
        }

        // paragraph
        out.push(`<p>${inlineMd(line)}</p>`);
    }

    if (inCodeBlock && codeBuf.length > 0) {
        out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
    }

    // wrap consecutive <tr> in <table>
    return out
        .join('\n')
        .replace(/((?:<tr>.*<\/tr>\n?)+)/g, '<table>$1</table>')
        .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
};

const escapeHtml = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const inlineMd = (s: string): string =>
    s
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
