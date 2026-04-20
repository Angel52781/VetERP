"use server";

import { createClient } from "@/lib/supabase/server";
import { requireClinicaIdFromCookies } from "@/lib/clinica";
import { entradaClinicaSchema, EntradaClinicaInput } from "@/lib/validators/atencion";

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

    const { data, error } = await supabase
      .from("entradas_clinicas")
      .insert({
        clinica_id: clinicaId,
        orden_id: validatedData.orden_id,
        tipo_text: validatedData.tipo_text,
        texto_text: validatedData.texto_text,
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

import { adjuntoSchema, AdjuntoInput } from "@/lib/validators/atencion";
import { v4 as uuidv4 } from 'uuid';

export async function uploadAdjunto(formData: FormData, ordenId: string) {
  try {
    const file = formData.get("file") as File;
    const descripcion = formData.get("descripcion") as string || "";
    
    if (!file) {
      return { error: "No se proporcionó ningún archivo", data: null };
    }

    const clinicaId = await requireClinicaIdFromCookies();
    const supabase = await createClient();

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

    // 2. Get public URL (or signed URL, but usually public for simple apps)
    const { data: publicUrlData } = supabase.storage
      .from("adjuntos")
      .getPublicUrl(filePath);

    // 3. Save to adjuntos table
    const validatedData = adjuntoSchema.parse({
      orden_id: ordenId,
      archivo_url: publicUrlData.publicUrl,
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
