/** 将指定的一个键变为可选*/
type PartialByKeys<T, K extends keyof T> = T extends unknown
    ? Omit<T, K> & { [P in K]?: T[P] }
    : never;

export type { PartialByKeys };
