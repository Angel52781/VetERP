import assert from "node:assert/strict";
import test from "node:test";

import {
  cambiarEstadoTratamientoHospitalizacionSchema,
  createTratamientoHospitalizacionSchema,
  tratamientoEstadoValues,
  updateTratamientoHospitalizacionSchema,
} from "./hospitalizaciones.ts";

const uuidA = "11111111-1111-4111-8111-111111111111";
const uuidB = "22222222-2222-4222-8222-222222222222";
const uuidC = "33333333-3333-4333-8333-333333333333";

const baseTratamiento = {
  hospitalizacion_id: uuidA,
  mascota_id: uuidB,
  nombre_text: "  Fluidoterapia  ",
  dosis_text: "20 ml/kg",
  via_text: "IV",
  frecuencia_text: "Cada 8 horas",
  indicaciones_text: "Controlar hidratacion y respuesta clinica.",
  responsable_text: "Dra. Rivera",
  notas_text: "Paciente sensible al manejo.",
  orden_num: 3,
};

test("valida payload operativo de tratamientos de hospitalizacion", () => {
  assert.deepEqual(tratamientoEstadoValues, ["activo", "terminado", "suspendido"]);

  const parsed = createTratamientoHospitalizacionSchema.parse(baseTratamiento);

  assert.equal(parsed.nombre_text, "Fluidoterapia");
  assert.equal(parsed.dosis_text, "20 ml/kg");
  assert.equal(parsed.orden_num, 3);

  assert.throws(
    () => createTratamientoHospitalizacionSchema.parse({ ...baseTratamiento, nombre_text: "A" }),
    /2 caracteres/,
  );
  assert.throws(
    () => createTratamientoHospitalizacionSchema.parse({ ...baseTratamiento, orden_num: 1000 }),
    /999/,
  );
});

test("valida edicion y cambio de estado de tratamiento", () => {
  const edited = updateTratamientoHospitalizacionSchema.parse({
    id: uuidC,
    ...baseTratamiento,
    nombre_text: "Antibiotico",
    orden_num: 0,
  });

  assert.equal(edited.id, uuidC);
  assert.equal(edited.nombre_text, "Antibiotico");

  const cambioEstado = cambiarEstadoTratamientoHospitalizacionSchema.parse({
    id: uuidC,
    hospitalizacion_id: uuidA,
    mascota_id: uuidB,
    notas_text: "Se suspende por indicacion medica.",
  });

  assert.equal(cambioEstado.id, uuidC);
  assert.equal(cambioEstado.notas_text, "Se suspende por indicacion medica.");
  assert.throws(
    () =>
      cambiarEstadoTratamientoHospitalizacionSchema.parse({
        id: uuidC,
        hospitalizacion_id: uuidA,
        mascota_id: uuidB,
        notas_text: "x".repeat(1001),
      }),
    /1000/,
  );
});
