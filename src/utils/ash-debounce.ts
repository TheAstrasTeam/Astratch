/**
 * 去抖执行
 * @param func 函数
 * @param delay 去抖延迟(ms)
 * @param immediate 是否立即执行
 * @returns
 */
const debounce = <T extends (...args: unknown[]) => void>(
    func: T,
    delay: number,
    immediate: boolean,
) => {
    // 此函数由 Ai 生成
    let timer: ReturnType<typeof setTimeout> | null = null;
    return function (this: unknown, ...args: Parameters<T>) {
        const callNow = immediate && !timer;
        if (timer) clearTimeout(timer);
        if (immediate) {
            timer = setTimeout(() => {
                timer = null;
            }, delay);
            if (callNow) func.apply(this, args);
        } else {
            timer = setTimeout(() => {
                timer = null;
                func.apply(this, args);
            }, delay);
        }
    };
};

export { debounce };
