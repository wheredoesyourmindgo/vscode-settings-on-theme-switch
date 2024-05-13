import * as vscode from "vscode";

export function activate(_context: vscode.ExtensionContext) {
  const configuration = vscode.workspace.getConfiguration();

  // Listen for theme changes and update settings accordingly
  vscode.window.onDidChangeActiveColorTheme((_event) => {
      updateSettingsBasedOnTheme(configuration);
  });

  // Initial settings update
  updateSettingsBasedOnTheme(configuration);
}

function updateSettingsBasedOnTheme(
  configuration: vscode.WorkspaceConfiguration
) {
  const themeKind = vscode.window.activeColorTheme.kind;

  const darkThemeSettings = configuration.get<object>(
    "settingsOnThemeSwitch.darkColorThemeSettings"
  );
  const lightThemeSettings = configuration.get<object>(
    "settingsOnThemeSwitch.lightColorThemeSettings"
  );

  if (themeKind === vscode.ColorThemeKind.Dark) {
    applySettings(darkThemeSettings, configuration);
  } else {
    applySettings(lightThemeSettings, configuration);
  }
}

function applySettings(
  settings: object | undefined,
  configuration: vscode.WorkspaceConfiguration
) {
  if (settings) {
    for (const [key, value] of Object.entries(settings)) {
      configuration.update(key, value, vscode.ConfigurationTarget.Global);
    }
  }
}

export function deactivate() {}
