<p align="center">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./src/assets/lightLogo.svg" alt="Astratch Light Logo">
      <img src="./src/assets/darkLogo.svg" alt="Astratch Dark Logo" width="50%">
    </picture><br />
    <img src="https://img.shields.io/github/stars/TheAstrasTeam/Astratch?style=social" alt="Stars" />
    <img src="https://img.shields.io/github/forks/TheAstrasTeam/Astratch?style=social" alt="Forks" />
    <img src="https://img.shields.io/github/issues/TheAstrasTeam/Astratch?color=0099ff" alt="Issues" />
    <img src="https://img.shields.io/github/actions/workflow/status/TheAstrasTeam/Astratch/ci.yml
    " alt="CI" /><br />
    <a href="./README-ZH_CN.md" >中文</a>
    <hr />
</p>

> *Bridging the gap between toys and tools.*

`Astratch` is a graphical IDE (Integrated Development Environment) that aims to let you build *anything* by "snapping blocks together," just like Scratch.

# What does Astratch do?

In short, `Astratch` draws on the strengths of other `Scratch editors`, using **JIT** (**Just-In-Time**) compilation technology to **compile** your project scripts into `JavaScript` and run them, making project execution *lightning fast*. At the same time, `Astratch` redesigns the **project model** to make projects more maintainable and faster, while adding more **features commonly found in programming languages**.

`Astratch` still uses the same editor as `Scratch` — `Blockly` — and extends it with many features that `Scratch` does not have, building a **bridging buffer** between Scratch's children-oriented language and real game engines / programming languages.

# Acknowledgments

### Blockly

`Astratch` clones, modifies, and uses several plugins from [blockly-examples](https://github.com/RaspberryPiFoundation/blockly-samples):

- [Continuous Toolbox](./plugins/continuous-toolbox/)
- [field-angle](./plugins/field-angle/)
- [field-colour-hsv-sliders](./plugins/field-colour-hsv-sliders/)
- [field-colour](./plugins/field-colour/)
- [field-grid-dropdown](./plugins/field-grid-dropdown/)

We have modified some of these plugins to better fit the *vision* of `Astratch`. We comply with the `Apache License v2.0`, and each modified file is annotated at the beginning.

### ICONS

`Astratch` uses icons from the following open-source repositories:

- [Material Symbols](https://github.com/google/material-design-icons)
- [Typicons](https://github.com/stephenhutchings/typicons.font)

Once again, we express our great thanks!

# Development

## Open Source
`Astratch` is licensed under the `Apache License v2.0`. In short, you are **free** to **use, modify, copy,** and **distribute** `Astratch` (including for commercial purposes), but you must retain the original author's copyright notice ([NOTICE](./NOTICE)) and disclaimer, and add a **statement** before any modified file confirming that you have made changes.

## Contributing

We warmly welcome community contributions! Whether it's **fixing bugs, improving documentation, submitting new features,** or **proposing suggestions**, feel free to participate and speak your mind.

You can search online for how to submit a `Pull Request` / `Issue`!

Before you contribute, please note:
- Keep code style consistent with the project;
- Add or update corresponding test cases (if needed);
- All tests must pass;
- Commit messages should clearly describe the changes.

Also, ensure that the `CI` of your forked repository passes!

## Development

If you want to develop your own version based on `Astratch`, please make sure your computer meets the following requirements:
- `node` environment installed, with version >= v24.16.0
- `pnpm` package manager installed
- `git` installed
- Network access to `GitHub`

### Clone the repository
> If you have forked your own repository, you need to `clone` the corresponding repository

``` bash
git clone https://github.com/TheAstrasTeam/Astratch.git
```

### Install dependencies

``` bash
cd Astratch
pnpm install
```

### Start the development server

``` bash
pnpm dev # Run `pnpm run` to see more commands
```