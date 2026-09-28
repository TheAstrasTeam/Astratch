# Astratch-GUI/Theme

关于**Astratch**的主题

## 配置项

### 配色 accent

```js
{
    id: string;
    translateID: string;
    name: string;
    translate: boolean;
    kind: 'accent';
    scheme: {
        primary: string;
        secondary: string;
        tertiary: string;
        transparent: string;
        highlight: string;
    }
}
```

#### ID

`id` 是主题的**唯一识别值**，我们建议你使用`crypto.randomUUID()`的值作为id（不是塞进定义处，而是在控制台跑一次将输出的值加入进来），来防止撞车。

> 内置主题由于需要可读性因此ID确定

#### translate

在`translate`为`true`时，`translateID` 是主题名称的国际化ID配置。

在`translate`为`false`时，`name` 是主题名称的配置。

你可以把`translateID`和`name`都写上，但是实际只会有一个有效。

#### scheme

- `primary`: 主色
- `secondary`: 副色，比前暗一点
- `tertiary`: 第三色，比前暗一点
- `transparent`: 半透明色，是主色的透明版
- `highlight`: 高光，最亮色

### 界面 ui

```js
{
    id: string;
    translateID: string;
    kind: 'ui';
    mixWithAccent: boolean;
    isDarkTheme: boolean;
    scheme: {
        primary: string;
        secondary: string;
        tertiary: string;
        quaternary: string;
        'primary-icon': string;
        'secondary-icon': string;
        'tertiary-icon': string;
        'quaternary-icon': string;
        'transparent-dark': string;
        'transparent-light': string;
        'text': string;
    };
}
```

> ID 和 translate 和上面一致

#### scheme

- primary: 主色
- secondary: 副色，比前暗一点
- tertiary: 第三色，比前暗一点
- quaternary: 第四色，比前暗一点
- primary-icon: 图标主色（通常是主色的反色）
- secondary-icon: 图标副色，比前暗一点
- tertiary-icon: 图标第三色，比前暗一点
- quaternary-icon: 图标第四色，比前暗一点
- transparent-dark: 若你是**暗色**，则填**主色的透明版**，否则填**图标主色的透明版**
- transparent-light: 若你是**暗色**，则填**图标主色的透明版**，否则**填主色的透明版**
- text: 文字的颜色
