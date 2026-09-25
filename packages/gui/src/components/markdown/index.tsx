import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

import Markdown from 'react-markdown';
import { useEffect } from 'react';
import { themeManager, type IThemeEventsType } from '../../lib/ThemeManager';

import styles from './index.module.scss';

const MARKDOWN_CSS_CLASSNAME = 'astratch-markdown-style' as const;
const _addStyleCSS = async (isDarkTheme: boolean) => {
    document.head.querySelectorAll(`style.${MARKDOWN_CSS_CLASSNAME}`).forEach(ele => {
        ele.remove();
    });
    let textContent;
    if (isDarkTheme)
        textContent = (await import('highlight.js/styles/github-dark.css?inline')).default;
    else textContent = (await import('highlight.js/styles/github.css?inline')).default;
    const cssDOM = document.createElement('style');
    cssDOM.className = MARKDOWN_CSS_CLASSNAME;
    cssDOM.textContent = textContent;
    document.head.appendChild(cssDOM);
};
// 初始化CSS
await _addStyleCSS((await themeManager.getUsingTheme('ui')).isDarkTheme);

export const MarkdownArea = ({ children, ...props }: { children: string }) => {
    useEffect(() => {
        const handleAppliedTheme = (data: IThemeEventsType['APPLIED_THEME']) => {
            void (async () => {
                if (data.kind === 'accent') return;
                const themeConfig = await themeManager.getTheme('ui', data.id);
                if (!themeConfig) return;
                await _addStyleCSS(themeConfig.isDarkTheme);
            })();
        };
        themeManager.off('APPLIED_THEME', handleAppliedTheme);
        themeManager.on('APPLIED_THEME', handleAppliedTheme);
        return () => {
            themeManager.off('APPLIED_THEME', handleAppliedTheme);
        };
    }, []);
    return (
        <div className={styles.main}>
            <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
                {...props}
            >
                {children}
            </Markdown>
        </div>
    );
};
