import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import ts from "typescript";

const source = await readFile(new URL("../appearance.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});

const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
const appearance = await import(moduleUrl);

test("allows the expected appearance presets", () => {
  assert.deepEqual([...appearance.themePresetValues], [
    "default",
    "blue",
    "green",
    "purple",
    "warm",
    "high_contrast",
  ]);
});

test("normalizes valid HEX colors to uppercase #RRGGBB", () => {
  assert.equal(appearance.normalizeBrandColor(" #3b82f6 "), "#3B82F6");
  assert.equal(appearance.normalizeBrandColor("#ABCDEF"), "#ABCDEF");
});

test("rejects invalid HEX colors", () => {
  assert.equal(appearance.normalizeBrandColor("3b82f6"), null);
  assert.equal(appearance.normalizeBrandColor("#12345"), null);
  assert.equal(appearance.normalizeBrandColor("#xyzxyz"), null);
});

test("treats empty and null brand colors as unset", () => {
  assert.equal(appearance.normalizeBrandColor(""), null);
  assert.equal(appearance.normalizeBrandColor("   "), null);
  assert.equal(appearance.normalizeBrandColor(null), null);
});

test("chooses a readable primary foreground", () => {
  assert.equal(appearance.getContrastForeground("#111827"), "#FFFFFF");
  assert.equal(appearance.getContrastForeground("#FDE68A"), "#111827");
});

test("builds CSS variables from preset plus optional custom color", () => {
  const style = appearance.buildClinicThemeStyle({
    theme_preset_text: "green",
    brand_color_text: "#2563eb",
  });

  assert.equal(style["--primary"], "#2563EB");
  assert.equal(style["--brand"], "#2563EB");
  assert.equal(style["--sidebar-primary"], "#2563EB");
  assert.equal(style["--primary-foreground"], "#FFFFFF");
});

test("validates a saved custom theme payload", () => {
  const result = appearance.validateSavedThemeInput({
    nombre_text: "Azul recepcion",
    theme_preset_text: "blue",
    brand_color_text: "#2563eb",
    orden_int: 2,
  });

  assert.equal(result.success, true);
  assert.equal(result.data.nombre_text, "Azul recepcion");
  assert.equal(result.data.brand_color_text, "#2563EB");
});

test("rejects empty saved theme names", () => {
  const result = appearance.validateSavedThemeInput({
    nombre_text: "   ",
    theme_preset_text: "blue",
    brand_color_text: "#2563EB",
  });

  assert.equal(result.success, false);
  assert.match(result.error, /nombre/i);
});

test("rejects invalid saved theme HEX colors", () => {
  const result = appearance.validateSavedThemeInput({
    nombre_text: "Tema raro",
    theme_preset_text: "blue",
    brand_color_text: "2563EB",
  });

  assert.equal(result.success, false);
  assert.match(result.error, /#RRGGBB/);
});

test("rejects invalid saved theme presets", () => {
  const result = appearance.validateSavedThemeInput({
    nombre_text: "Tema raro",
    theme_preset_text: "neon",
    brand_color_text: "#2563EB",
  });

  assert.equal(result.success, false);
  assert.match(result.error, /tema/i);
});

test("rejects saved theme names longer than 40 characters", () => {
  const result = appearance.validateSavedThemeInput({
    nombre_text: "x".repeat(41),
    theme_preset_text: "blue",
    brand_color_text: "#2563EB",
  });

  assert.equal(result.success, false);
  assert.match(result.error, /40/);
});
