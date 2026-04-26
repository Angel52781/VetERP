import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/clinica";

export default async function CajaInventarioPage() {
  const role = await getUserRole();
  
  if (role === "veterinario") {
    redirect("/inventario");
  } else {
    redirect("/caja");
  }
}
