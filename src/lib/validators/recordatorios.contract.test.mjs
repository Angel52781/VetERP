import { describe, it } from "node:test";
import assert from "node:assert";
import {
  recordatorioSchema,
  getSeguimientoTipoLabel,
  getSeguimientoEstadoLabel,
  getRecurrenciaLabel,
  formatRecurrencia,
  calculateNextRecurrenceDate,
} from "./recordatorios.ts";

describe("recordatorioSchema contract test", () => {
  it("valida recurrencia valida", () => {
    const valid = recordatorioSchema.safeParse({
      mascota_id: "123e4567-e89b-12d3-a456-426614174000",
      tipo_text: "vacuna",
      nombre_text: "Rabia",
      fecha_aplicacion_date: "2026-06-04",
      proxima_fecha_date: "2027-06-04",
      recurrencia_unidad_text: "anios",
      recurrencia_cada_int: 1,
    });
    assert.strictEqual(valid.success, true);
  });

  it("invalida recurrencia incompleta (solo cantidad)", () => {
    const invalid = recordatorioSchema.safeParse({
      mascota_id: "123e4567-e89b-12d3-a456-426614174000",
      tipo_text: "vacuna",
      nombre_text: "Rabia",
      fecha_aplicacion_date: "2026-06-04",
      recurrencia_cada_int: 1,
    });
    assert.strictEqual(invalid.success, false);
    if (!invalid.success) {
      assert.strictEqual(invalid.error.issues[0].path[0], "recurrencia_unidad_text");
    }
  });

  it("invalida recurrencia incompleta (solo unidad)", () => {
    const invalid = recordatorioSchema.safeParse({
      mascota_id: "123e4567-e89b-12d3-a456-426614174000",
      tipo_text: "vacuna",
      nombre_text: "Rabia",
      fecha_aplicacion_date: "2026-06-04",
      recurrencia_unidad_text: "meses",
    });
    assert.strictEqual(invalid.success, false);
    if (!invalid.success) {
      assert.strictEqual(invalid.error.issues[0].path[0], "recurrencia_cada_int");
    }
  });

  it("invalida cantidad de recurrencia en 0", () => {
    const invalid = recordatorioSchema.safeParse({
      mascota_id: "123e4567-e89b-12d3-a456-426614174000",
      tipo_text: "vacuna",
      nombre_text: "Rabia",
      fecha_aplicacion_date: "2026-06-04",
      recurrencia_unidad_text: "meses",
      recurrencia_cada_int: 0,
    });
    assert.strictEqual(invalid.success, false);
  });

  it("permite proxima_fecha_date vacia", () => {
    const valid = recordatorioSchema.safeParse({
      mascota_id: "123e4567-e89b-12d3-a456-426614174000",
      tipo_text: "vacuna",
      nombre_text: "Rabia",
      fecha_aplicacion_date: "2026-06-04",
      proxima_fecha_date: "",
    });
    assert.strictEqual(valid.success, true);
    if (valid.success) {
      assert.strictEqual(valid.data.proxima_fecha_date, null);
    }
  });

  it("unidad anios valida pero label helper devuelve Años", () => {
    const valid = recordatorioSchema.safeParse({
      mascota_id: "123e4567-e89b-12d3-a456-426614174000",
      tipo_text: "vacuna",
      nombre_text: "Rabia",
      fecha_aplicacion_date: "2026-06-04",
      recurrencia_unidad_text: "anios",
      recurrencia_cada_int: 1,
    });
    assert.strictEqual(valid.success, true);
    assert.strictEqual(getRecurrenciaLabel("anios"), "Años");
  });

  it("formatea labels visibles sin exponer valores internos", () => {
    assert.strictEqual(getSeguimientoTipoLabel("vacuna"), "Vacuna");
    assert.strictEqual(getSeguimientoTipoLabel("control"), "Control / Refuerzo");
    assert.strictEqual(getSeguimientoTipoLabel("laboratorio"), "Laboratorio");
    assert.strictEqual(getSeguimientoTipoLabel("medicacion"), "Medicación");
    assert.strictEqual(getSeguimientoTipoLabel("otro"), "Otro");
    assert.strictEqual(getSeguimientoTipoLabel("muestra_pendiente"), "Muestra pendiente");
    assert.strictEqual(getSeguimientoEstadoLabel("pendiente"), "Pendiente");
    assert.strictEqual(getSeguimientoEstadoLabel("resuelto"), "Resuelto");
    assert.strictEqual(getSeguimientoEstadoLabel("cancelado"), "Cancelado");
    assert.strictEqual(getRecurrenciaLabel(null), "Sin repetición");
    assert.strictEqual(getRecurrenciaLabel(undefined), "Sin repetición");
  });

  it("permite recurrencia vacia con null o undefined", () => {
    const emptyWithNull = recordatorioSchema.safeParse({
      mascota_id: "123e4567-e89b-12d3-a456-426614174000",
      tipo_text: "vacuna",
      nombre_text: "Rabia",
      fecha_aplicacion_date: "2026-06-04",
      recurrencia_unidad_text: null,
      recurrencia_cada_int: null,
    });
    assert.strictEqual(emptyWithNull.success, true);

    const emptyWithUndefined = recordatorioSchema.safeParse({
      mascota_id: "123e4567-e89b-12d3-a456-426614174000",
      tipo_text: "vacuna",
      nombre_text: "Rabia",
      fecha_aplicacion_date: "2026-06-04",
    });
    assert.strictEqual(emptyWithUndefined.success, true);
  });

  it("invalida unidad 'none' enviada al backend", () => {
    const invalid = recordatorioSchema.safeParse({
      mascota_id: "123e4567-e89b-12d3-a456-426614174000",
      tipo_text: "vacuna",
      nombre_text: "Rabia",
      fecha_aplicacion_date: "2026-06-04",
      recurrencia_unidad_text: "none",
      recurrencia_cada_int: 1,
    });
    assert.strictEqual(invalid.success, false);
  });

  it("formatRecurrencia funciona con singular y plural", () => {
    assert.strictEqual(formatRecurrencia(1, "meses"), "Cada 1 mes");
    assert.strictEqual(formatRecurrencia(2, "meses"), "Cada 2 meses");
    assert.strictEqual(formatRecurrencia(1, "anios"), "Cada 1 año");
    assert.strictEqual(formatRecurrencia(2, "anios"), "Cada 2 años");
    
    // Null/undefined no rompe
    assert.strictEqual(formatRecurrencia(null, "meses"), null);
    assert.strictEqual(formatRecurrencia(1, null), null);
    assert.strictEqual(formatRecurrencia(undefined, undefined), null);
    assert.strictEqual(formatRecurrencia(1, "none"), null);
  });

  it("calcula la siguiente fecha recurrente", () => {
    assert.strictEqual(calculateNextRecurrenceDate("2026-06-04", 1, "dias"), "2026-06-05");
    assert.strictEqual(calculateNextRecurrenceDate("2026-06-04", 1, "semanas"), "2026-06-11");
    assert.strictEqual(calculateNextRecurrenceDate("2026-06-04", 1, "meses"), "2026-07-04");
    assert.strictEqual(calculateNextRecurrenceDate("2026-06-04", 1, "anios"), "2027-06-04");
  });
});
