/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * DSL → AST
 *
 * 基本形式 `@OPCODE["..."] (args)`；`$` / `!` / `#` 是语法糖，
 * 统一在这里展开成带 state 的 {@link TNode}，后交给 builder 变成序列化状态
 */

import { OPCODES } from '../../types/vm/blocks';
import { atomToShadow, buildNode, buildScript } from './builder';
import { functionArgsFor, functionValueState, modeToCheck } from './sugar';
import { isKeyword, parseAtom, parseObjectLiteral, tokenize } from './tokenize';
import type { TArg, TAtom, TNode, TSugarArg, TValueExpr } from './types';

/**
 * 解析 DSL：script → statement*
 * 积木以 `@OPCODE["..."] (args)` 为基本形式，另有 `$变量`、`!布尔` 等语法糖
 */
export const parseDSL = (content: string): TNode[] => {
    const tokens = tokenize(content);
    let pos = 0;
    const macros = new Map<string, string[]>();
    let expansions = 0;

    const peek = (): string | undefined => tokens[pos];
    const take = (): string | undefined => tokens[pos++];

    function expect(word: string): void {
        if (tokens[pos] !== word) {
            throw new Error(
                `DSL syntax error: expected '${word}', got '${tokens[pos] ?? '<EOF>'}'`,
            );
        }
        pos++;
    }

    /** 读一个名字：裸词或字符串 */
    function takeName(): string {
        const word = take();
        if (word === undefined || isKeyword(word)) {
            throw new Error(`DSL syntax error: expected a name, got '${word ?? '<EOF>'}'`);
        }
        return String(parseAtom(word));
    }

    //  语句 / 积木

    function parseScript(untilBrace: boolean): TNode[] {
        const nodes: TNode[] = [];
        while (pos < tokens.length && tokens[pos] !== '}') {
            if (tokens[pos] === ';') {
                pos++;
                continue;
            }
            if (tokens[pos] === '#define') {
                pos++;
                parseDefine();
                continue;
            }
            nodes.push(parseStatement());
        }
        if (untilBrace) expect('}');
        return nodes;
    }

    function parseStatement(): TNode {
        const word = peek();
        if (word === '@') return parseBlock();
        if (word === '$') return parseVariable();
        if (word?.startsWith('!')) {
            pos++;
            const bang = parseBang(word);
            if (bang.node) return bang.node;
            throw new Error(`DSL syntax error: '${word}' cannot stand alone as a statement`);
        }
        if (word === '#') {
            const body = parseSubstitute();
            tokens.splice(pos, 0, ...body);
            return parseStatement();
        }
        throw new Error(`DSL syntax error: a block must start with '@', got '${word ?? '<EOF>'}'`);
    }

    /** @TYPE["{...}"] (args) —— [] 与 () 可任意顺序、可省略 */
    function parseBlock(): TNode {
        expect('@');
        const opcode = take();
        if (opcode === undefined || isKeyword(opcode)) {
            throw new Error(
                `DSL syntax error: expected a block name after '@', got '${opcode ?? '<EOF>'}'`,
            );
        }
        const node: TNode = { opcode, args: [] };
        for (;;) {
            if (peek() === '[') {
                node.state = { ...node.state, ...parsePayload() };
                continue;
            }
            if (peek() === '(') {
                node.args = parseArgs();
                continue;
            }
            break;
        }
        return node;
    }

    function parseArgs(): TArg[] {
        expect('(');
        const args: TArg[] = [];
        while (pos < tokens.length && peek() !== ')') {
            args.push(parseArg());
            if (peek() === ',') pos++;
            else break;
        }
        expect(')');
        return args;
    }

    function parseArg(): TArg {
        // 只有 <value> 才当 field，避免和比较运算符 '<' 冲突
        if (peek() === '<' && tokens[pos + 2] === '>') {
            pos++;
            const word = take();
            if (word === undefined || isKeyword(word)) {
                throw new Error(`DSL syntax error: missing field value inside < >`);
            }
            expect('>');
            return { kind: 'field', value: parseAtom(word) };
        }
        if (peek() === '{') {
            pos++;
            return { kind: 'statement', body: parseScript(true) };
        }
        return { kind: 'value', expr: parseValue() };
    }

    //  值

    function parseValue(): TValueExpr {
        const word = peek();
        if (word === undefined) {
            throw new Error(`DSL syntax error: expected an argument, got '<EOF>'`);
        }
        if (word === '_') {
            pos++;
            return { kind: 'skip' };
        }
        if (word === '@') return { kind: 'call', node: parseBlock() };
        if (word === '$') return { kind: 'call', node: parseVariable() };
        if (word.startsWith('!')) {
            pos++;
            const bang = parseBang(word);
            if (bang.node) return { kind: 'call', node: bang.node };
            if (bang.expr) return bang.expr;
            throw new Error(`DSL syntax error: unknown '!' construct '${word}'`);
        }
        if (word === '#') {
            const body = parseSubstitute();
            tokens.splice(pos, 0, ...body);
            return parseValue();
        }
        if (word.startsWith('#')) {
            throw new Error(`DSL syntax error: macro '${word}' cannot be used in value position`);
        }
        // 比较运算符 < > 允许当原子
        if (word === '<' || word === '>') {
            pos++;
            return { kind: 'atom', value: word };
        }
        if (isKeyword(word)) {
            throw new Error(`DSL syntax error: expected an argument, got '${word}'`);
        }
        pos++;
        return { kind: 'atom', value: parseAtom(word) };
    }

    //  \# 宏

    /** #define(x, y) —— 记录 y 的原始 token 片段，供 #(x) 拼回 */
    function parseDefine(): void {
        expect('(');
        const name = takeName();
        expect(',');
        const start = pos;
        let depth = 0;
        while (pos < tokens.length) {
            const token = tokens[pos];
            if (token === '(' || token === '[' || token === '{') depth++;
            else if (token === ')' && depth === 0) break;
            else if (token === ')' || token === ']' || token === '}') depth--;
            pos++;
        }
        macros.set(name, tokens.slice(start, pos));
        expect(')');
    }

    /** #(x) —— 取出宏的 token 片段 */
    function parseSubstitute(): string[] {
        expect('#');
        expect('(');
        const name = takeName();
        expect(')');
        const body = macros.get(name);
        if (!body) {
            throw new Error(
                `DSL syntax error: macro '#(${name})' is not defined (use #define first)`,
            );
        }
        if (body.length === 0) {
            throw new Error(`DSL syntax error: macro '#(${name})' expands to nothing`);
        }
        if (++expansions > 1000) {
            throw new Error(
                `DSL syntax error: macro '#(${name})' expanded too deeply (recursion?)`,
            );
        }
        return body;
    }

    //  $ 变量

    /** $名字 —— 变量取值积木（报告者）名字是符号，不要求已在项目里存在 */
    function parseVariable(): TNode {
        expect('$');
        const name = takeName();
        return {
            opcode: OPCODES.DATA_VARIABLE_GET,
            args: [],
            state: { fields: { NAME: name }, extraState: { dataId: name } },
        };
    }

    //  ! 语法糖

    /** ! 开头的构造统一入口：布尔给 expr，函数给 node */
    function parseBang(word: string): { node?: TNode; expr?: TValueExpr } {
        const match = /^!(s_)?(true|false)$/.exec(word);
        if (match) {
            return {
                expr: {
                    kind: 'state',
                    state: {
                        type: OPCODES.OPERATOR_LOGIC_BOOLEAN,
                        extraState: { value: match[2] === 'true' },
                    },
                    shadow: Boolean(match[1]),
                },
            };
        }
        if (word.startsWith('!f_')) return { node: parseFunctionSugar(word) };
        throw new Error(`DSL syntax error: unknown '!' construct '${word}'`);
    }

    function atomOf(arg: TSugarArg | undefined): TAtom {
        if (arg?.kind === 'atom') return arg.value;
        throw new Error('DSL syntax error: expected a literal here');
    }

    function boolOf(arg: TSugarArg | undefined): boolean {
        if (arg?.kind === 'bool') return arg.value;
        if (arg?.kind === 'atom' && typeof arg.value === 'boolean') return arg.value;
        throw new Error('DSL syntax error: expected !true / !false here');
    }

    /** !f_* / !p_dropdown 的括号参数列表 */
    function parseSugarArgs(): TSugarArg[] {
        expect('(');
        const args: TSugarArg[] = [];
        while (pos < tokens.length && peek() !== ')') {
            args.push(parseSugarArg());
            if (peek() === ',') pos++;
            else break;
        }
        expect(')');
        return args;
    }

    function parseSugarArg(): TSugarArg {
        const word = peek();
        if (word === undefined) {
            throw new Error(`DSL syntax error: expected an argument, got '<EOF>'`);
        }
        if (word === '@') return { kind: 'node', node: parseBlock() };
        if (word === '$') return { kind: 'node', node: parseVariable() };
        if (word.startsWith('!')) {
            pos++;
            if (word === '!f_param') {
                const [mode, name] = parseSugarArgs();
                return { kind: 'param', mode: String(atomOf(mode)), name: String(atomOf(name)) };
            }
            if (word === '!p_dropdown' || word === '!dropdown') {
                const [allow, name] = parseSugarArgs();
                return { kind: 'dropdown', allowBlocks: boolOf(allow), name: String(atomOf(name)) };
            }
            const bang = parseBang(word);
            if (bang.node) return { kind: 'node', node: bang.node };
            if (bang.expr?.kind === 'state') {
                const state = bang.expr.state.extraState as { value?: boolean };
                return { kind: 'bool', value: state.value ?? false, shadow: bang.expr.shadow };
            }
            throw new Error(`DSL syntax error: '${word}' cannot be used as a function argument`);
        }
        pos++;
        return { kind: 'atom', value: parseAtom(word) };
    }

    /** !f_define / !f_use / !f_inline / !f_execute / !f_rexecute */
    function parseFunctionSugar(word: string): TNode {
        const args = parseSugarArgs();

        if (word === '!f_use' || word === '!f_define') {
            const color = String(atomOf(args[0]));
            const commands = args.slice(1);
            if (word === '!f_use') {
                // 函数值模式：参数渲染为提示文字样式
                return {
                    opcode: OPCODES.FUNCTION_VALUE,
                    args: [],
                    state: functionValueState(color, commands, null, false),
                };
            }
            // 定义帽：definitionMode，参数由作用域源积木提供
            return {
                opcode: OPCODES.FUNCTION_DEFINITION,
                args: [],
                state: {
                    extraState: { functionRef: { targetId: 'dsl-fake', functionId: 'dsl-fake' } },
                    inputs: { NAME: { block: functionValueState(color, commands, null, true) } },
                },
            };
        }

        if (word === '!f_inline') {
            const returnType = modeToCheck(String(atomOf(args[0])));
            const params = args.slice(1).map((arg, index) => ({
                id: `dsl_p${String(index)}`,
                name: arg.kind === 'param' ? arg.name : String(atomOf(arg)),
                type: arg.kind === 'param' ? modeToCheck(arg.mode) : null,
            }));
            // 函数体：紧跟在调用后面的 { ... }
            const inputs: Record<string, unknown> = {};
            if (peek() === '{') {
                pos++;
                const head = buildScript(parseScript(true));
                if (head) inputs.DO = { block: head };
            }
            return {
                opcode: OPCODES.FUNCTION_INLINE,
                args: [],
                state: { extraState: { params, returnType }, inputs },
            };
        }

        if (word === '!f_execute' || word === '!f_rexecute') {
            const isRe = word === '!f_rexecute';
            const isAuto = boolOf(args[0]);
            const fnIndex = isRe ? 2 : 1;
            const fnArg = args.at(fnIndex);
            if (fnArg?.kind !== 'node') {
                throw new Error(`DSL syntax error: '${word}' needs !f_use / !f_inline`);
            }
            const extraState: Record<string, unknown> = { autoSync: isAuto };
            if (isRe) extraState.returnType = modeToCheck(String(atomOf(args[1])));
            const argDefs: Record<string, unknown>[] = isAuto
                ? functionArgsFor(fnArg.node)
                : args.slice(fnIndex + 1).map((arg, index) => ({
                      id: `dsl_a${String(index)}`,
                      name: arg.kind === 'param' ? arg.name : String(atomOf(arg)),
                      type: arg.kind === 'param' ? modeToCheck(arg.mode) : null,
                  }));
            extraState.args = argDefs;

            const inputs: Record<string, unknown> = {
                FUNCTION: { block: { ...(fnArg.node.state ?? {}), type: fnArg.node.opcode } },
            };
            // 自动模式下，尾部的值作为实参接进对应插槽
            if (isAuto) {
                args.slice(fnIndex + 1).forEach((arg, index) => {
                    const def = argDefs.at(index);
                    const id = typeof def?.id === 'string' ? def.id : '';
                    if (!id) return;
                    const name = `ARG_${id}`;
                    if (arg.kind === 'node') {
                        inputs[name] = { block: buildNode(arg.node) };
                    } else if (arg.kind === 'atom') {
                        inputs[name] = { shadow: atomToShadow(null, arg.value) };
                    } else if (arg.kind === 'bool') {
                        const boolState = {
                            type: OPCODES.OPERATOR_LOGIC_BOOLEAN,
                            extraState: { value: arg.value },
                        };
                        inputs[name] = arg.shadow ? { shadow: boolState } : { block: boolState };
                    }
                });
            }

            return {
                opcode: isRe ? OPCODES.FUNCTION_CALL : OPCODES.FUNCTION_EXECUTE,
                args: [],
                state: { extraState, inputs },
            };
        }

        throw new Error(`DSL syntax error: unknown function construct '${word}'`);
    }

    /** [ "..."] —— 逃逸舱；字符串内容按宽松对象字面量解析成序列化状态 */
    function parsePayload(): Record<string, unknown> {
        expect('[');
        const word = take();
        if (!word?.startsWith('"')) {
            throw new Error(`DSL syntax error: [] expects a string`);
        }
        expect(']');
        return parseObjectLiteral(parseAtom(word) as string);
    }

    return parseScript(false);
};
