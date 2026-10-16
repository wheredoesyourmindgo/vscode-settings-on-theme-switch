# Change Log

All notable changes to the "Settings on Theme Switch" extension will be documented in this file.

## [Unreleased]

- Add `settingsOnThemeSwitch.themeSettings` for settings that apply to specific themes by name.
- Add `settingsOnThemeSwitch.highContrastDarkColorThemeSettings` and `settingsOnThemeSwitch.highContrastLightColorThemeSettings`.
- Settings now layer: dark or light, then high contrast, then theme name, with the more specific value winning.
- Rewrite README for the new settings.

## [0.3.2] - 2026-10-16

- New icon.

## [0.3.1] - 2026-10-15

- Move back to the Other category; the extension isn't a color theme.

## [0.3.0] - 2026-10-15

- Re-apply settings when `settingsOnThemeSwitch.*` is edited, without needing a theme switch.
- Skip writing settings that already have the target value.
- Restrict `settingsOnThemeSwitch.*` to user settings (`application` scope), since the values they apply are written to user settings.
- Rewrite README; add Marketplace keywords and issue links.

## [0.2.2] - 2026-10-15

- Activate on `onStartupFinished` instead of `*` to avoid slowing VS Code startup.
- Add MIT license.
- Smaller extension package (compressed icon, test files excluded).

## [0.2.1] - 2026-10-15

- Fix settings being read from a stale configuration snapshot.
- Treat high-contrast dark themes as dark.
- Await setting writes so updates apply reliably.

## [0.2.0] - 2024-05-12

- **Breaking:** renamed settings `settingsOnThemeSwitch.preferredDarkColorThemeSettings` → `settingsOnThemeSwitch.darkColorThemeSettings` and `settingsOnThemeSwitch.preferredLightColorThemeSettings` → `settingsOnThemeSwitch.lightColorThemeSettings`.

## [0.1.0] - 2024-05-12

- Added extension icon.

## [0.0.3] - 2024-05-12

- Initial release.
