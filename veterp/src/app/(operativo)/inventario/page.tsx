import { redirect } from "next/navigation";

export default function InventarioPage() {
  redirect("/caja_inventario?tab=inventario");
}
