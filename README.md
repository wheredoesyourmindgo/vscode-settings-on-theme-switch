# Settings on Theme Switch

Apply a different set of VS Code settings depending on whether a light or dark color theme is active.

Some settings look right in one theme and wrong in the other. For example, text can look thinner on a light background, cursor and bracket styles may need tweaking, or you may want a different terminal font. This extension swaps those settings for you whenever the color theme changes. It works well with `window.autoDetectColorScheme`, which follows your OS light/dark mode.

## Usage

Add one or both of these to your user `settings.json` (**Preferences: Open User Settings (JSON)**):

```jsonc
"settingsOnThemeSwitch.darkColorThemeSettings": {
  "editor.fontWeight": "400",
  "terminal.integrated.fontWeight": "400"
},
"settingsOnThemeSwitch.lightColorThemeSettings": {
  "editor.fontWeight": "500",
  "terminal.integrated.fontWeight": "500"
}
```

Each object maps a setting ID to the value you want when that kind of theme is active. Any setting you can put in `settings.json` can go here.

The settings are applied:

- when VS Code starts,
- whenever the active color theme changes, and
- whenever you edit either of the settings below.

## Settings

| Setting | Description |
| --- | --- |
| `settingsOnThemeSwitch.darkColorThemeSettings` | Settings to apply when a dark theme is active. |
| `settingsOnThemeSwitch.lightColorThemeSettings` | Settings to apply when a light theme is active. |

High-contrast dark themes count as dark. High-contrast light themes count as light.

## Things to know

- **Values are written to your user `settings.json`.** The extension updates your global (user) settings, the same as if you had changed them by hand. If you use Settings Sync, those changes sync too.
- **List a setting in both objects if you want it to switch back.** Nothing is undone automatically. If `editor.fontWeight` appears only in `darkColorThemeSettings`, it keeps the dark value after you switch to a light theme.
- **Workspace settings still win.** If a workspace or folder sets the same key, that value overrides the one this extension writes to your user settings.
- **Only changed values are written.** If a setting already has the right value, the extension leaves `settings.json` alone.

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

## License

[MIT](LICENSE)
