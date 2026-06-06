"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateEstadoOrden } from "@/app/(operativo)/index/actions";
import { Button } from "@/components/ui/button";

type FinalizarAtencionButtonProps = {
  ordenId: string;
};

export function FinalizarAtencionButton({ ordenId }: FinalizarAtencionButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const { error } = await updateEstadoOrden(ordenId, "finished");

      if (error) {
        toast.error(error);
        return;
      }

      toast.success("Atención finalizada");
      router.refresh();
    });
  }

  return (
    <Button type="button" size="sm" onClick={handleClick} disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
      Finalizar atención
    </Button>
  );
}
