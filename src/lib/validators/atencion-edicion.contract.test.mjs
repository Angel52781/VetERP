import assert from "node:assert/strict";
import test from "node:test";

import { editarEntradaClinicaSchema } from "./atencion.ts";

const entradaId = "11111111-1111-4111-8111-111111111111";

test("valida edicion controlada de entrada clinica con motivo obligatorio", () => {
  const parsed = editarEntradaClinicaSchema.parse({
    id: entradaId,
    tipo_text: "  Nota Clinica de Evolucion  ",
    texto_text: "Correccion menor",
    motivo_consulta_text: "Control",
    peso_kg_num: 12.5,
    temperatura_c_num: 38.2,
    frecuencia_cardiaca_num: 100,
    frecuencia_respiratoria_num: 24,
    observaciones_text: "Paciente alerta",
    diagnostico_text: "Gastroenteritis",
    anamnesis_text: "Come menos",
    plan_tratamiento_text: "Control en 48 horas",
    motivo_edicion_text: "  Correccion de signos vitales  ",
  });

  assert.equal(parsed.tipo_text, "Nota Clinica de Evolucion");
  assert.equal(parsed.motivo_edicion_text, "Correccion de signos vitales");
  assert.equal(parsed.peso_kg_num, 12.5);

  assert.throws(
    () =>
      editarEntradaClinicaSchema.parse({
        id: entradaId,
        tipo_text: "Evolucion",
        texto_text: "Texto",
        motivo_edicion_text: "fix",
      }),
    /5 caracteres/,
  );

  assert.throws(
    () =>
      editarEntradaClinicaSchema.parse({
        id: entradaId,
        tipo_text: "Evolucion",
        texto_text: "Texto",
        temperatura_c_num: 70,
        motivo_edicion_text: "Motivo suficiente",
      }),
    /60/,
  );
});
