"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { entradaClinicaSchema, EntradaClinicaInput, adjuntoSchema, AdjuntoInput } from "@/lib/validators/atencion";
import { v4 as uuidv4 } from "uuid";

async function ensureOrdenInClinica(supabase: any, clinicaId: string, ordenId: string) {
  const { data: orden } = await supabase
    .from("ordenes_servicio")
    .select("id")
    .eq("id", ordenId)
    .eq("clinica_id", clinicaId)
    .maybeSingle();

  return orden;
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
          especie,
          raza,
          nacimiento
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
          fecha_date,
          created_at
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
        const { data, error } = await supabase
          .from("entradas_clinicas")
          .update({
            tipo_text: "Nota Clínica de Evolución",
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
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating entrada clinica:", error);
          return { error: error.message, data: null };
        }
        return { error: null, data };
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
