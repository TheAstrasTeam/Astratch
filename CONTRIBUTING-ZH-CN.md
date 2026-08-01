# 贡献

我们非常欢迎社区贡献！无论是**修复 Bug、改进文档、提交新功能**，还是**提出建议**，都可大胆地参与进来，畅所欲言。

## 代码

我们不排斥AI，您的贡献当然可以有相当一部分由AI编写，但是我们会审查AI的更改是否**合适**。我们十分建议您可以在AI生成的代码前加入一段文本指向此功能由AI编写，例如：

```ts
// 此功能由AI制作
```

## Pull Request

您需要将您的分支合并到**develop**分支内，而不是**main**分支，并确保能通过合并检查。

## 开发

如果想基于 `Astratch` 开发自己的版本，请确保您的电脑满足以下要求：

- 安装了`node`环境，且版本>=v24.16.0
- 安装了`pnpm`包管理器
- 安装了`git`
- 拥有可以访问`Github`的网络

### 克隆仓库

> 如果您已经`fork`到了自己的仓库，就要`clone`对应的仓库

```bash
git clone https://github.com/TheAstrasTeam/Astratch.git
```

### 安装依赖

```bash
cd Astratch
pnpm install
```

### 启动开发服务器

```bash
pnpm dev # 可运行`pnpm run`查看更多指令
```
