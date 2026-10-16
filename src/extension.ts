import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  // Listen for theme changes and update settings accordingly
  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme(() => {
      updateSettingsBasedOnTheme();
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

async function updateSettingsBasedOnTheme() {
  // Read configuration fresh each time; a WorkspaceConfiguration is a snapshot
  const configuration = vscode.workspace.getConfiguration();

  const settingsKey = isDarkTheme(vscode.window.activeColorTheme.kind)
    ? "settingsOnThemeSwitch.darkColorThemeSettings"
    : "settingsOnThemeSwitch.lightColorThemeSettings";

  await applySettings(configuration.get<object>(settingsKey), configuration);
}

async function applySettings(
  settings: object | undefined,
  configuration: vscode.WorkspaceConfiguration
) {
  if (!settings) {
    return;
  }

  for (const [key, value] of Object.entries(settings)) {
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
