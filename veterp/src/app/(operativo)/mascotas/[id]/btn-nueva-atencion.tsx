"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Stethoscope, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createOrdenServicio } from "@/app/(operativo)/index/actions";

interface BtnNuevaAtencionProps {
  clienteId: string;
  mascotaId: string;
  compact?: boolean;
  label?: string;
}

export function BtnNuevaAtencion({
  clienteId,
  mascotaId,
  compact = false,
  label,
}: BtnNuevaAtencionProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreateAtencion() {
    setIsLoading(true);
    const { data, error } = await createOrdenServicio({
      cliente_id: clienteId,
      mascota_id: mascotaId,
    });

    if (error) {
      if (data?.id) {
        toast.info("Redirigiendo a atención activa existente...");
        router.push(`/orden_y_colas/${data.id}`);
      } else {
        toast.error(error);
        setIsLoading(false);
      }
    } else if (data?.id) {
      toast.success("Atención iniciada correctamente.");
      router.push(`/orden_y_colas/${data.id}`);
    } else {
      setIsLoading(false);
    }
  }

  return (
    <Button
      size={compact ? "sm" : "lg"}
      variant={compact ? "outline" : "default"}
      className={compact ? "h-8" : undefined}
      onClick={handleCreateAtencion}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className={`mr-2 animate-spin ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
      ) : (
        <Stethoscope className={`mr-2 ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
      )}
      {label ?? (compact ? "Nueva Atención" : "Nueva Atención Médica")}
    </Button>
  );
}
