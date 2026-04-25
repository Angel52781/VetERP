"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Copy, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { z } from "zod";
import { invitationSchema, type InvitationInput, roles, type StaffMember } from "@/lib/validators/staff";
import { createInvitation, revokeInvitation, updateStaffRole, removeStaff } from "./staff-actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Sub-componente controlado para la fila de staff (evita el warning de Select no controlado)
function isStaffRole(value: string): value is InvitationInput["role"] {
  return roles.includes(value as InvitationInput["role"]);
}

function StaffRoleSelect({
  userId,
  initialRole,
  currentUserRole,
  onRoleChange,
  onRemove,
}: {
  userId: string;
  initialRole: string;
  currentUserRole: string;
  onRoleChange: (userId: string, role: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}) {
  const [selectedRole, setSelectedRole] = useState(initialRole);

  const handleChange = async (newRole: string | null) => {
    if (!newRole || newRole === selectedRole) return;
    if (!confirm(`¿Cambiar rol a ${newRole}?`)) return;
    setSelectedRole(newRole);
    await onRoleChange(userId, newRole);
  };

  return (
    <div className="flex justify-end items-center gap-2">
      <Select value={selectedRole} onValueChange={handleChange}>
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="veterinario">Veterinario</SelectItem>
          <SelectItem value="asistente">Asistente</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          {currentUserRole === "owner" && <SelectItem value="owner">Owner</SelectItem>}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive/90"
        onClick={() => onRemove(userId)}
        title="Expulsar"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

export function StaffClient({
  staff,
  invitations,
  currentUserRole,
  currentUserId,
}: {
  staff: StaffMember[];
  invitations: Invitation[];
  currentUserRole: string;
  currentUserId: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.input<typeof invitationSchema>>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: "",
      role: "veterinario",
    },
  });

  async function onInvite(data: z.input<typeof invitationSchema>) {
    setIsSubmitting(true);
    const res = await createInvitation(data as InvitationInput);
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Invitación creada exitosamente");
    form.reset();
    setDialogOpen(false);
    router.refresh();
  }

  const handleCopyLink = (invitationId: string) => {
    const link = `${window.location.origin}/invitacion/${invitationId}`;
    navigator.clipboard.writeText(link);
    toast.success("Enlace copiado al portapapeles");
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("¿Seguro que deseas revocar esta invitación?")) return;
    const res = await revokeInvitation(id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Invitación revocada");
      router.refresh();
    }
  };

  const handleRemoveStaff = async (id: string) => {
    if (!confirm("¿Seguro que deseas expulsar a este usuario de la clínica? Perderá acceso inmediatamente.")) return;
    const res = await removeStaff(id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Usuario expulsado exitosamente");
      router.refresh();
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!isStaffRole(newRole)) {
      toast.error("Rol inválido");
      return;
    }

    const res = await updateStaffRole({ userId, role: newRole });
    if (res.error) toast.error(res.error);
    else {
      toast.success("Rol actualizado");
      router.refresh();
    }
  };

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-purple-600 hover:bg-purple-700">Owner</Badge>;
      case "admin":
        return <Badge className="bg-blue-600 hover:bg-blue-700">Admin</Badge>;
      case "veterinario":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700">Veterinario</Badge>;
      case "asistente":
        return <Badge className="bg-orange-600 hover:bg-orange-700">Asistente</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION: Miembros Actuales */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-medium">Equipo de la Clínica</h2>
            <p className="text-sm text-muted-foreground">Gestiona los accesos de los usuarios registrados.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="mr-2 h-4 w-4" />
              Invitar Miembro
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Invitar al equipo</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onInvite)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                          <Input placeholder="ejemplo@correo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rol</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="veterinario">Veterinario</SelectItem>
                            <SelectItem value="asistente">Asistente</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                            {currentUserRole === "owner" && (
                              <SelectItem value="owner">Dueño (Owner)</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Invitando..." : "Crear Invitación"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Miembro desde</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                    No hay miembros registrados en esta clínica.
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((user) => {
                  const isSelf = user.userId === currentUserId;
                  const canEdit = currentUserRole === "owner" || (currentUserRole === "admin" && user.role !== "owner");

                  return (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium">
                        {user.email}
                        {isSelf && <span className="ml-2 text-xs text-muted-foreground">(Tú)</span>}
                      </TableCell>
                      <TableCell>{renderRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(user.createdAt), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isSelf && canEdit && (
                          <StaffRoleSelect
                            userId={user.userId}
                            initialRole={user.role}
                            currentUserRole={currentUserRole}
                            onRoleChange={handleChangeRole}
                            onRemove={handleRemoveStaff}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* SECTION: Invitaciones Pendientes */}
      {invitations.length > 0 && (
        <div className="space-y-4 pt-6 border-t">
          <div>
            <h2 className="text-lg font-medium">Invitaciones Pendientes</h2>
            <p className="text-sm text-muted-foreground">Envía el enlace a los usuarios para que se unan.</p>
          </div>

          <div className="rounded-md border border-amber-200">
            <Table>
              <TableHeader className="bg-amber-50">
                <TableRow>
                  <TableHead>Email Invitado</TableHead>
                  <TableHead>Rol Propuesto</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>{renderRoleBadge(inv.role)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(inv.expires_at), "dd MMM yyyy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(inv.id)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar Enlace
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleRevoke(inv.id)}
                        >
                          Revocar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
