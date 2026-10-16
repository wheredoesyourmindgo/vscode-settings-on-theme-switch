import * as assert from "assert";
import * as vscode from "vscode";
import { resolveThemeName } from "../extension";

const EXTENSION_ID = "wheredoesyourmindgo.vscode-settings-on-theme-switch";
const DARK_THEME = "Default Dark Modern";
const LIGHT_THEME = "Default Light Modern";
const OTHER_DARK_THEME = "Default Dark+";

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

function cursorWidth() {
  return config().get<number>("editor.cursorWidth");
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
    for (const key of [
      "darkColorThemeSettings",
      "lightColorThemeSettings",
      "highContrastDarkColorThemeSettings",
      "highContrastLightColorThemeSettings",
      "themeSettings",
    ]) {
      await setGlobal(`settingsOnThemeSwitch.${key}`, undefined);
    }
    await setGlobal("editor.fontSize", undefined);
    await setGlobal("editor.cursorWidth", undefined);
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

  test("layers high-contrast settings over dark and light", async () => {
    await setGlobal("settingsOnThemeSwitch.darkColorThemeSettings", {
      "editor.fontSize": 15,
      "editor.cursorWidth": 2,
    });
    await setGlobal("settingsOnThemeSwitch.lightColorThemeSettings", {
      "editor.fontSize": 16,
    });
    await setGlobal("settingsOnThemeSwitch.highContrastDarkColorThemeSettings", {
      "editor.cursorWidth": 4,
    });
    await setGlobal("settingsOnThemeSwitch.highContrastLightColorThemeSettings", {
      "editor.fontSize": 18,
    });

    await setTheme("Default High Contrast", vscode.ColorThemeKind.HighContrast);
    await waitFor(() => fontSize() === 15 && cursorWidth() === 4);

    await setTheme(
      "Default High Contrast Light",
      vscode.ColorThemeKind.HighContrastLight
    );
    await waitFor(() => fontSize() === 18);
  });

  test("layers theme-name settings over everything else", async () => {
    await setGlobal("settingsOnThemeSwitch.darkColorThemeSettings", {
      "editor.fontSize": 15,
      "editor.cursorWidth": 2,
    });
    await setGlobal("settingsOnThemeSwitch.themeSettings", {
      [OTHER_DARK_THEME]: { "editor.fontSize": 27 },
    });

    await setTheme(DARK_THEME, vscode.ColorThemeKind.Dark);
    await waitFor(() => fontSize() === 15 && cursorWidth() === 2);

    // Same kind, different theme: only the name-specific setting changes
    await setGlobal("workbench.colorTheme", OTHER_DARK_THEME);
    await waitFor(() => fontSize() === 27 && cursorWidth() === 2);
  });
});

suite("resolveThemeName", () => {
  const { Dark, Light, HighContrast } = vscode.ColorThemeKind;
  const kinds: Record<string, vscode.ColorThemeKind> = {
    "My Dark": Dark,
    "My Light": Light,
    "My HC": HighContrast,
  };
  const kindOf = (name: string) => kinds[name];
  const reader = (values: Record<string, unknown>) => ({
    get: <T>(key: string) => values[key] as T | undefined,
  });

  test("uses workbench.colorTheme normally", () => {
    const settings = reader({ "workbench.colorTheme": "My Dark" });
    assert.strictEqual(resolveThemeName(Dark, settings, kindOf), "My Dark");
  });

  test("uses the preferred theme when following the OS", () => {
    const settings = reader({
      "window.autoDetectColorScheme": true,
      "workbench.colorTheme": "Ignored",
      "workbench.preferredDarkColorTheme": "My Dark",
      "workbench.preferredLightColorTheme": "My Light",
    });
    assert.strictEqual(resolveThemeName(Light, settings, kindOf), "My Light");
    assert.strictEqual(resolveThemeName(Dark, settings, kindOf), "My Dark");
  });

  test("uses the OS high-contrast theme when the chosen theme isn't one", () => {
    const settings = reader({
      "window.autoDetectHighContrast": true,
      "workbench.colorTheme": "My Dark",
      "workbench.preferredHighContrastColorTheme": "My HC",
    });
    assert.strictEqual(resolveThemeName(HighContrast, settings, kindOf), "My HC");
  });

  test("prefers a high-contrast theme picked by hand", () => {
    const settings = reader({
      "window.autoDetectHighContrast": true,
      "workbench.colorTheme": "Other HC",
      "workbench.preferredHighContrastColorTheme": "My HC",
    });
    const kindOfWithOther = (name: string) =>
      name === "Other HC" ? HighContrast : kindOf(name);
    assert.strictEqual(
      resolveThemeName(HighContrast, settings, kindOfWithOther),
      "Other HC"
    );
  });

  test("returns undefined when no candidate matches", () => {
    const settings = reader({ "workbench.colorTheme": "My Light" });
    assert.strictEqual(resolveThemeName(Dark, settings, kindOf), undefined);
  });
});
