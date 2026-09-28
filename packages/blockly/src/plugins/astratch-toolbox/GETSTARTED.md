# Astratch Toolbox 开发说明

Astratch Toolbox 是 ASH 源码的一部分，不是独立 npm 包。相关命令需要在 ASH
项目根目录运行。

## 启动开发环境

```powershell
npm run dev
```

## 检查 TypeScript

```powershell
.\node_modules\.bin\tsc.cmd -p tsconfig.app.json --noEmit --noUnusedLocals false
```

## 检查格式

```powershell
.\node_modules\.bin\prettier.cmd --check plugins/astratch-toolbox/src
```

修改注册入口时，需要同步检查：

- `plugins/astratch-toolbox/src/index.ts`；
- `src/vm/blocks/index.ts`；
- `plugins/astratch-toolbox/test/index.js`。
