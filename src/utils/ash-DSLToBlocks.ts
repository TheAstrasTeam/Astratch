/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 把 Astratch DSL 解析成 Blockly 序列化状态，并据此渲染积木 SVG。
 *
 * DSL 语法（位置参数由 {@link _BlocksDefinitions} 自动补全，不需要写名字）：
 *
 *   opcode;                         // 无参积木
 *   opcode(1, +, 2);                // value 输入：字面量（→ 默认 shadow）或嵌套 opcode(...)
 *   data_variable_set(<score>, 10); // <> 标记 field，值按 field 的选项/类型转换
 *   data_array_push(_, 1);         // _ 表示该 value 槽留空
 *   control_condition_if(cond, {    // {} 标记 statement 输入
 *       moveStep(1);
 *   }, {
 *       moveStep(10);
 *   });
 *
 * 槽位顺序来自积木定义本身（输入顺序 = 可序列化 field + connection），因此 field /
 * value / statement 三类参数各自按出现顺序落到同类槽位上，交错也不影响。
 *
 * @author AI
 */

import * as Blockly from 'blockly';
import { OPCODES } from '../types/vm/blocks';
import getToolbox from '../lib/BlocklyAdapter/toolbox';

type TMenuOption = [unknown, string] | 'separator';

interface IFieldSlot {
    /** field 名，写入序列化状态的 fields。 */
    name: string;
    /** 下拉选项；非下拉为 null。 */
    options: TMenuOption[] | null;
    /** 是否数值型 field（FieldNumber / FieldAngle），用于把原子转成 number。 */
    numeric: boolean;
    /** 默认值。 */
    value: unknown;
}

interface IValueSlot {
    /** 输入名，写入序列化状态的 inputs。 */
    name: string;
    /** toolbox 里该输入的默认 shadow 积木类型。 */
    shadowType: string | null;
    /** 连接的 check（如 ['Number']），用于 DSL 类型校验；null 表示不限。 */
    check: string[] | null;
}

interface IStatementSlot {
    name: string;
    /** 连接的 check（如 ['Action'] / ['MatchBranch']）。 */
    check: string[] | null;
}

interface IBlockDefinition {
    fields: IFieldSlot[];
    values: IValueSlot[];
    statements: IStatementSlot[];
    /** 输出连接的 check（reporter 积木）；null 表示没有输出或不限。 */
    output: string[] | null;
}

/** 由积木定义反推出来的槽位表，由 {@link refreshBlocksDefinitions} 填充。 */
let _BlocksDefinitions: Record<string, IBlockDefinition | undefined> = {};

/** 静态槽填完后剩下的参数。 */
interface IDynamicContext {
    values: TValueExpr[];
    statements: TNode[][];
}

/** 动态槽位补充结果。 */
interface IDynamicResult {
    values?: IValueSlot[];
    statements?: IStatementSlot[];
    /** mutation 的 extraState，加载时让积木长出这些槽。 */
    extraState?: unknown;
}

/**
 * 动态积木（mutation / updateShape 生成的槽）静态读不到，需要手动补。
 * `dynamic` 在静态槽填完后用剩余参数补齐动态槽，并给出 extraState。
 */
interface IBlockOverride extends Partial<IBlockDefinition> {
    dynamic?: (leftover: IDynamicContext) => IDynamicResult | undefined;
}

const _BlockOverrides: Record<string, IBlockOverride | undefined> = {
    [OPCODES.CONTROL_CONDITION_IF]: {
        dynamic: ({ values, statements }) => {
            const elseIfCount = values.length;
            const hasElse = statements.length === elseIfCount + 1;
            if (statements.length !== elseIfCount && !hasElse) {
                throw new Error(
                    `control_condition_if：${String(values.length)} 个 else if 条件配了 ${String(statements.length)} 个 {}，数量不匹配`,
                );
            }
            const extraValues: IValueSlot[] = [];
            const extraStatements: IStatementSlot[] = [];
            for (let index = 0; index < elseIfCount; index++) {
                extraValues.push({
                    name: `ELSE_IF_CONDITION_${String(index)}`,
                    shadowType: OPCODES.OPERATOR_LOGIC_BOOLEAN,
                    check: ['Boolean'],
                });
                extraStatements.push({ name: `ELSE_IF_DO_${String(index)}`, check: ['Action'] });
            }
            if (hasElse) extraStatements.push({ name: 'ELSE_DO', check: ['Action'] });
            return {
                values: extraValues,
                statements: extraStatements,
                extraState: { elseIfCount, hasElse },
            };
        },
    },
};

/** 收集 toolbox 里每个积木各 value 输入的默认 shadow 类型。 */
const collectShadowTypes = async (): Promise<Map<string, Map<string, string>>> => {
    const toolbox = await getToolbox();
    const result = new Map<string, Map<string, string>>();

    const walk = (items: readonly unknown[]) => {
        for (const item of items) {
            const node = item as {
                kind?: string;
                type?: string;
                inputs?: Record<string, { shadow?: { type?: string } }>;
                contents?: unknown[];
            };
            if (node.kind === 'block' && typeof node.type === 'string') {
                let entry = result.get(node.type);
                if (!entry) {
                    entry = new Map<string, string>();
                    result.set(node.type, entry);
                }
                for (const [name, value] of Object.entries(node.inputs ?? {})) {
                    const shadowType = value.shadow?.type;
                    if (shadowType !== undefined && !entry.has(name)) entry.set(name, shadowType);
                }
            }
            walk(node.contents ?? []);
        }
    };

    walk(toolbox.contents);
    return result;
};

/** 读取下拉 field 的选项，动态菜单可能依赖运行时状态，读不到就返回 null。 */
const readOptions = (field: Blockly.Field): TMenuOption[] | null => {
    const dropdown = field as Blockly.Field & {
        getOptions?: (useCache?: boolean) => TMenuOption[];
    };
    if (typeof dropdown.getOptions !== 'function') return null;
    try {
        return dropdown.getOptions(false);
    } catch {
        return null;
    }
};

/**
 * 遍历已经注册的积木，把每个积木的 field / value / statement 槽位拍平成有序列。
 * 只处理静态结构；mutation 生成的槽见 {@link _BlockOverrides}。
 */
const refreshBlocksDefinitions = async (): Promise<void> => {
    const shadowTypes = await collectShadowTypes();
    const workspace = new Blockly.Workspace();

    // 重建前清空，避免已注销的积木留下陈旧槽位
    _BlocksDefinitions = {};

    try {
        for (const type of Object.keys(Blockly.Blocks)) {
            try {
                const block = workspace.newBlock(type);
                const fields: IFieldSlot[] = [];
                const values: IValueSlot[] = [];
                const statements: IStatementSlot[] = [];

                for (const input of block.inputList) {
                    for (const field of input.fieldRow) {
                        if (!field.isSerializable() || !field.name) continue;
                        const value = field.getValue() as unknown;
                        fields.push({
                            name: field.name,
                            options: readOptions(field),
                            numeric: typeof value === 'number',
                            value,
                        });
                    }

                    const connection = input.connection;
                    if (!connection) continue;
                    if (input.type === Blockly.inputs.inputTypes.STATEMENT) {
                        statements.push({ name: input.name, check: connection.getCheck() });
                    } else {
                        values.push({
                            name: input.name,
                            shadowType: shadowTypes.get(type)?.get(input.name) ?? null,
                            check: connection.getCheck(),
                        });
                    }
                }

                const override = _BlockOverrides[type];
                if (override) {
                    for (const field of override.fields ?? []) {
                        if (!fields.some(exist => exist.name === field.name)) fields.push(field);
                    }
                    for (const value of override.values ?? []) {
                        if (!values.some(exist => exist.name === value.name)) values.push(value);
                    }
                    for (const statement of override.statements ?? []) {
                        if (!statements.some(exist => exist.name === statement.name)) {
                            statements.push(statement);
                        }
                    }
                }

                _BlocksDefinitions[type] = {
                    fields,
                    values,
                    statements,
                    output: block.outputConnection?.getCheck() ?? null,
                };
            } catch {
                // 少数动态积木 init 依赖运行时状态；读不到就跳过，用 _BlockOverrides 手动补
            }
        }
    } finally {
        workspace.dispose();
    }
};

type TAtom = number | string | boolean;

type TValueExpr =
    | { kind: 'atom'; value: TAtom }
    | { kind: 'call'; node: TNode }
    | { kind: 'state'; state: Blockly.serialization.blocks.State; shadow: boolean }
    | { kind: 'skip' };

type TArg =
    | { kind: 'field'; value: TAtom }
    | { kind: 'statement'; body: TNode[] }
    | { kind: 'value'; expr: TValueExpr };

interface TNode {
    opcode: string;
    args: TArg[];
    /** 来自 `[]` 逃逸舱的原始序列化状态，会合并进最终 state。 */
    state?: Record<string, unknown>;
}

const _KEYWORDS = [';', '{', '}', '(', ')', ',', '<', '>', '[', ']', '@', '$'] as const;

const isKeyword = (word: string | undefined): boolean =>
    word !== undefined && (_KEYWORDS as readonly string[]).includes(word);

/** 把 DSL 源码切成 token，保留字符串字面量，忽略空白。 */
const tokenize = (content: string): string[] => {
    const tokens: string[] = [];
    let cache = '';
    let inString = false;
    let escaped = false;

    const flush = () => {
        if (cache !== '') tokens.push(cache);
        cache = '';
    };

    for (let index = 0; index < content.length; index++) {
        const char = content[index];
        if (escaped) {
            cache += char;
            escaped = false;
            continue;
        }
        if (char === '\\') {
            cache += char;
            escaped = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            cache += char;
            continue;
        }
        if (!inString && (_KEYWORDS as readonly string[]).includes(char)) {
            // <= / >= 属于比较运算符，不能被拆成两个 token
            if ((char === '<' || char === '>') && content[index + 1] === '=') {
                flush();
                tokens.push(`${char}=`);
                index++;
                continue;
            }
            flush();
            tokens.push(char);
            continue;
        }
        if (inString || !['\n', '\r', '\t', ' '].includes(char)) cache += char;
    }

    flush();
    return tokens;
};

/** 字面量 → 原子。字符串去引号，true/false 转布尔，数字转 number，其余保持字符串（菜单选项等）。 */
const parseAtom = (word: string): TAtom => {
    if (word.length >= 2 && word.startsWith('"') && word.endsWith('"')) {
        try {
            return JSON.parse(word) as string;
        } catch {
            return word.slice(1, -1);
        }
    }
    if (word === 'true') return true;
    if (word === 'false') return false;
    const number = Number(word);
    if (word.trim() !== '' && Number.isFinite(number)) return number;
    return word;
};

/**
 * 宽松对象字面量：键可不加引号，字符串可用单/双引号，允许尾逗号和注释。
 * 用于 `[]` 逃逸舱里的状态描述。
 */
const parseObjectLiteral = (text: string): Record<string, unknown> => {
    let index = 0;

    const skip = (): void => {
        for (;;) {
            const char = text[index];
            if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
                index++;
                continue;
            }
            if (char === '/' && text[index + 1] === '/') {
                while (index < text.length && text[index] !== '\n') index++;
                continue;
            }
            if (char === '/' && text[index + 1] === '*') {
                const end = text.indexOf('*/', index + 2);
                index = end === -1 ? text.length : end + 2;
                continue;
            }
            return;
        }
    };

    const parseString = (): string => {
        const quote = text[index];
        index++;
        let raw = '';
        while (index < text.length && text[index] !== quote) {
            if (text[index] === '\\') {
                raw += text[index] + (text[index + 1] ?? '');
                index += 2;
                continue;
            }
            raw += text[index];
            index++;
        }
        index++;
        if (quote === '"') {
            try {
                return JSON.parse(`"${raw}"`) as string;
            } catch {
                return raw;
            }
        }
        return raw.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    };

    const parseValue = (): unknown => {
        skip();
        const char = text[index];
        if (char === '{') return parseObject();
        if (char === '[') {
            index++;
            const array: unknown[] = [];
            skip();
            while (index < text.length && text[index] !== ']') {
                array.push(parseValue());
                skip();
                if (text[index] === ',') {
                    index++;
                    skip();
                }
            }
            index++;
            return array;
        }
        if (char === '"' || char === "'") return parseString();
        const start = index;
        while (index < text.length && !',}]'.includes(text[index])) index++;
        const raw = text.slice(start, index).trim();
        if (raw === 'true') return true;
        if (raw === 'false') return false;
        if (raw === 'null') return null;
        const number = Number(raw);
        if (raw !== '' && Number.isFinite(number)) return number;
        return raw;
    };

    const parseObject = (): Record<string, unknown> => {
        index++; // {
        const object: Record<string, unknown> = {};
        skip();
        while (index < text.length && text[index] !== '}') {
            let key: string;
            if (text[index] === '"' || text[index] === "'") {
                key = parseString();
            } else {
                const start = index;
                while (index < text.length && !':,}'.includes(text[index])) index++;
                key = text.slice(start, index).trim();
            }
            skip();
            if (text[index] !== ':') {
                throw new Error(`对象字面量错误：键 '${key}' 后缺少 ':'`);
            }
            index++;
            object[key] = parseValue();
            skip();
            if (text[index] === ',') {
                index++;
                skip();
            }
        }
        index++; // }
        return object;
    };

    skip();
    if (text[index] !== '{') throw new Error('对象字面量错误：需要以 { 开头');
    return parseObject();
};

/**
 * 解析 DSL：script → statement*。
 * 积木以 `@OPCODE["..."] (args)` 为基本形式，另有 `$变量`、`!布尔` 等语法糖。
 */
const parseDSL = (content: string): TNode[] => {
    const tokens = tokenize(content);
    let pos = 0;

    const peek = (): string | undefined => tokens[pos];
    const take = (): string | undefined => tokens[pos++];

    function expect(word: string): void {
        if (tokens[pos] !== word) {
            throw new Error(`DSL 语法错误：期望 '${word}'，实际 '${tokens[pos] ?? '<EOF>'}'`);
        }
        pos++;
    }

    /** 读一个名字：裸词或字符串。 */
    function takeName(): string {
        const word = take();
        if (word === undefined || isKeyword(word)) {
            throw new Error(`DSL 语法错误：期望名字，实际 '${word ?? '<EOF>'}'`);
        }
        return String(parseAtom(word));
    }

    function parseScript(untilBrace: boolean): TNode[] {
        const nodes: TNode[] = [];
        while (pos < tokens.length && tokens[pos] !== '}') {
            if (tokens[pos] === ';') {
                pos++;
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
        if (word?.startsWith('!')) return parseBuiltinBlock(word);
        if (word?.startsWith('#')) {
            throw new Error(`DSL 语法错误：宏 '${word}' 暂未实现`);
        }
        throw new Error(`DSL 语法错误：积木要以 '@' 开头，实际 '${word ?? '<EOF>'}'`);
    }

    /** @TYPE["{...}"] (args) —— [] 与 () 可任意顺序、可省略。 */
    function parseBlock(): TNode {
        expect('@');
        const opcode = take();
        if (opcode === undefined || isKeyword(opcode)) {
            throw new Error(`DSL 语法错误：'@' 后需要积木名，实际 '${opcode ?? '<EOF>'}'`);
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
                throw new Error(`DSL 语法错误：< > 中缺少 field 值`);
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

    function parseValue(): TValueExpr {
        const word = peek();
        if (word === undefined) {
            throw new Error(`DSL 语法错误：期望参数，实际 '<EOF>'`);
        }
        if (word === '_') {
            pos++;
            return { kind: 'skip' };
        }
        if (word === '@') return { kind: 'call', node: parseBlock() };
        if (word === '$') return { kind: 'call', node: parseVariable() };
        if (word.startsWith('!')) {
            pos++;
            return parseBuiltinValue(word);
        }
        if (word.startsWith('#')) {
            throw new Error(`DSL 语法错误：宏 '${word}' 暂未实现`);
        }
        // 比较运算符 < > 允许当原子
        if (word === '<' || word === '>') {
            pos++;
            return { kind: 'atom', value: word };
        }
        if (isKeyword(word)) {
            throw new Error(`DSL 语法错误：期望参数，实际 '${word}'`);
        }
        pos++;
        return { kind: 'atom', value: parseAtom(word) };
    }

    /** $名字 —— 变量取值积木（报告者）。名字是符号，不要求已在项目里存在。 */
    function parseVariable(): TNode {
        expect('$');
        const name = takeName();
        return {
            opcode: OPCODES.DATA_VARIABLE_GET,
            args: [],
            state: { fields: { NAME: name }, extraState: { dataId: name } },
        };
    }

    /** !true / !false / !s_true / !s_false —— 布尔积木；s_ 前缀表示 shadow。 */
    function parseBuiltinValue(word: string): TValueExpr {
        const match = /^!(s_)?(true|false)$/.exec(word);
        if (match) {
            return {
                kind: 'state',
                state: {
                    type: OPCODES.OPERATOR_LOGIC_BOOLEAN,
                    extraState: { value: match[2] === 'true' },
                },
                shadow: Boolean(match[1]),
            };
        }
        throw new Error(`DSL 语法错误：不认识的 '!' 构造 '${word}'`);
    }

    /** !f_* 等会生成积木的构造（语句位置）。 */
    function parseBuiltinBlock(word: string): TNode {
        throw new Error(`DSL 语法错误：'${word}' 暂未实现`);
    }

    /** [ "..."] —— 逃逸舱；字符串内容按宽松对象字面量解析成序列化状态。 */
    function parsePayload(): Record<string, unknown> {
        expect('[');
        const word = take();
        if (!word?.startsWith('"')) {
            throw new Error(`DSL 语法错误：[] 中需要字符串`);
        }
        expect(']');
        return parseObjectLiteral(parseAtom(word) as string);
    }

    return parseScript(false);
};

type TState = Blockly.serialization.blocks.State;

/** 把原子按 field 的类型/选项转成可写入序列化的值。 */
const coerceField = (slot: IFieldSlot, atom: TAtom): unknown => {
    if (slot.options) {
        for (const option of slot.options) {
            if (option === 'separator') continue;
            const [label, value] = option;
            if (label === atom || value === atom) return value;
        }
    }
    if (slot.numeric) {
        const number = Number(atom);
        if (Number.isFinite(number)) return number;
    }
    return atom;
};

/** 两个 check 有交集即兼容；任一方为空表示不限。 */
const isCompatible = (output: string[] | null, check: string[] | null): boolean => {
    if (!check || check.length === 0) return true;
    if (!output || output.length === 0) return true;
    return check.some(item => output.includes(item));
};

const formatCheck = (check: string[] | null): string =>
    check && check.length > 0 ? check.join(' | ') : 'any';

/** 原子 → shadow 状态：优先用 toolbox 给的 shadow 类型，再按类型把原子写进它的 field。 */
const atomToShadow = (shadowType: string | null, atom: TAtom): TState => {
    const type =
        shadowType ??
        (typeof atom === 'number'
            ? OPCODES.math_number
            : typeof atom === 'boolean'
              ? OPCODES.OPERATOR_LOGIC_BOOLEAN
              : OPCODES.text);
    const slot = _BlocksDefinitions[type]?.fields[0];
    if (slot) return { type, fields: { [slot.name]: coerceField(slot, atom) } };
    if (typeof atom === 'boolean') return { type, extraState: { value: atom } };
    return { type };
};

/** 取数组指定下标，越界返回 undefined（槽位用完后忽略多余参数）。 */
const pick = <T>(items: T[], index: number): T | undefined => items[index];

/** 一串语句 → 用 next 串起来的积木栈，返回栈顶。 */
function buildScript(nodes: TNode[]): TState | undefined {
    if (nodes.length === 0) return undefined;
    const head = buildNode(nodes[0]);
    let tail = head;
    for (let index = 1; index < nodes.length; index++) {
        const next = buildNode(nodes[index]);
        tail.next = { block: next };
        tail = next;
    }
    return head;
}

/** 单个积木 → 序列化状态，参数按类别（field/value/statement）顺序填槽。 */
function buildNode(node: TNode): TState {
    const payload = node.state ?? {};
    const definition = _BlocksDefinitions[node.opcode];
    const state = { ...payload, type: node.opcode } as TState;
    if (!definition) return state;

    let fieldIndex = 0;
    let valueIndex = 0;
    let statementIndex = 0;
    const fields: Record<string, unknown> = {};
    const inputs: Record<string, Blockly.serialization.blocks.ConnectionState> = {};
    const leftoverValues: TValueExpr[] = [];
    const leftoverStatements: TNode[][] = [];

    const assignValue = (
        name: string,
        check: string[] | null,
        shadowType: string | null,
        expr: TValueExpr,
    ): void => {
        if (expr.kind === 'skip') return;
        if (expr.kind === 'state') {
            inputs[name] = expr.shadow ? { shadow: expr.state } : { block: expr.state };
            return;
        }
        if (expr.kind === 'call') {
            const nested = _BlocksDefinitions[expr.node.opcode];
            if (!isCompatible(nested?.output ?? null, check)) {
                throw new Error(
                    `DSL 类型错误：'${expr.node.opcode}' 输出 ${formatCheck(nested?.output ?? null)}，` +
                        `但 '${node.opcode}.${name}' 需要 ${formatCheck(check)}`,
                );
            }
            inputs[name] = { block: buildNode(expr.node) };
        } else {
            inputs[name] = { shadow: atomToShadow(shadowType, expr.value) };
        }
    };

    for (const arg of node.args) {
        if (arg.kind === 'field') {
            const slot = pick(definition.fields, fieldIndex++);
            if (slot) fields[slot.name] = coerceField(slot, arg.value);
        } else if (arg.kind === 'statement') {
            const slot = pick(definition.statements, statementIndex++);
            const head = buildScript(arg.body);
            if (slot && head) inputs[slot.name] = { block: head };
            else if (!slot) leftoverStatements.push(arg.body);
        } else {
            const slot = pick(definition.values, valueIndex++);
            if (!slot) {
                leftoverValues.push(arg.expr);
                continue;
            }
            assignValue(slot.name, slot.check, slot.shadowType, arg.expr);
        }
    }

    // 静态槽之外剩下的参数交给动态积木适配器（mutation / updateShape）
    const dynamic = _BlockOverrides[node.opcode]?.dynamic;
    if (dynamic && (leftoverValues.length > 0 || leftoverStatements.length > 0)) {
        const extra = dynamic({ values: leftoverValues, statements: leftoverStatements });
        if (extra) {
            (extra.values ?? []).forEach((slot, index) => {
                const expr = leftoverValues.at(index);
                if (expr) assignValue(slot.name, slot.check, slot.shadowType, expr);
            });
            (extra.statements ?? []).forEach((slot, index) => {
                const body = leftoverStatements.at(index);
                const head = body ? buildScript(body) : undefined;
                if (head) inputs[slot.name] = { block: head };
            });
            if (extra.extraState !== undefined) state.extraState = extra.extraState;
        }
    }

    // [] 逃逸舱的状态作为底，() 派生的字段/输入覆盖其上
    const baseFields = (payload.fields ?? {}) as Record<string, unknown>;
    const baseInputs = (payload.inputs ?? {}) as Record<
        string,
        Blockly.serialization.blocks.ConnectionState
    >;
    const mergedFields = { ...baseFields, ...fields };
    const mergedInputs = { ...baseInputs, ...inputs };
    if (Object.keys(mergedFields).length > 0) state.fields = mergedFields;
    if (Object.keys(mergedInputs).length > 0) state.inputs = mergedInputs;
    return state;
}

let _definitionsPromise: Promise<void> | undefined;

/** 槽位表首次使用时构建一次；{@link spawnBlockAST} 会等它就绪，避免拿到空表。 */
const ensureDefinitions = (): Promise<void> => (_definitionsPromise ??= refreshBlocksDefinitions());

/** DSL 源码 → Blockly 序列化状态（顶层积木栈）。 */
const spawnBlockAST = async (content: string): Promise<TState | undefined> => {
    await ensureDefinitions();
    return buildScript(parseDSL(content));
};

const _getBlockStyle = () => {
    const style: string = Array.from(document.head.querySelectorAll('style'))
        .filter(
            el =>
                el.className === 'blockly-renderer-style' ||
                el.id === 'blockly-common-style' ||
                el.className === 'ash-style',
        )
        .map(el => el.textContent)
        .join('\n');
    return style;
};

/**
 * 由积木AST生成积木SVG
 * @param ast
 * @param needStyle 是否需要内联样式（用于导出）
 * @returns
 */
const spawnBlocksSvg = async (
    ast: Blockly.serialization.blocks.State,
    needStyle = false,
): Promise<string> => {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-99999px;top:0;';
    document.body.appendChild(host);

    const ws = Blockly.inject(host, {
        renderer: 'astratch',
        theme: 'astratch',
        plugins: {},
        trashcan: false,
        toolbox: undefined,
    });

    const block = Blockly.serialization.blocks.append(ast, ws) as Blockly.BlockSvg;
    // 部分积木在 loadExtraState 里排了延后更新（如布尔块连上父块后继承父色），
    // 等一个微任务让它们跑完再渲染，否则导出会拿到错误的颜色。
    await Promise.resolve();
    ws.getRenderer().render(block);

    const bBox = ws.getBlocksBoundingBox();
    const canvas = ws.getCanvas().cloneNode(true) as SVGGElement;
    canvas.removeAttribute('transform');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('class', 'blocklySvg astratch-renderer astratch-theme');
    svg.setAttribute(
        'viewBox',
        `${String(bBox.left)} ${String(bBox.top)} ${String(bBox.getWidth())} ${String(bBox.getHeight())}`,
    );
    svg.setAttribute('width', String(bBox.getWidth()));
    svg.setAttribute('height', String(bBox.getHeight()));
    svg.appendChild(canvas);

    canvas.querySelectorAll('*').forEach(el => {
        el.removeAttribute('aria-label');
        el.removeAttribute('aria-roledescription');
        el.removeAttribute('role');
        el.removeAttribute('data-id');
        el.removeAttribute('id');
        el.removeAttribute('focusable');
    });

    const style = document.createElement('style');
    if (needStyle) style.textContent = _getBlockStyle();
    svg.insertBefore(style, svg.firstChild);

    const svgString = new XMLSerializer().serializeToString(svg);
    ws.dispose();
    host.remove();
    return svgString;
};

/** 只读槽位表，供测试/调试枚举全部积木。 */
const getBlocksDefinitions = (): Record<string, IBlockDefinition | undefined> => _BlocksDefinitions;

export { refreshBlocksDefinitions, spawnBlockAST, spawnBlocksSvg, getBlocksDefinitions };
export type { IBlockDefinition, IFieldSlot, IStatementSlot, IValueSlot };
