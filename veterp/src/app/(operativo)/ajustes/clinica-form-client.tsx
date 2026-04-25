"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clinicaBrandingSchema, ClinicaBrandingInput } from "@/lib/validators/ajustes";
import { updateClinicaBranding, uploadClinicaLogo } from "./actions";
import { cn } from "@/lib/utils";

interface ClinicaData {
  id: string;
  nombre: string;
  razon_social: string | null;
  ruc: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  logo_url: string | null;
}

export function ClinicaGeneralForm({ clinica }: { clinica: ClinicaData }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ClinicaBrandingInput>({
    resolver: zodResolver(clinicaBrandingSchema),
    defaultValues: {
      nombre: clinica.nombre || "",
      razon_social: clinica.razon_social || "",
      ruc: clinica.ruc || "",
      telefono: clinica.telefono || "",
      email: clinica.email || "",
      direccion: clinica.direccion || "",
      logo_url: clinica.logo_url || "",
    },
  });

  async function onSubmit(data: ClinicaBrandingInput) {
    setIsSubmitting(true);
    const { error } = await updateClinicaBranding(data);
    setIsSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Información de clínica actualizada");
    router.refresh();
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("El logo no debe pesar más de 2MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    const { data: logoUrl, error } = await uploadClinicaLogo(formData);
    setIsUploading(false);

    if (error) {
      toast.error(error);
      return;
    }

    form.setValue("logo_url", logoUrl);
    toast.success("Logo actualizado correctamente");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Logo Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Logo de la Clínica</CardTitle>
            <CardDescription>Esta imagen aparecerá en el menú lateral y documentos oficiales.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="relative group">
              <div className={cn(
                "w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50",
                isUploading && "opacity-50"
              )}>
                {clinica.logo_url ? (
                  <img 
                    src={clinica.logo_url} 
                    alt="Logo clinica" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground/50" />
                )}
              </div>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-xl disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <span className="text-xs font-medium">Cambiar Logo</span>
                )}
              </button>
            </div>
            
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleLogoUpload}
            />
            
            <p className="text-[10px] text-muted-foreground text-center">
              Recomendado: 512x512px. <br />
              PNG o JPG, máx 2MB.
            </p>
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Datos públicos y fiscales de tu centro veterinario.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Comercial</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Veterinaria El Amigo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="razon_social"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razón Social / Nombre Fiscal</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. VetGroup S.A.C." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ruc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RUC / Tax ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. 20123456789" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono de Contacto</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. +51 987654321" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de Atención</FormLabel>
                        <FormControl>
                          <Input placeholder="contacto@veterinaria.com" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="direccion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección Física</FormLabel>
                        <FormControl>
                          <Input placeholder="Av. Principal 123, Ciudad" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
