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

async function updateSettingsBasedOnTheme() {
  // Read configuration fresh each time; a WorkspaceConfiguration is a snapshot
  const configuration = vscode.workspace.getConfiguration();

  const settingsKey = isDarkTheme(vscode.window.activeColorTheme.kind)
    ? `${SECTION}.darkColorThemeSettings`
    : `${SECTION}.lightColorThemeSettings`;

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
