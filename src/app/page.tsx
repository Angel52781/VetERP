import { Metadata } from "next";
import LandingClient from "./landing-client";

export const metadata: Metadata = {
  title: "VetERP - Organiza la operación diaria de tu clínica veterinaria",
  description: "Agenda, atención clínica, pacientes, cobros e inventario en un espacio claro y fácil de usar. VetERP está en beta privada y el acceso se habilitará progresivamente.",
};

export default function LandingPage() {
  return <LandingClient />;
}
