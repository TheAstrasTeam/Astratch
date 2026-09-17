# Astratch DSL 写法参考

DSL 是一段文本，描述要生成的积木结构。这份文档只讲**怎么写**。

## 词法

- 空白（空格、换行、制表）只用于分隔，会被忽略（字符串内除外）。
- 关键字符号：`;` `{` `}` `(` `)` `,` `<` `>` `[` `]` `@` `$`。
- 字符串用双引号，支持 `\"`、`\\`。
- 数字：`10`、`-3.14`；布尔：`true`、`false`。
- `!` 和 `#` 直接粘在后面的词上（`!true`、`!f_define`、`#define`）。
- 没有注释语法。

## 基本形式

积木以 `@` 开头，后面跟 opcode：

```
@event_lifecycle_onStart;                 // 无参，括号可省
@entity_transform_position_moveStep(10);  // 带参
```

- **opcode 就是 Blockly 的积木名**。
- 同一层相邻语句会被串成 `next` 栈；`;` 可省，建议写。

## `[]` 逃逸舱

`[...]` 里放一个**字符串**，字符串内容按宽松对象字面量解析成序列化状态，直接铺进积木：

```
@data_variable_set["{ fields: { NAME: 'score' } }"]();
```

- 宽松对象：键可不加引号，字符串可用单/双引号，允许尾逗号和 `//`、`/* */` 注释。
- `[]` 与 `()` 可任意顺序、都可省略；两者冲突时 **`()` 优先**。
- 任何 sugar 表达不了的都能用它写，是终极逃生舱。

## 参数分三类

`(...)` 里的参数按包裹符号分三类，各自独立：

| 写法      | 含义           | 例子                                      |
| --------- | -------------- | ----------------------------------------- |
| `<值>`    | field          | `@data_variable_set(<score>, 10)`         |
| `{ ... }` | statement 输入 | `@control_condition_if(cond, { ... })`    |
| 其它      | value 输入     | `@entity_transform_position_moveStep(10)` |

三类**各自按出现顺序**填到同类槽位（顺序 = 积木定义里 field / value / statement 的声明顺序），互不干扰，交错书写也不会错位。value 用 `_` 表示留空。

## 原子

| 写法           | 结果                 |
| -------------- | -------------------- |
| `10` `-3.14`   | number               |
| `"hello"`      | string（必须双引号） |
| `true` `false` | boolean              |
| `+` `foo`      | 裸词（菜单选项等）   |

- 菜单建议写 value 而不是显示文案：`_ADD_` 比 `+` 跨语言稳定，两者都能匹配。
- 比较运算符直接写：`<` `>` `<=` `>=` `=` `!=`；`<` `>` 只有写成 `<值>` 时才当 field 分隔符。

## value 位置怎么写

```
@op(10);                                  // 字面量 → 该输入的默认 shadow
@op(@operator_logic_compare(1, <, 2));    // 嵌套积木
@op($score);                              // 变量取值积木
@op(!s_false);                            // 布尔积木（shadow）
@op(_);                                   // 留空
```

嵌套积木会校验类型：子积木输出与父输入 check 必须有交集，否则报错。

## `$`：变量取值

`$名字` 生成一个变量取值积木（`data_variable_get`）。名字是**符号**，不要求项目里已经存在；有同名变量时会显示该变量。

```
$score;
@entity_transform_position_moveStep($score);
```

## `!`：布尔与内置构造

- `!true` `!false` —— 普通布尔积木（挂在 `block` 下）。
- `!s_true` `!s_false` —— shadow 布尔积木。

普通积木（非 shadow）与 shadow 的连接方式不同，所以分成两个写法。

## 位置是怎么对齐的

- 第 1 个 `<...>` 填第 1 个 field，第 2 个填第 2 个，以此类推；value、statement 同理。
- 参数多于槽位时多余部分交给动态积木适配器或忽略，少于槽位时后面的槽留空。

## statement 位置怎么写

`{ ... }` 里是一段脚本，可以有多条语句；`{}` 表示留空。statement 输入也有 check（`Action` / `MatchBranch` 等），body 首个积木必须匹配。

## 动态积木

由 mutation 生成的槽按“多余参数”给出：

```
@control_condition_if(cond, { ... });                                // 只有 then
@control_condition_if(cond, { ... }, { ... });                       // then + else
@control_condition_if(cond, { ... }, elseIfCond, { ... }, { ... });  // then + else if + else
```

`if` 的配对规则：多出来的 value 是 else if 条件；多出来的 `{}` 按顺序是 else if 体，若比条件多一个，最后一个当 `else`。

## 综合示例

```
@event_lifecycle_onStart;
@entity_transform_position_moveStep(10);
@entity_appearance_images_showImage("hello world");
@entity_transform_layer_setLayer(@entity_transform_layer_getLayer);
@control_flow_waitUntil(@operator_logic_compare(1, <, 2));
@entity_transform_position_moveStep($score);
@control_condition_if(@operator_logic_compare(1, <, 2), {
    @entity_transform_position_moveStep(1);
    @entity_appearance_images_showImage("hello world");
}, {
    @control_flow_waitUntil(!s_false);
});
```

## 计划中

以下语法尚未实现：

- `!f_define` / `!f_use` / `!f_inline` / `!f_param` / `!f_execute` / `!f_rexecute`：函数族（定义签名、函数值、执行）。
- `#define(x, y)` / `#(x)`：AST 级宏，全局作用域、先定义后使用。
- `!p_dropdown(CAN_PUTIN_BLOCKS, "NAME")`：签名里的下拉参数。

## 常见错误

| 现象                          | 原因                                |
| ----------------------------- | ----------------------------------- |
| `积木要以 '@' 开头`           | 忘了 `@`                            |
| `期望参数，实际 ...`          | 括号/逗号位置不对，或字符串没加引号 |
| `< > 中缺少 field 值`         | 写了 `<` 却没有对应的 `>`           |
| `DSL 类型错误：...`           | 嵌套积木输出与父输入 check 不兼容   |
| `missing a(n) ... connection` | 动态槽的数量没按动态积木写法给出    |
