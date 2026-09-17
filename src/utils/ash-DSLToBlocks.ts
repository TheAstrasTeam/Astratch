/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * DSL 的公共入口，实现拆在 ./ashDSL/ 下：
 *
 * - types.ts       类型（槽位表 / AST / 动态适配器）
 * - tokenize.ts    词法与宽松对象字面量
 * - sugar.ts       !f_* 用到的纯工具
 * - definitions.ts 遍历积木反推槽位表 + mutation 适配器
 * - parser.ts      DSL → AST（含 $ / ! / # 语法糖）
 * - builder.ts     AST → 序列化状态
 * - render.ts      序列化状态 → SVG
 */

export * from './ashDSL';
