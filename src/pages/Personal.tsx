import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useStaff,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
} from "@/hooks/useStaff";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Loader2,
  Shield,
  Key,
} from "lucide-react";
import type { StaffMember } from "@/types";

const DEPARTMENTS = [
  "Administracion",
  "Academico",
  "Financiero",
  "Servicios Generales",
  "Orientacion",
  "Sistemas",
];

const ROLES = [
  { value: "SUPER_ADMIN", label: "Super Administrador" },
  { value: "ADMIN", label: "Administrador" },
  { value: "TEACHER", label: "Profesor" },
  { value: "ACCOUNTANT", label: "Contador" },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  TEACHER: "Profesor",
  ACCOUNTANT: "Contador",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800",
  ADMIN: "bg-blue-100 text-blue-800",
  TEACHER: "bg-green-100 text-green-800",
  ACCOUNTANT: "bg-yellow-100 text-yellow-800",
};

interface StaffForm {
  name: string;
  department: string;
  designation: string;
  phone: string;
  email: string;
  password: string;
  role: string;
  createAccount: boolean;
  organizationIds: number[];
}

const initialForm: StaffForm = {
  name: "",
  department: "",
  designation: "",
  phone: "",
  email: "",
  password: "",
  role: "TEACHER",
  createAccount: false,
  organizationIds: [],
};

export default function Personal() {
  const { toast } = useToast();
  const { organizations } = useOrganization();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffForm>(initialForm);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  const { data: staff, isLoading } = useStaff({
    search: search || undefined,
    department: departmentFilter || undefined,
  });

  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const openCreateDialog = () => {
    setEditingStaff(null);
    setForm(initialForm);
    setDialogOpen(true);
  };

  const openEditDialog = (member: StaffMember) => {
    setEditingStaff(member);
    setForm({
      name: member.name || "",
      department: member.department || "",
      designation: member.designation || "",
      phone: member.phone || "",
      email: member.email || "",
      password: "",
      role: member.user?.role || "TEACHER",
      createAccount: !!member.user,
      organizationIds: member.staffOrgs?.map((so) => so.organizationId) || [],
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }

    const payload: any = {
      name: form.name,
      department: form.department,
      designation: form.designation,
      phone: form.phone,
      email: form.email,
      organizationIds: form.organizationIds,
    };

    if (form.createAccount || editingStaff?.user) {
      payload.role = form.role;
      if (form.password) {
        payload.password = form.password;
      }
    }

    try {
      if (editingStaff) {
        await updateStaff.mutateAsync({ id: editingStaff.id, data: payload });
        toast({ title: "Actualizado", description: "El personal ha sido actualizado exitosamente" });
      } else {
        if (form.createAccount && !form.password) {
          toast({ title: "Error", description: "La contrasena es requerida para crear cuenta", variant: "destructive" });
          return;
        }
        if (form.createAccount && !form.email) {
          toast({ title: "Error", description: "El email es requerido para crear cuenta", variant: "destructive" });
          return;
        }
        await createStaff.mutateAsync(payload);
        toast({ title: "Creado", description: "El personal ha sido registrado exitosamente" });
      }
      setDialogOpen(false);
      setForm(initialForm);
      setEditingStaff(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo guardar", variant: "destructive" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;
    try {
      await deleteStaff.mutateAsync(staffToDelete.id);
      toast({ title: "Eliminado", description: `${staffToDelete.name} ha sido eliminado del sistema` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo eliminar", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    }
  };

  const toggleOrg = (orgId: number) => {
    setForm((prev) => ({
      ...prev,
      organizationIds: prev.organizationIds.includes(orgId)
        ? prev.organizationIds.filter((id) => id !== orgId)
        : [...prev.organizationIds, orgId],
    }));
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Personal
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona la informacion del personal y sus cuentas de acceso
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90" onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Personal
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={departmentFilter}
              onValueChange={(val) => setDepartmentFilter(val === "all" ? "" : val)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {DEPARTMENTS.map((dep) => (
                  <SelectItem key={dep} value={dep}>
                    {dep}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Nombre</TableHead>
                <TableHead className="font-semibold">Departamento</TableHead>
                <TableHead className="font-semibold">Cargo</TableHead>
                <TableHead className="font-semibold">Telefono</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Rol</TableHead>
                <TableHead className="w-[50px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !staff || staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No se encontro personal</p>
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((member, index) => (
                  <TableRow
                    key={member.id}
                    className={`table-row-hover ${index % 2 === 0 ? "" : "bg-muted/30"}`}
                  >
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.department || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.designation || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {member.phone || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {member.email || "-"}
                    </TableCell>
                    <TableCell>
                      {member.user ? (
                        <Badge className={`text-xs ${ROLE_COLORS[member.user.role] || "bg-gray-100 text-gray-800"}`}>
                          {ROLE_LABELS[member.user.role] || member.user.role}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin cuenta</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(member)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setStaffToDelete(member);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? "Editar Personal" : "Agregar Personal"}
              </DialogTitle>
              <DialogDescription>
                {editingStaff
                  ? "Modifica la informacion del personal"
                  : "Completa el formulario para registrar un nuevo miembro del personal"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Nombre completo"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Departamento</label>
                <Select
                  value={form.department}
                  onValueChange={(val) => setForm({ ...form, department: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dep) => (
                      <SelectItem key={dep} value={dep}>
                        {dep}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cargo</label>
                <Input
                  placeholder="Ej: Docente, Secretaria..."
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefono</label>
                  <Input
                    placeholder="Ej: 301-234-5678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    placeholder="correo@ejemplo.com"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Organizations */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Organizaciones</label>
                <div className="flex flex-wrap gap-3">
                  {organizations.map((org) => (
                    <label key={org.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={form.organizationIds.includes(org.id)}
                        onCheckedChange={() => toggleOrg(org.id)}
                      />
                      <span className="text-sm">{org.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Account Section */}
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Cuenta de acceso al sistema</span>
                </div>

                {!editingStaff && (
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <Checkbox
                      checked={form.createAccount}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, createAccount: checked === true })
                      }
                    />
                    <span className="text-sm">Crear cuenta de usuario para este personal</span>
                  </label>
                )}

                {(form.createAccount || editingStaff?.user) && (
                  <div className="space-y-3 pl-1">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rol</label>
                      <Select
                        value={form.role}
                        onValueChange={(val) => setForm({ ...form, role: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1">
                        <Key className="h-3 w-3" />
                        {editingStaff?.user ? "Nueva contrasena (dejar vacio para no cambiar)" : "Contrasena *"}
                      </label>
                      <Input
                        placeholder={editingStaff?.user ? "Sin cambios" : "Minimo 6 caracteres"}
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                    </div>
                    {editingStaff?.user && (
                      <p className="text-xs text-muted-foreground">
                        Cuenta actual: {editingStaff.email} ({ROLE_LABELS[editingStaff.user.role] || editingStaff.user.role})
                        {!editingStaff.user.active && " - Inactivo"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleSubmit}
                disabled={createStaff.isPending || updateStaff.isPending}
              >
                {createStaff.isPending || updateStaff.isPending
                  ? "Guardando..."
                  : editingStaff
                  ? "Actualizar"
                  : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar personal</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion no se puede deshacer. Se eliminara permanentemente a{" "}
                <span className="font-semibold text-foreground">
                  {staffToDelete?.name}
                </span>{" "}
                del sistema{staffToDelete?.user ? " junto con su cuenta de acceso" : ""}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteStaff.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteStaff.isPending}
              >
                {deleteStaff.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
