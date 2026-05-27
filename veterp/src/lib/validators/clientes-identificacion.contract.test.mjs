import assert from "node:assert/strict";
import test from "node:test";

import { clienteSchema } from "./clientes.ts";

test("valida identificacion y direccion opcionales de cliente", () => {
  const parsed = clienteSchema.parse({
    nombre: "Ana Perez",
    telefono: " 999111222 ",
    email: "ana@example.com",
    tipo_documento_text: "dni",
    numero_documento_text: " 12345678 ",
    direccion_principal_text: "  Av. Principal 123 ",
    referencia_direccion_text: "  Frente al parque ",
  });

  assert.equal(parsed.tipo_documento_text, "dni");
  assert.equal(parsed.numero_documento_text, "12345678");
  assert.equal(parsed.direccion_principal_text, "Av. Principal 123");
  assert.equal(parsed.referencia_direccion_text, "Frente al parque");

  const sinDocumento = clienteSchema.parse({
    nombre: "Cliente Beta",
    tipo_documento_text: "",
    numero_documento_text: "",
  });

  assert.equal(sinDocumento.tipo_documento_text, undefined);
  assert.equal(sinDocumento.numero_documento_text, undefined);

  assert.throws(
    () =>
      clienteSchema.parse({
        nombre: "Cliente con numero",
        numero_documento_text: "12345678",
      }),
    /tipo de documento/i,
  );

  assert.throws(
    () =>
      clienteSchema.parse({
        nombre: "Cliente con tipo",
        tipo_documento_text: "dni",
      }),
    /numero de documento/i,
  );
});
