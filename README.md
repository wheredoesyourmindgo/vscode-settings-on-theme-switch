# Settings on Theme Switch

[![CI](https://github.com/wheredoesyourmindgo/vscode-settings-on-theme-switch/actions/workflows/ci.yml/badge.svg)](https://github.com/wheredoesyourmindgo/vscode-settings-on-theme-switch/actions/workflows/ci.yml)

Apply different VS Code settings for light themes, dark themes, high-contrast themes, or specific themes by name.

Some settings look right in one theme and wrong in another. Text can look thinner on a light background, a cursor can get lost in a busy dark theme, or one particular theme might want a heavier font weight. This extension applies the right settings whenever the color theme changes. It works well with `window.autoDetectColorScheme`, which follows your OS light/dark mode.

## Quick start

Add this to your user `settings.json` (**Preferences: Open User Settings (JSON)**):

```jsonc
"settingsOnThemeSwitch.darkColorThemeSettings": {
  "editor.fontWeight": "400"
},
"settingsOnThemeSwitch.lightColorThemeSettings": {
  "editor.fontWeight": "500"
}
```

Each object maps a setting ID to the value you want. Any setting you can put in `settings.json` can go here.

## Getting more specific

Settings are layered from general to specific, and the more specific value wins:

1. **Dark or light:** `darkColorThemeSettings` or `lightColorThemeSettings`.
2. **High contrast:** `highContrastDarkColorThemeSettings` or `highContrastLightColorThemeSettings`, on top of dark or light.
3. **Theme name:** an entry in `themeSettings`, on top of everything else.

So each level only needs what's different from the one below it:

```jsonc
"settingsOnThemeSwitch.darkColorThemeSettings": {
  "editor.fontWeight": "400",
  "editor.cursorWidth": 2
},
"settingsOnThemeSwitch.highContrastDarkColorThemeSettings": {
  "editor.cursorWidth": 4
},
"settingsOnThemeSwitch.themeSettings": {
  "Default Dark Modern": {
    "editor.fontWeight": "450"
  }
}
```

With **Default Dark Modern**, that gives a font weight of 450 and a cursor width of 2. With **Default High Contrast**, it gives 400 and 4.

Use theme names exactly as they appear in your `settings.json` for `workbench.colorTheme`. To find a theme's name, select it with **Preferences: Color Theme** and look at that setting.

## Settings

| Setting | Applies when |
| --- | --- |
| `settingsOnThemeSwitch.darkColorThemeSettings` | A dark or high-contrast dark theme is active. |
| `settingsOnThemeSwitch.lightColorThemeSettings` | A light or high-contrast light theme is active. |
| `settingsOnThemeSwitch.highContrastDarkColorThemeSettings` | A high-contrast dark theme is active. |
| `settingsOnThemeSwitch.highContrastLightColorThemeSettings` | A high-contrast light theme is active. |
| `settingsOnThemeSwitch.themeSettings` | The named theme is active. |

Settings are applied when VS Code starts, whenever the color theme changes, and whenever you edit any of the settings above.

## Things to know

- **Values are written to your user `settings.json`**, the same as if you had changed them by hand. If you use Settings Sync, those changes sync too.
- **Nothing is undone automatically.** A setting keeps its last value until something sets it again. If you want `editor.fontWeight` to change back when you leave a theme, give it a value in both `darkColorThemeSettings` and `lightColorThemeSettings`. Anything you set for a specific theme should also have a value in the dark or light settings.
- **Workspace settings still win.** If a workspace or folder sets the same key, that value overrides the one this extension writes to your user settings.
- **Only changed values are written.** If a setting already has the right value, `settings.json` is left alone.

## Example: follow the OS appearance

```jsonc
"window.autoDetectColorScheme": true,
"workbench.preferredDarkColorTheme": "Default Dark Modern",
"workbench.preferredLightColorTheme": "Default Light Modern",

"settingsOnThemeSwitch.darkColorThemeSettings": {
  "editor.fontWeight": "400"
},
"settingsOnThemeSwitch.lightColorThemeSettings": {
  "editor.fontWeight": "500"
}
```

When VS Code follows your OS appearance, `themeSettings` matches the names in `workbench.preferredDarkColorTheme` and `workbench.preferredLightColorTheme`.

## License

[MIT](LICENSE)
