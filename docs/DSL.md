# Astratch DSL 写法参考

DSL 是一段文本，用来描述要生成的积木结构。这份文档只讲**怎么写**。

## 词法

- 空白（空格、换行、制表）只用于分隔 token，会被忽略（字符串内除外）。
- 关键字符号：`;` `{` `}` `(` `)` `,` `<` `>`。
- 字符串用双引号，支持 `\"`、`\\`。
- 数字：`10`、`-3.14`。
- 布尔：`true`、`false`。
- 没有注释语法。

## 语句

```
积木名;                          // 无参
积木名(参数, 参数, ...);         // 带参
```

- **积木名就是 Blockly 的 opcode**，如 `entity_transform_position_moveStep`。
- 同一层相邻的语句会被串成 `next` 栈。
- `;` 用于结束语句，可以省略，但建议写。
- 括号只在有参数时才需要。

## 参数分三类

按包裹符号区分，三类各自独立：

| 写法      | 含义           | 例子                                     |
| --------- | -------------- | ---------------------------------------- |
| `<值>`    | field          | `data_variable_set(<score>, 10)`         |
| `{ ... }` | statement 输入 | `control_condition_if(cond, { ... })`    |
| 其它      | value 输入     | `entity_transform_position_moveStep(10)` |

## 位置是怎么对齐的

三类参数**各自按出现顺序**填到同类槽位，槽位顺序就是积木定义里 field / value / statement 的声明顺序：

- 第 1 个 `<...>` 填第 1 个 field，第 2 个填第 2 个，以此类推；
- value、statement 同理；
- 三类互不干扰，所以交错书写也不会错位；
- value 用 `_` 占位表示留空：

    ```
    data_array_push(_, 1);
    ```

- 参数多于槽位时多余部分忽略，少于槽位时后面的槽留空。

## 原子（字面量）

可以出现在 value 或 `<>` 里的基本值：

| 写法           | 结果                 |
| -------------- | -------------------- |
| `10` `-3.14`   | number               |
| `"hello"`      | string（必须双引号） |
| `true` `false` | boolean              |
| `+` `foo`      | 裸词（菜单选项等）   |

- 菜单建议写 value 而不是显示文案：`_ADD_` 比 `+` 跨语言稳定，两者都能匹配。
- 比较运算符直接写：`<` `>` `<=` `>=` `=` `!=`。`<` `>` 只有在 `<值>` 形式里才当 field 分隔符，单独出现就是运算符。
- 裸词里含 `,` `(` `<` `>` 等符号时，用引号包起来。

## value 位置怎么写

```
opcode(10);                                // 字面量 → 该输入的默认 shadow
opcode(operator_logic_compare(1, <, 2));   // 嵌套积木
opcode(entity_transform_layer_getLayer);   // 裸积木名 → 无参积木
opcode(_);                                 // 留空
```

- 字面量会包装成该输入在工具箱里的默认 shadow（数字 → `math_number`，字符串 → `text`，菜单/布尔 → 对应积木）。
- 嵌套积木会校验类型：子积木的输出与父输入的 check 必须有交集，否则报错：

    ```
    control_flow_waitUntil(operator_math_op(1, 2)); // Number 接 Boolean，报错
    ```

## field 位置怎么写

`<值>` 按字段类型写入：

- 下拉：按 label 或 value 匹配后写入 value；
- 数字字段：`<90>` → `90`；
- 文本字段：`<"hi">` → `hi`，也可以裸写 `<hi>`。

## statement 位置怎么写

`{ ... }` 里是一段脚本，可以有多条语句；`{}` 表示留空。

```
control_condition_if(cond, {
    entity_transform_position_moveStep(1);
    entity_appearance_images_showImage("hello world");
}, {
    entity_transform_position_moveStep(10);
});
```

statement 输入也有 check（`Action` / `MatchBranch` 等），body 的首个积木必须匹配。

## 动态积木

由 mutation 生成的槽要按“多余参数”的写法给出：

```
control_condition_if(cond, { ... });                                // 只有 then
control_condition_if(cond, { ... }, { ... });                       // then + else
control_condition_if(cond, { ... }, elseIfCond, { ... }, { ... });  // then + else if + else
```

`if` 的配对规则：多出来的 value 是 else if 条件；多出来的 `{}` 按顺序是 else if 体，若比条件多一个，最后一个当 `else`。

目前只适配了 `if`；canvas 点、函数参数、clone 行等暂不支持。

## 综合示例

```
event_lifecycle_onStart;
entity_transform_position_moveStep(10);
entity_appearance_images_showImage("hello world");
entity_transform_layer_setLayer(entity_transform_layer_getLayer);
control_flow_waitUntil(operator_logic_compare(1, <, 2));
control_condition_if(operator_logic_compare(1, <, 2), {
    entity_transform_position_moveStep(1);
    entity_appearance_images_showImage("hello world");
}, {
    entity_transform_position_moveStep(10);
});
```

## 常见错误

| 现象                          | 原因                                |
| ----------------------------- | ----------------------------------- |
| `期望参数，实际 ...`          | 括号/逗号位置不对，或字符串没加引号 |
| `< > 中缺少 field 值`         | 写了 `<` 却没有对应的 `>`           |
| `DSL 类型错误：...`           | 嵌套积木输出与父输入 check 不兼容   |
| `missing a(n) ... connection` | 动态槽的数量没按动态积木写法给出    |
