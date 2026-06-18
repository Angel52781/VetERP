"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CajaInventarioTabsProps {
  activeTab: string;
  isVeterinario: boolean;
  children: React.ReactNode;
}

export function CajaInventarioTabs({
  activeTab,
  isVeterinario,
  children,
}: CajaInventarioTabsProps) {
  const router = useRouter();

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => {
        router.push(`/caja_inventario?tab=${val}`);
      }}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2 sm:w-fit">
        {!isVeterinario && <TabsTrigger value="caja">Caja y Ventas</TabsTrigger>}
        <TabsTrigger value="inventario">Inventario / Kardex</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
