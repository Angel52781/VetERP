"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies, requireUserRole } from "@/lib/clinica";
import {
  adjuntoSchema,
  editarEntradaClinicaSchema,
  entradaClinicaSchema,
  type AdjuntoInput,
  type EditarEntradaClinicaInput,
  type EntradaClinicaInput,
} from "@/lib/validators/atencion";
import { v4 as uuidv4 } from "uuid";

async function ensureOrdenInClinica(supabase: any, clinicaId: string, ordenId: string) {
  const { data: orden } = await supabase
    .from("ordenes_servicio")
    .select("id, mascota_id")
    .eq("id", ordenId)
    .eq("clinica_id", clinicaId)
    .maybeSingle();

  return orden;
}

type EntradaClinicaAuditRow = {
  id: string;
  orden_id: string;
  tipo_text: string | null;
  texto_text: string | null;
  motivo_consulta_text: string | null;
  peso_kg_num: number | string | null;
  temperatura_c_num: number | string | null;
  frecuencia_cardiaca_num: number | null;
  frecuencia_respiratoria_num: number | null;
  observaciones_text: string | null;
  diagnostico_text: string | null;
  anamnesis_text: string | null;
  plan_tratamiento_text: string | null;
  editado_at?: string | null;
  editado_por?: string | null;
  ediciones_count?: number | null;
};

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildEntradaAuditData(row: EntradaClinicaAuditRow) {
  return {
    tipo_text: row.tipo_text ?? null,
    texto_text: row.texto_text ?? null,
    motivo_consulta_text: row.motivo_consulta_text ?? null,
    peso_kg_num: row.peso_kg_num ?? null,
    temperatura_c_num: row.temperatura_c_num ?? null,
    frecuencia_cardiaca_num: row.frecuencia_cardiaca_num ?? null,
    frecuencia_respiratoria_num: row.frecuencia_respiratoria_num ?? null,
    observaciones_text: row.observaciones_text ?? null,
    diagnostico_text: row.diagnostico_text ?? null,
    anamnesis_text: row.anamnesis_text ?? null,
    plan_tratamiento_text: row.plan_tratamiento_text ?? null,
  };
}

async function getCurrentUserId(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function getOrdenCompleta(id: string) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ordenes_servicio")
      .select(`
        *,
        clientes:cliente_id (
          id,
          nombre,
          telefono,
          email
        ),
        mascotas:mascota_id (
          id,
          nombre,
          codigo_text,
          especie,
          raza,
          nacimiento,
          alertas_criticas,
          notas_manejo
        ),
        entradas_clinicas (
          id,
          tipo_text,
          texto_text,
          motivo_consulta_text,
          peso_kg_num,
          temperatura_c_num,
          frecuencia_cardiaca_num,
          frecuencia_respiratoria_num,
          observaciones_text,
          diagnostico_text,
          anamnesis_text,
          plan_tratamiento_text,
          editado_at,
          editado_por,
          ediciones_count,
          fecha_date,
          created_at,
          entradas_clinicas_ediciones (
            id,
            entrada_clinica_id,
            editado_por,
            motivo_text,
            before_data,
            after_data,
            created_at
          )
        ),
        adjuntos (
          id,
          archivo_url,
          descripcion_text,
          fecha_date,
          created_at
        )
      `)
      .eq("id", id)
      .eq("clinica_id", clinicaId)
      .single();

    if (error) {
      console.error("Error fetching orden completa:", error);
      return { error: error.message, data: null };
    }

    // Replace stored filePath with a fresh Signed URL valid for 1 hour
    if (data.adjuntos && data.adjuntos.length > 0) {
      for (const adjunto of data.adjuntos) {
        // En la BD guardaremos solo el path del archivo, ej: "clinica_id/orden_id/uuid.ext"
        // Si por alguna razón el archivo ya es una URL pública/antigua, la extraemos
        let filePath = adjunto.archivo_url;
        if (filePath.startsWith("http")) {
          // Fallback para URLs antiguas: intentamos extraer la ruta "clinicaId/ordenId/archivo.ext"
          const parts = filePath.split("adjuntos/");
          if (parts.length > 1) {
            filePath = parts[1].split("?")[0]; // removemos los query params del signed url
          }
        }

        const { data: signedUrlData, error: signError } = await supabase.storage
          .from("adjuntos")
          .createSignedUrl(filePath, 3600);

        if (!signError && signedUrlData) {
          adjunto.archivo_url = signedUrlData.signedUrl;
        }
      }
    }

    return { error: null, data };
  } catch (error: any) {
    console.error("Exception in getOrdenCompleta:", error);
    return { error: error.message || "Error al obtener la orden completa", data: null };
  }
}

export async function createEntradaClinica(input: EntradaClinicaInput) {
  try {
    const clinicaId = await requireClinicaIdFromCookies();
    const validatedData = entradaClinicaSchema.parse(input);
    const supabase = await createClient();
    const userId = await getCurrentUserId(supabase);
    const orden = await ensureOrdenInClinica(supabase, clinicaId, validatedData.orden_id);
    if (!orden) {
      return { error: "La orden no pertenece a la clínica activa.", data: null };
    }

    if (validatedData.tipo_text === "Nota Clínica de Evolución") {
      const { data: existingRows } = await supabase
        .from("entradas_clinicas")
        .select("id")
        .eq("orden_id", validatedData.orden_id)
        .eq("clinica_id", clinicaId)
        .in("tipo_text", ["Nota Clínica de Evolución", "Signos Vitales y Triaje"])
        .order("created_at", { ascending: false })
        .limit(1);

      const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

      if (existing) {
        return {
          error:
            "La entrada SOAP ya existe. Para corregirla usa Editar entrada y registra el motivo de edicion.",
          data: existing,
        };
      }
    }

    const { data, error } = await supabase
      .from("entradas_clinicas")
      .insert({
        clinica_id: clinicaId,
        orden_id: validatedData.orden_id,
        tipo_text: validatedData.tipo_text,
        texto_text: validatedData.texto_text,
        motivo_consulta_text: validatedData.motivo_consulta_text,
        peso_kg_num: validatedData.peso_kg_num,
        temperatura_c_num: validatedData.temperatura_c_num,
        frecuencia_cardiaca_num: validatedData.frecuencia_cardiaca_num,
        frecuencia_respiratoria_num: validatedData.frecuencia_respiratoria_num,
        observaciones_text: validatedData.observaciones_text,
        diagnostico_text: validatedData.diagnostico_text,
        anamnesis_text: validatedData.anamnesis_text,
        plan_tratamiento_text: validatedData.plan_tratamiento_text,
        autor_user_id: userId,
        fecha_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating entrada clinica:", error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error: any) {
    console.error("Exception in createEntradaClinica:", error);
    return { error: error.message || "Error al crear la entrada clínica", data: null };
  }
}

export async function updateEntradaClinicaConAuditoria(input: EditarEntradaClinicaInput) {
  try {
    const { clinicaId } = await requireUserRole(["owner", "admin"]);
    const validatedData = editarEntradaClinicaSchema.parse(input);
    const supabase = await createClient();
    const userId = await getCurrentUserId(supabase);

    if (!userId) {
      return { error: "No se pudo identificar al usuario que edita la entrada.", data: null };
    }

    const { data: entradaActual, error: entradaError } = await supabase
      .from("entradas_clinicas")
      .select(`
        id,
        orden_id,
        tipo_text,
        texto_text,
        motivo_consulta_text,
        peso_kg_num,
        temperatura_c_num,
        frecuencia_cardiaca_num,
        frecuencia_respiratoria_num,
        observaciones_text,
        diagnostico_text,
        anamnesis_text,
        plan_tratamiento_text,
        editado_at,
        editado_por,
        ediciones_count
      `)
      .eq("id", validatedData.id)
      .eq("clinica_id", clinicaId)
      .maybeSingle();

    if (entradaError) {
      return { error: entradaError.message, data: null };
    }
    if (!entradaActual) {
      return { error: "Entrada clinica no encontrada para la clinica activa.", data: null };
    }

    const orden = await ensureOrdenInClinica(supabase, clinicaId, entradaActual.orden_id);
    if (!orden) {
      return { error: "La orden de la entrada no pertenece a la clinica activa.", data: null };
    }

    const beforeData = buildEntradaAuditData(entradaActual as EntradaClinicaAuditRow);
    const now = new Date().toISOString();
    const updatePayload = {
      tipo_text: validatedData.tipo_text,
      texto_text: cleanText(validatedData.texto_text) ?? "",
      motivo_consulta_text: cleanText(validatedData.motivo_consulta_text),
      peso_kg_num: validatedData.peso_kg_num ?? null,
      temperatura_c_num: validatedData.temperatura_c_num ?? null,
      frecuencia_cardiaca_num: validatedData.frecuencia_cardiaca_num ?? null,
      frecuencia_respiratoria_num: validatedData.frecuencia_respiratoria_num ?? null,
      observaciones_text: cleanText(validatedData.observaciones_text),
      diagnostico_text: cleanText(validatedData.diagnostico_text),
      anamnesis_text: cleanText(validatedData.anamnesis_text),
      plan_tratamiento_text: cleanText(validatedData.plan_tratamiento_text),
      editado_at: now,
      editado_por: userId,
      ediciones_count: Number(entradaActual.ediciones_count ?? 0) + 1,
    };

    const { data: entradaActualizada, error: updateError } = await supabase
      .from("entradas_clinicas")
      .update(updatePayload)
      .eq("id", validatedData.id)
      .eq("clinica_id", clinicaId)
      .select(`
        id,
        orden_id,
        tipo_text,
        texto_text,
        motivo_consulta_text,
        peso_kg_num,
        temperatura_c_num,
        frecuencia_cardiaca_num,
        frecuencia_respiratoria_num,
        observaciones_text,
        diagnostico_text,
        anamnesis_text,
        plan_tratamiento_text,
        editado_at,
        editado_por,
        ediciones_count
      `)
      .maybeSingle();

    if (updateError) {
      return { error: updateError.message, data: null };
    }
    if (!entradaActualizada) {
      return { error: "No se pudo actualizar la entrada clinica.", data: null };
    }

    const afterData = buildEntradaAuditData(entradaActualizada as EntradaClinicaAuditRow);
    const { error: auditError } = await supabase
      .from("entradas_clinicas_ediciones")
      .insert({
        clinica_id: clinicaId,
        entrada_clinica_id: entradaActualizada.id,
        orden_id: entradaActualizada.orden_id,
        editado_por: userId,
        motivo_text: validatedData.motivo_edicion_text,
        before_data: beforeData,
        after_data: afterData,
      });

    if (auditError) {
      return { error: `La entrada se actualizo, pero fallo la auditoria: ${auditError.message}`, data: null };
    }

    revalidatePath(`/orden_y_colas/${entradaActualizada.orden_id}`);
    if (orden.mascota_id) {
      revalidatePath(`/mascotas/${orden.mascota_id}`);
    }

    return { error: null, data: entradaActualizada };
  } catch (error: any) {
    return {
      error: error.message || "Error al editar entrada clinica con auditoria",
      data: null,
    };
  }
}


export async function uploadAdjunto(formData: FormData, ordenId: string) {
  try {
    const file = formData.get("file") as File;
    const descripcion = formData.get("descripcion") as string || "";
    
    if (!file) {
      return { error: "No se proporcionó ningún archivo", data: null };
    }

    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();
    const orden = await ensureOrdenInClinica(supabase, clinicaId, ordenId);
    if (!orden) {
      return { error: "La orden no pertenece a la clínica activa.", data: null };
    }

    // 1. Upload to Supabase Storage 'adjuntos' bucket
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${clinicaId}/${ordenId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("adjuntos")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return { error: "Error al subir el archivo", data: null };
    }

    // 2. We NO LONGER generate the signed URL here. 
    // We will save the raw `filePath` in the database.
    // The signed URL will be generated dynamically on `getOrdenCompleta` when needed.

    // 3. Save to adjuntos table
    const validatedData = adjuntoSchema.parse({
      orden_id: ordenId,
      archivo_url: filePath, // Storing relative path instead of signed URL
      descripcion_text: descripcion,
    });

    const { data, error: dbError } = await supabase
      .from("adjuntos")
      .insert({
        clinica_id: clinicaId,
        orden_id: validatedData.orden_id,
        archivo_url: validatedData.archivo_url,
        descripcion_text: validatedData.descripcion_text,
        fecha_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creating adjunto record:", dbError);
      return { error: dbError.message, data: null };
    }

    return { error: null, data };
  } catch (error: any) {
    console.error("Exception in uploadAdjunto:", error);
    return { error: error.message || "Error al subir el adjunto", data: null };
  }
}
