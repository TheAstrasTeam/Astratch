/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

export { JitEngine } from './engine';
export type { IJitEngineOptions, IJitStats } from './engine';
export { compileScript, JitUnsupportedError, genExpr } from './compiler';
export { interpretScript } from './interpret';
export { evalValue, evalInput, toNumber, toBoolean, toText, applyBinary, applyCompare } from './eval';
export type { IJitHost, IPortalState, TBlockState, IScript } from './types';
export { field, fieldString, fieldNumber, extraState, inputBlock } from './state';