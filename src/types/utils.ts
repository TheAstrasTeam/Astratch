/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/** 将指定的一个键变为可选*/
export type PartialByKeys<T, K extends keyof T> = Omit<T, K> & {
    [P in K]?: T[P];
};
