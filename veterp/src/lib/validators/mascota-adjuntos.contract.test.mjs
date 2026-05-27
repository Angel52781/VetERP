import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_MASCOTA_ADJUNTO_BYTES,
  MASCOTA_ADJUNTO_MIME_TYPES,
  subirAdjuntoMascotaSchema,
  tipoAdjuntoMascotaValues,
} from "./adjuntos.ts";

const mascotaId = "11111111-1111-4111-8111-111111111111";

test("valida payload de adjuntos clinicos de paciente", () => {
  assert.deepEqual(tipoAdjuntoMascotaValues, ["examen", "foto", "receta", "documento", "otro"]);
  assert.equal(MAX_MASCOTA_ADJUNTO_BYTES, 10 * 1024 * 1024);
  assert.ok(MASCOTA_ADJUNTO_MIME_TYPES.includes("application/pdf"));

  const parsed = subirAdjuntoMascotaSchema.parse({
    mascota_id: mascotaId,
    tipo_text: "examen",
    notas_text: "  Hemograma de control  ",
    file: new File(["resultado"], "hemograma.pdf", { type: "application/pdf" }),
  });

  assert.equal(parsed.mascota_id, mascotaId);
  assert.equal(parsed.tipo_text, "examen");
  assert.equal(parsed.notas_text, "Hemograma de control");

  assert.throws(
    () =>
      subirAdjuntoMascotaSchema.parse({
        mascota_id: mascotaId,
        tipo_text: "foto",
        file: new File(["contenido"], "documento.txt", { type: "text/plain" }),
      }),
    /PDF, JPG, PNG o WEBP/,
  );

  const tooLargeFile = new File([new Uint8Array(MAX_MASCOTA_ADJUNTO_BYTES + 1)], "foto.png", {
    type: "image/png",
  });

  assert.throws(
    () =>
      subirAdjuntoMascotaSchema.parse({
        mascota_id: mascotaId,
        tipo_text: "foto",
        file: tooLargeFile,
      }),
    /10MB/,
  );
});
