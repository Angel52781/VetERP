import assert from "node:assert/strict";
import test from "node:test";

import { getCitaAreaPresentation } from "./types.ts";

test("expone metadata visual consistente para areas de cita", () => {
  const movilidad = getCitaAreaPresentation("movilidad");
  assert.equal(movilidad.label, "Movilidad");
  assert.match(movilidad.badgeClass, /amber/);
  assert.match(movilidad.panelClass, /amber/);

  const unknown = getCitaAreaPresentation("area-invalida");
  assert.equal(unknown.shortLabel, "Clínica");
});
