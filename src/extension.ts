import * as vscode from "vscode";

const SECTION = "settingsOnThemeSwitch";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    // Listen for theme changes and update settings accordingly
    vscode.window.onDidChangeActiveColorTheme(() => {
      updateSettingsBasedOnTheme();
    }),
    // Re-apply when the user edits this extension's own settings
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(SECTION)) {
        updateSettingsBasedOnTheme();
      }
    })
  );

  // Initial settings update
  updateSettingsBasedOnTheme();
}

function isDarkTheme(kind: vscode.ColorThemeKind) {
  return (
    kind === vscode.ColorThemeKind.Dark ||
    kind === vscode.ColorThemeKind.HighContrast
  );
}

function isHighContrastTheme(kind: vscode.ColorThemeKind) {
  return (
    kind === vscode.ColorThemeKind.HighContrast ||
    kind === vscode.ColorThemeKind.HighContrastLight
  );
}

interface SettingsReader {
  get<T>(key: string): T | undefined;
}

/**
 * Works out the name of the active color theme, as it appears in settings.json.
 * VS Code's API only exposes the theme's kind, so this mirrors how VS Code picks
 * a theme from `workbench.colorTheme` and the `workbench.preferred*ColorTheme`
 * settings. When more than one could be active, candidates whose kind is known
 * not to match are skipped. Returns undefined if no candidate fits.
 */
export function resolveThemeName(
  kind: vscode.ColorThemeKind,
  settings: SettingsReader,
  kindOfTheme: (name: string) => vscode.ColorThemeKind | undefined
): string | undefined {
  const highContrast = isHighContrastTheme(kind);
  const preferredHighContrast = settings.get<string>(
    kind === vscode.ColorThemeKind.HighContrastLight
      ? "workbench.preferredHighContrastLightColorTheme"
      : "workbench.preferredHighContrastColorTheme"
  );
  const preferredForScheme = settings.get<string>(
    isDarkTheme(kind)
      ? "workbench.preferredDarkColorTheme"
      : "workbench.preferredLightColorTheme"
  );
  const colorTheme = settings.get<string>("workbench.colorTheme");

  const candidates: (string | undefined)[] = [];
  if (highContrast && settings.get<boolean>("window.autoDetectHighContrast")) {
    candidates.push(preferredHighContrast);
  }
  if (settings.get<boolean>("window.autoDetectColorScheme")) {
    candidates.push(preferredForScheme);
  } else {
    // A high-contrast theme picked by hand wins over the OS high-contrast default
    candidates.unshift(colorTheme);
  }

  const names = candidates.filter((name): name is string => !!name);
  return (
    names.find((name) => kindOfTheme(name) === kind) ??
    names.find((name) => kindOfTheme(name) === undefined)
  );
}

const UI_THEME_KINDS: Record<string, vscode.ColorThemeKind> = {
  vs: vscode.ColorThemeKind.Light,
  "vs-dark": vscode.ColorThemeKind.Dark,
  "hc-black": vscode.ColorThemeKind.HighContrast,
  "hc-light": vscode.ColorThemeKind.HighContrastLight,
};

// Looks up a theme's kind from the extensions that contribute it
function kindOfInstalledTheme(name: string) {
  for (const extension of vscode.extensions.all) {
    const themes = extension.packageJSON?.contributes?.themes;
    if (!Array.isArray(themes)) {
      continue;
    }
    for (const theme of themes) {
      if (theme.id === name || theme.label === name) {
        return UI_THEME_KINDS[theme.uiTheme];
      }
    }
  }
  return undefined;
}

async function updateSettingsBasedOnTheme() {
  // Read configuration fresh each time; a WorkspaceConfiguration is a snapshot
  const configuration = vscode.workspace.getConfiguration();
  const kind = vscode.window.activeColorTheme.kind;

  // Layer from general to specific: dark/light, then high contrast, then theme name
  const settings = {
    ...configuration.get<object>(
      isDarkTheme(kind)
        ? `${SECTION}.darkColorThemeSettings`
        : `${SECTION}.lightColorThemeSettings`
    ),
  };

  if (isHighContrastTheme(kind)) {
    Object.assign(
      settings,
      configuration.get<object>(
        kind === vscode.ColorThemeKind.HighContrast
          ? `${SECTION}.highContrastDarkColorThemeSettings`
          : `${SECTION}.highContrastLightColorThemeSettings`
      )
    );
  }

  const themeSettings =
    configuration.get<Record<string, object>>(`${SECTION}.themeSettings`) ?? {};
  if (Object.keys(themeSettings).length > 0) {
    const name = resolveThemeName(kind, configuration, kindOfInstalledTheme);
    if (name && themeSettings[name]) {
      Object.assign(settings, themeSettings[name]);
    }
  }

  await applySettings(settings, configuration);
}

async function applySettings(
  settings: object,
  configuration: vscode.WorkspaceConfiguration
) {
  for (const [key, value] of Object.entries(settings)) {
    // Skip no-op writes so settings.json (and Settings Sync) isn't touched
    // needlessly, e.g. when several windows activate at once
    const current = configuration.inspect(key)?.globalValue;
    if (JSON.stringify(current) === JSON.stringify(value)) {
      continue;
    }

    try {
      await configuration.update(key, value, vscode.ConfigurationTarget.Global);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showWarningMessage(
        `Settings on Theme Switch: could not update "${key}": ${message}`
      );
    }
  }
}

export function deactivate() {}
