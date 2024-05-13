import * as vscode from "vscode";

export function activate(_context: vscode.ExtensionContext) {
  const configuration = vscode.workspace.getConfiguration();

  // Listen for theme changes and update settings accordingly
  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("workbench.colorTheme")) {
      updateSettingsBasedOnTheme(configuration);
    }
  });

  // Initial settings update
  updateSettingsBasedOnTheme(configuration);
}

function updateSettingsBasedOnTheme(
  configuration: vscode.WorkspaceConfiguration
) {
  const currentTheme = configuration.get<string>("workbench.colorTheme");
  const darkThemeSettings = configuration.get<object>(
    "settingsOnThemeSwitch.preferredDarkColorThemeSettings"
  );
  const lightThemeSettings = configuration.get<object>(
    "settingsOnThemeSwitch.preferredLightColorThemeSettings"
  );

  if (currentTheme?.toLowerCase().includes("dark")) {
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
