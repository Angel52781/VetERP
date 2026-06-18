import assert from "node:assert/strict";
import test from "node:test";

import { citaSchema, resolveCitaMovilidadFields } from "./agenda.ts";

const citaBase = {
  cliente_id: "11111111-1111-4111-8111-111111111111",
  mascota_id: "22222222-2222-4222-8222-222222222222",
  tipo_cita_id: "33333333-3333-4333-8333-333333333333",
  start_date: "2026-05-27T09:00:00.000Z",
  end_date: "2026-05-27T09:30:00.000Z",
};

test("citaSchema normaliza campos opcionales de movilidad", () => {
  const parsed = citaSchema.parse({
    ...citaBase,
    movilidad_usa_direccion_cliente: true,
    movilidad_direccion_text: "  Av. Principal 123  ",
    movilidad_referencia_text: "  Frente al parque  ",
  });

  assert.equal(parsed.movilidad_usa_direccion_cliente, true);
  assert.equal(parsed.movilidad_direccion_text, "Av. Principal 123");
  assert.equal(parsed.movilidad_referencia_text, "Frente al parque");
});

test("resolveCitaMovilidadFields limpia movilidad cuando el tipo no es movilidad", () => {
  const result = resolveCitaMovilidadFields(
    {
      movilidad_usa_direccion_cliente: true,
      movilidad_direccion_text: "Av. Principal 123",
      movilidad_referencia_text: "Frente al parque",
    },
    {
      isMovilidad: false,
      clienteDireccion: "Av. Cliente 999",
      clienteReferencia: "Referencia cliente",
    },
  );

  assert.equal(result.error, null);
  assert.deepEqual(result.data, {
    movilidad_usa_direccion_cliente: false,
    movilidad_direccion_text: null,
    movilidad_referencia_text: null,
  });
});

test("resolveCitaMovilidadFields exige direccion para movilidad manual", () => {
  const result = resolveCitaMovilidadFields(
    {
      movilidad_usa_direccion_cliente: false,
      movilidad_direccion_text: "",
      movilidad_referencia_text: "",
    },
    {
      isMovilidad: true,
      clienteDireccion: null,
      clienteReferencia: null,
    },
  );

  assert.equal(result.data, null);
  assert.match(result.error ?? "", /direccion de movilidad/i);
});

test("resolveCitaMovilidadFields guarda snapshot desde direccion del cliente", () => {
  const result = resolveCitaMovilidadFields(
    {
      movilidad_usa_direccion_cliente: true,
      movilidad_direccion_text: "Direccion manual ignorada",
      movilidad_referencia_text: "",
    },
    {
      isMovilidad: true,
      clienteDireccion: " Av. Cliente 999 ",
      clienteReferencia: " Referencia cliente ",
    },
  );

  assert.equal(result.error, null);
  assert.deepEqual(result.data, {
    movilidad_usa_direccion_cliente: true,
    movilidad_direccion_text: "Av. Cliente 999",
    movilidad_referencia_text: "Referencia cliente",
  });
});

test("resolveCitaMovilidadFields bloquea direccion de cliente ausente", () => {
  const result = resolveCitaMovilidadFields(
    {
      movilidad_usa_direccion_cliente: true,
      movilidad_direccion_text: "",
      movilidad_referencia_text: "",
    },
    {
      isMovilidad: true,
      clienteDireccion: "",
      clienteReferencia: null,
    },
  );

  assert.equal(result.data, null);
  assert.match(result.error ?? "", /responsable no tiene direccion/i);
});
