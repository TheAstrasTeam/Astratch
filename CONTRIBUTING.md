# Contributing

[中文](./CONTRIBUTING-ZH-CN.md)

We warmly welcome community contributions! Whether it's **fixing bugs, improving documentation, submitting new features,** or **proposing suggestions**, feel free to participate and speak your mind.

## Code

We are not against AI — your contributions can, of course, be partly written by AI, but we will review whether the AI-generated changes are **appropriate**. We strongly suggest that you add a comment before AI-generated code indicating that this feature was made by AI, for example:

```ts
// This feature was made by AI
```

You need to make sure it passes the merge checks.

## Development

If you want to develop your own version based on `Astratch`, please make sure your computer meets the following requirements:

- `node` environment installed, with version >= v24.16.0
- `pnpm` package manager installed
- `git` installed
- Network access to `GitHub`

### Clone the repository

> If you have forked `Astratch` to your own repository, you need to `clone` the corresponding repository

```bash
git clone https://github.com/TheAstrasTeam/Astratch.git
```

### Install dependencies

```bash
cd Astratch
pnpm install
```

### Start the development server

```bash
pnpm dev # Run `pnpm run` to see more commands
```
