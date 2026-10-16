import * as assert from "assert";
import * as vscode from "vscode";

const EXTENSION_ID = "wheredoesyourmindgo.vscode-settings-on-theme-switch";
const DARK_THEME = "Default Dark Modern";
const LIGHT_THEME = "Default Light Modern";

function config() {
  return vscode.workspace.getConfiguration();
}

function setGlobal(key: string, value: unknown) {
  return config().update(key, value, vscode.ConfigurationTarget.Global);
}

// Theme changes and the extension's setting writes are async; poll until settled
async function waitFor(check: () => boolean, timeoutMs = 5000) {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("Timed out waiting for condition");
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

function fontSize() {
  return config().get<number>("editor.fontSize");
}

async function setTheme(theme: string, kind: vscode.ColorThemeKind) {
  await setGlobal("workbench.colorTheme", theme);
  await waitFor(() => vscode.window.activeColorTheme.kind === kind);
}

suite("Settings on Theme Switch", () => {
  suiteSetup(async () => {
    await vscode.extensions.getExtension(EXTENSION_ID)!.activate();
  });

  teardown(async () => {
    await setGlobal("settingsOnThemeSwitch.darkColorThemeSettings", undefined);
    await setGlobal("settingsOnThemeSwitch.lightColorThemeSettings", undefined);
    await setGlobal("editor.fontSize", undefined);
    await setGlobal("workbench.colorTheme", undefined);
  });

  test("applies dark and light settings when the theme changes", async () => {
    await setGlobal("settingsOnThemeSwitch.darkColorThemeSettings", {
      "editor.fontSize": 17,
    });
    await setGlobal("settingsOnThemeSwitch.lightColorThemeSettings", {
      "editor.fontSize": 19,
    });

    await setTheme(DARK_THEME, vscode.ColorThemeKind.Dark);
    await waitFor(() => fontSize() === 17);

    await setTheme(LIGHT_THEME, vscode.ColorThemeKind.Light);
    await waitFor(() => fontSize() === 19);
  });

  test("applies settings as soon as they are edited", async () => {
    await setTheme(DARK_THEME, vscode.ColorThemeKind.Dark);

    await setGlobal("settingsOnThemeSwitch.darkColorThemeSettings", {
      "editor.fontSize": 21,
    });
    await waitFor(() => fontSize() === 21);
  });

  test("leaves settings alone when they already have the target value", async () => {
    await setTheme(DARK_THEME, vscode.ColorThemeKind.Dark);
    await setGlobal("editor.fontSize", 23);

    let fontSizeWrites = 0;
    const listener = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("editor.fontSize")) {
        fontSizeWrites++;
      }
    });
    try {
      await setGlobal("settingsOnThemeSwitch.darkColorThemeSettings", {
        "editor.fontSize": 23,
      });
      // Give the extension time to (not) write
      await new Promise((resolve) => setTimeout(resolve, 500));
      assert.strictEqual(fontSizeWrites, 0);
    } finally {
      listener.dispose();
    }
  });

  test("treats high-contrast dark themes as dark", async () => {
    await setGlobal("settingsOnThemeSwitch.darkColorThemeSettings", {
      "editor.fontSize": 25,
    });
    await setTheme("Default High Contrast", vscode.ColorThemeKind.HighContrast);
    await waitFor(() => fontSize() === 25);
  });
});
