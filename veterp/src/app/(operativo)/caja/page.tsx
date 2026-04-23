import { redirect } from "next/navigation";

export default function CajaPage() {
  redirect("/caja_inventario?tab=caja");
}
