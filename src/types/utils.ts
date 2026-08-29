/** 将指定的一个键变为可选*/
export type PartialByKeys<T, K extends keyof T> = Omit<T, K> & {
    [P in K]?: T[P];
};
