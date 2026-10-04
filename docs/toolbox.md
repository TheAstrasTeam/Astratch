# Astratch Toolbox

> [鼠标指针,...实体] 都是一个shadow，因此可填入内容（targetID）来实现额外的检测克隆体

# 注解

- `execute`: 纯执行
- `event`: 头积木
- `returns`-`type`: 返回`type`类型的值

## 呈现

### 运动

- `execute` 前进 number 步
- `execute` 移动到[鼠标指针, ...entities]处

---

- `execute` <↔>|将 x 坐标设为 number
- `execute` <↕>|将 y 坐标设为 number

- `execute` <↔>|将 x 坐标增加 number
- `execute` <↕>|将 y 坐标增加 number

- `execute` 将坐标设为 [number, number]
- `execute` 将坐标增加 [number, number]

### 方向

- `execute` <左转图标>|左转 number 度
- `execute` <右转图标>|右转 number 度
- `execute` 转到 number 度
- `execute` 面向[鼠标指针, ...entities]
- `returns`-`number` 当前度数

### 显示

- `execute` <四角↗>|将大小设为 number %
- `execute` <四角↗>|将大小增加 number %
- `returns` 大小

---

- `execute` <👀>|显示
- `execute` <👀×>|隐藏
- `returns`-`boolean` 正在显示

---

- `execute` 切换显示的造型为[空白]
    - [空白]是一个按钮，而`空白`是每个项目自带的一个**不可删除**的资源，它是一个显示空白的资源。
    - 按下按钮会打开`资源选取器`
    - 可以填入 **(临时)资源名称** 进行覆盖，若**临时资源**和**资源** 名称相同，取后者
- `returns`-`string` 当前显示的造型

---

- `execute` 将造型的[色彩,漩涡,鱼眼,像素化,马赛克,虚像,模糊]特效增加 number %
- `execute` 将造型的[色彩,漩涡,鱼眼,像素化,马赛克,虚像,模糊]特效设为 number %
- `returns`-`number` 造型的[色彩,漩涡,鱼眼,像素化,马赛克,虚像,模糊]特效

---

- `execute` 将造型的混合方式设为[默认,溶解,变暗,变亮,滤色,正片叠底,颜色加深,颜色减淡,叠加,差值,点光,柔光,强光]
- `returns`-`string` 造型的混合方式

---

- `execute` <br /><不规则四边形>|按顶点裁剪造型: <br />[number,number],[number,number]<br />[number,number],[number,number] +
    - [x,y],按比例( 0<= x,y <= 1)
- `execute` 重置顶点造型
    - [0,0],[1,0],[0,1],[1,1]
- `returns`-`[number,number][]` 裁剪造型的顶点

---

- `execute` 向[上, 下]`number`层
- `execute` 将层级设为 number
- `returns`-`number` 当前层级

### 文字

- `execute` <"Text">|显示文字 `string`
    - 替换原本的造型，就和艺术字一样。特效依然可以被应用
- `execute` 设置显示文字的字体为[默认]
    - 按下按钮会打开`资源选取器`
    - 可以填入 **(临时)资源名称** 进行覆盖，若**临时资源**和**资源** 名称相同，取后者

---

- `execute` 设置显示文字的颜色为`string`
- `execute` 设置显示文字的边框颜色为`string`
- `execute` 设置显示文字的边框宽度为`number`
- `returns`-`number` 显示文字的[边框宽度,像素长度]
- `returns`-`string` 显示文字的[颜色,边框颜色]

---

- `execute` 停止显示文字
    - 重新显示原先的造型

---

- `returns`-`boolean` 正在显示文字
- `returns`-`string` 显示文字的字体资源名称
- `returns`-`string` 显示文字的内容

## 音频

> 音频在目标和模块都能播放，因此统称目标

> 音频是分目标管理的，这意味着若a目标播放名称为a的音频，b目标是找不到的。

- `execute` [暂停,播放]所有音频
- `execute` 停止所有音频
- `execute` 将所有音频的[音量,音调,左右平衡]设为`number`%
    - 会覆盖其它音频的效果

- `returns`-`string[]` 所有音频的名称
    - 如果`播放音频`积木没有设置名称，则不会存进去

---

- `execute` 播放音频[空白]+(并设名称为`string`)
    - 按下按钮会打开`资源选取器`
    - 可以填入 **(临时)资源名称** 进行覆盖，若**临时资源**和**资源** 名称相同，取后者
    - 播放完成后**自动停止并删除**
    - 同名替换
- `execute` [暂停,播放]名称为`string`的音频
- `execute` 停止并删除名称为`string`的音频
- `execute` 将名称为`string`的音频的[音量,音调,左右平衡]设为`number`%

- `returns`-`boolean` 存在名称为`string`的音频
- `returns`-`boolean` 正在播放名称为`string`的音频
- `returns`-`string` 名称为`string`的音频使用的资源名称
- `returns`-`number` 名称为`string`的音频的[音量,音调,左右平衡]

## 资源

> **空白资源**不是一个真实的资源，而是一种抽象的占位符

- `returns`-`string[]` 所有资源的名称
- `returns`-`AssetHandle` 名称为`string`资源的内容

---

> 临时资源是全局共享的

- `execute` 添加类型为[类型]，名称为`string`的临时资源
    - [类型] 会打开 `类型制作器`
- `execute` 将名称为`string`的临时资源的内容设为`typeof  [类型]`
    - 填写的值的类型取决于[类型]的值
- `execute` 删除名称为`string`的临时资源
    - 如果其它地方使用了被删除（也就是不存在）的资源，返回**空白资源**
- `returns`-`boolean` 存在名称为`string`的临时资源
- `returns`-`AssetHandle` 名称为`string`的临时资源

---

- `returns`-`number` 资源`AssetHandle`的字节长度

- `returns`-`number` <图片>资源`AssetHandle`的[长度,宽度]
    - [长度,宽度] 均为像素数量
- `returns`-`string` <图片>资源`AssetHandle`的类型
    - [类型] 诸如`svg`, `png`等

- `returns`-`number` <音频>资源`AssetHandle`的音频长度

## 实体

### 克隆体

- [定义一个模板]
    - 定义模板名称
    - 定义接受的参数，和函数基本一致，例如“`(string)色的按钮，点击后触发(function)`”

---

当属于模板`object`的克隆体碰到[鼠标指针,...实体]时{}

---

- `returns`-`object` ...模板
    - 例如“`<图标> | (string)色的按钮，点击后触发(function)`”
    - 和函数值基本一致

---

- `returns`-`string`： <br /> 通过模板 `object` 创建实例<br /> 附带数据 [...values]
    - 返回指向实例的唯一ID，因此返回string
    - 类似构造了实例
- `execute` 激活实例`string`
    - 也就是“创建克隆体”
    - 如果传入了一个不存在的实例，什么都不做
- `execute` 删除实例`string`
    - 删除ID为`string`的克隆体实例&数据实例，ID变为无效
---
- `execute` 应用父实体的属性
    - 该块不会出现在`模块`中
    - 继承：xy坐标、方向、大小、造型、文字、特效、混合模式、裁剪

### 数据

- `returns`-`string` 此实体实例
    - 该块不会出现在`模块`中
    - 是的，克隆体和实体本质是同一种东西，所以它们都可以返回实例
    - 克隆体实例内会返回创建并激活（这俩行为肯定在一起）它的实例
- `returns`-`string[]` 所有的实体实例

---

- `returns`-`number`: <br />`string`实例的[`x坐标`,`y坐标`,`大小`,`方向`,`当前层级`,`显示文字的字号`,`显示文字的边框宽度`,`显示文字的像素长度`]

- `returns`-`boolean`: <br /> `string`实例[`正在显示`,`正在显示文字`]

- `returns`-`string`: <br /> `string`实例的[`当前显示的造型`,`显示文字的字体资源名称`,`显示文字的内容`,`显示文字的颜色`,`显示文字的边框颜色`]

- `returns`-`object[]`: <br /> `string`实例的[所有音频的名称,所有计时器的名称]
    ```
    {
        target: string
        ID: string
    }[]
    ```
    - 普通的音频互动可以识别这个格式,因为实际上默认的名字会被处理为上面格式再使用。

## 事件

- `event` 当▷点击时
- `event` 当鼠标[左键,中键,右键,任意键]被[按下,松开]

> keys: 1~0,a~z,A~Z,~`!@#$%^&*()_+-=[]\;',/.<>?:"{}|,Control,Shift,Tab,Alt,Enter,Delete,End,PageDown,PageUp,Home,Insert,ScrollLock,Pause,F2,F6,F8,F9,F10,ANY

- `event` 当按键[keys]被[按下,松开]

> 类似 Scratch 的广播机制不会**默认**提供，因为和Callback行为完全一致，仅作为一个开头挂载监听的语法糖（尽管后者使用稍微麻烦点）

- `event` 当此实体被[按下,松开]
    - 该块不会出现在`模块`内
    - 它只能检测`实体`，而不能检测`克隆体实例` （因为如果可用，**同个克隆体实例，链接到被使用的实体若不同，行为也有可能不同**。如果要解决，需提供返回“我是谁”的积木，但是这和*通过Scratch的局部变量实现ID*有何**本质区别**？)

- `event` 当项目运行了 `number` 秒后
    - 该块只会在成立后运行一次

## 流程

- `execute` 等待 `number` 秒
- `execute` 等待直到 `boolean` 成立

---

- `execute` 当`boolean`时重复执行{}
    - 事实上，{}也近似inline function的一种语法糖，虽然实现大不相同，但本质干的事差不多
    - “重复执行”和“重复执行直到”和“当时重复执行”的结合
    - 为什么scratch要三个基本一致的东西
- `execute` 重复`number`次，当前是第[次数]次
    - `次数`是一个可以无限拖出的块
- `execute` 遍历`array`的每一项，当前是[项]、第[个数]个
    - `项`和`个数`是可以无限拖出的块

---

- `execute` 跳出当前循环
- `execute` 跳过当前循环
- `execute` 退出这个脚本
    - 这会结束整个积木栈及其调用链
- `execute` 停止整个项目

## 分支

- `execute` 如果`boolean`{}+(否则如果`boolean`{})+(否则{})

---

- `execute` 匹配`any`{}
- `execute` 若是`any`{}
- `execute` 若无匹配{}

## 感知

### 输入

- `returns`-`number` 鼠标的x坐标
- `returns`-`number` 鼠标的y坐标
- `returns`-`boolean` 鼠标的[左键,中键,右键,任意键]被[按下,松开]
- `returns`-`boolean` 按键[keys]被[按下,松开]

---

- `returns`-`string` 最近按下的按键
- `returns`-`string[]` 正按下的所有按键

---

- `returns`-`number[]` 麦克风数据
    - 最大是2048项
    - 这个是实时更新的float32[]数组

---

- `returns`-`string` 询问用户
    - 会堵塞整个项目直到询问完成
    - `回答`积木是不再必要的，整个积木本来就返回字符串

- `returns`-`string` 用户名

---

- `returns`-`number` 2000年至今的天数
- `returns`-`number` 当前的[年,月,日,星期,时,分,秒]

---
> 计时器的作用域是这个目标

- `returns`-`number` 计时器 `string`

- `execute` 开始名为 `string` 的计时器
- `execute` 重置名为 `string` 的计时器
- `execute` 结束并删除名为 `string` 的计时器

### 检测

- `returns`-`boolean` 碰到[鼠标指针,...实体]
- `returns`-`number` 距离[鼠标指针,...实体]的距离

## 计算

### 数学

- `returns`-`number` `number` + `number` +(`number` + `number`)
- `returns`-`number` `number` - `number` +(`number` - `number`)
- `returns`-`number` `number` * `number` +(`number` * `number`)
- `returns`-`number` `number` / `number` +(`number` / `number`)
- `returns`-`number` `number` 的 `number` 次方

- `returns`-`number` 取`number`除以`number`的余数
- `returns`-`number` 取[绝对值,向上取整,向下取整,四舍五入]的`number`
- `returns`-`number` [平方根,立方根,sin,cos,tan,asin,acos,atan,ln,log]`number`

---

- `returns`-`number` 常数[π,e]

- `returns`-`number` 在`number`和`number`之间取随机数

### 逻辑

- `returns`-`boolean` `boolean` 且 `boolean` +(`boolean` 且 `boolean`)
- `returns`-`boolean` `boolean` 或 `boolean` +(`boolean` 或 `boolean`)
- `returns`-`boolean` `boolean` 不成立

### 字符串

- `returns`-`string` 连接 `string` 和 `string` +(和`string`)

- `returns`-`string` `string` 的第 `number` 位
    - 负数则从末尾算
- `returns`-`string` `string` 的第 `number` 到 `number` 位
- `returns`-`string[]` 以 `string` 拆分 `string`

- `returns`-`string` 字符[回车,制表符]

---

- `returns`-`boolean` `string` 包含 `string`

---

- `returns`-`number` `string` 的长度

## 数据

### 常驻数据

- [创建一个数据]

- `returns`-`unknown` <变量图标>|[...数据]
- `execute` <变量图标>|设置[...数据]为`unknown`
    - 常量也用这个块
    - 常量若设定后还执行了它（执行了两次），则无效
- `execute` <变量图标>|将[...数据][自增,自减,自除,自余]`number`
    - [...数据] 只显示类型为`number`的**变量**

### 临时数据

> 不可导出，作用域为 定义积木下的积木栈

- `returns`-`unknown` <临时变量图标>|`string`
    - 不存在返回空值（null）
- `execute` <临时变量图标>|定义临时数据 `string` 为[类型] `unknown`
    - `unknown`的值取决于设定的类型
- `execute` <临时变量图标>|删除临时数据 `string`
- `returns`-`boolean` <临时变量图标>|临时数据`string`可用

### 输入框

- `returns`-`string` "`string`"
    - 可填入字符串的输入框，返回字符串

- `returns`-`number` `number`
    - 可填入数字的输入框，返回数字

- `returns`-`boolean` `boolean`
    - 可填入布尔值的输入框，返回布尔值

- `returns`-`null` 空值
    - 返回空值

### 对象

- `returns`-`object` 空对象

---

- `returns`-`string[]` `object`的所有键
- `returns`-`unknown[]` `object`的所有值
    - 实际类型取决于`object`的类型
- `returns`-`unknown` `object`的`string`
- `returns`-`boolean` `object`拥有`string`
- `returns`-`number` `object`中键的数量
    - 也就是object中数据的数量，为防止混淆所以用键

---

- `returns`-`object` 删除`object`的`string`
- `returns`-`object` 将`object`的`string`设为`unknown`
    - 实际类型取决于`object`的类型

### 列表

> 实际称作“数组”更合适，但它会被误解为“存储‘数字’的组”，因此称为列表

- `returns`-`array` 空列表

---

- `returns`-`unknown` `array`的第`number`项
- `returns`-`number` `array`的项数
- `returns`-`number` `array`中`unknown`的位置
    - 不存在返回 -1

---

- `returns`-`unknown[]` 向`array`的末尾添加`unknown`
    - 实际类型取决于`array`的类型
- `returns`-`unknown[]` 向`array`的第`number`项后添加`unknown`
- `returns`-`unknown[]` 删除`array`的第`number`项

## 函数

- [创建函数]

---

- [...函数]
---

- `execute` 执行`function`
- `returns`-`unknown` 执行并返回`function`
- `returns`-`function` 行内函数{}

## 兼容积木

> 这栏的积木不会出现在实际工具箱，主要是设计为单向兼容Scratch所做
> 实际不希望用户运行，所以性能/样式较糟糕

- `returns`-`boolean` [鼠标指针,...实体]碰到颜色`string`
- `returns`-`boolean` 颜色`string`碰到颜色`string`

- `execute` 说 `string`
- `execute` 说 `string` `number` 秒

- `returns`-`string` 回答

- `returns`-`number` 麦克风响度

<!--
作为扩展而非原生内容
## 网络

- `execute`:<br /> 获取`string`的网页内容+(<br/>方法：[GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS]<br/>头：`string`<br/>内容：`string`)
    - 就是`fetch`方法嘛
- `returns`-`boolean` 正在使用网络
- `returns`-`string` 响应内容
...
-->
