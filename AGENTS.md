# Astratch

> 此文档使用简体中文编写，实际你需要根据使用者（用户）的实际语言回复
> This document is written in Simplified Chinese, and you need to reply according to the actual language of the user

Astratch 是一个基于 TypeScript 6 + React 19 + zustand 技术栈编写的“图形化编辑器”，它类似于Scratch，但更高级（引入了Scratch不具有的特性）。

## CODING

在编写时，需要在您编写的文件头写诸如：

```ts
// 此文件由AI生成
```

需要在您编写的方法头写诸如：

```ts
// 此函数/方法/类由AI生成
```

> 其中的具体内容看实际编写的什么，以及使用的语言尽量使用统一的“简体中文”，当然也要看实际开发者使用的语言

需要注意，只有你（AI）编写的才需要加这句话，并且**只有大块且复杂的AI代码才需要标注**。小修补（例如一两行的修改）不需要标注，否则全是噪音，会让真正需要人警惕的代码淹没在标记里。

---

在编写时需要注意，**VM不该过分知道UI**。

### 一些其它提醒

`src\components` 为可复用组件
`src\gui` 为界面UI，它会使用可复用组件

## 验证

完成代码后必须运行以下命令验证：

- `pnpm lint` — eslint + tsc 类型检查
- `pnpm test` — 运行 vitest 测试
- `pnpm check` — prettier 格式检查；格式不对时先 `pnpm format`

## 命名与类型约定

- 接口使用 `I` 前缀（如 `ITarget`、`IFolder`），类型别名使用 `T` 前缀（如 `TTargetMode`）
- 类型集中在 `src/types/`，按领域分文件（vm.ts / blocks.ts / gui.ts / lib.ts）

## VM 事件约定

- 凡修改 VM 状态（target、文件夹、设置等）的方法，必须 `vm.emit` 对应事件（如 `events.UPDATE_PROJECT`、`events.UPDATE_TARGET_STRUCTURE`），否则 UI 不会刷新
- UI 可以直接读取 runtime 状态，但**修改必须走 runtime 的方法**，不要绕过方法直接改内部数据

## i18n

- 所有用户可见文案必须使用 i18next key（`i18next.t(...)`），禁止硬编码中文
- 新增或修改 key 时，`zh-CN` 和 `en` 两个语言文件都要同步更新（fallback 是英文）
- 英文翻译可以交给 AI 完成

## 测试

- VM 核心逻辑（runtime、project 等）必须配套测试，写在 `tests/` 下
- GUI 组件可以不写测试
- 测试与文件系统互动的代码时，用 mock 模拟 `FileSystemDirectoryHandle`，参考 `tests/vm/project.test.ts` 的写法

## 提交

- 使用 Conventional Commits：`feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `test:` / `ci:` 等
- 语言不限，中文即可
