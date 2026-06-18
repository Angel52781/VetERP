import assert from "node:assert/strict";
import test from "node:test";

import { filterClienteSearchResults } from "./cita-search.ts";

const clientes = [
  {
    id: "cliente-1",
    nombre: "María García",
    telefono: "999-111-222",
    email: "maria@example.com",
    tipo_documento_text: "dni",
    numero_documento_text: "12345678",
    mascotas: [
      { id: "mascota-1", nombre: "Luna", codigo_text: "PAC-042" },
      { id: "mascota-2", nombre: "Rocky", codigo_text: null },
    ],
  },
  {
    id: "cliente-2",
    nombre: "Carlos Pérez",
    telefono: "555-0101",
    email: "carlos@example.com",
    mascotas: [{ id: "mascota-3", nombre: "Milo", codigo_text: "GAT-777" }],
  },
];

test("filtra responsables por nombre, telefono, email, documento, paciente y codigo", () => {
  assert.deepEqual(filterClienteSearchResults(clientes, "garcia").map((result) => result.cliente.id), ["cliente-1"]);
  assert.deepEqual(filterClienteSearchResults(clientes, "999111").map((result) => result.cliente.id), ["cliente-1"]);
  assert.deepEqual(filterClienteSearchResults(clientes, "carlos@example").map((result) => result.cliente.id), ["cliente-2"]);
  assert.deepEqual(filterClienteSearchResults(clientes, "12345678").map((result) => result.cliente.id), ["cliente-1"]);

  const porPaciente = filterClienteSearchResults(clientes, "luna");
  assert.equal(porPaciente[0]?.cliente.id, "cliente-1");
  assert.deepEqual(porPaciente[0]?.matchingMascotas.map((mascota) => mascota.id), ["mascota-1"]);

  const porCodigo = filterClienteSearchResults(clientes, "pac042");
  assert.equal(porCodigo[0]?.cliente.id, "cliente-1");
  assert.deepEqual(porCodigo[0]?.matchingMascotas.map((mascota) => mascota.id), ["mascota-1"]);
});
