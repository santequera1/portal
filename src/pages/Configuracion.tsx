import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useFeeTypes, useCreateFeeType, useDeleteFeeType } from "@/hooks/useFees";
import { usePaymentPlans, useCreatePaymentPlan, useUpdatePaymentPlan, useDeletePaymentPlan } from "@/hooks/usePaymentPlans";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  Settings,
  CreditCard,
  Users,
  Plus,
  Trash2,
  Building,
  Phone,
  Mail,
  Globe,
  Clock,
  Edit,
  MoreVertical,
  Loader2,
  Save,
  X,
  MapPin,
  Banknote,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { User, UserRole, Sede, Organization, PaymentPlan, PaymentFrequency } from "@/types";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Administrador" },
  { value: "TEACHER", label: "Docente" },
  { value: "ACCOUNTANT", label: "Contador" },
  { value: "STUDENT", label: "Estudiante" },
  { value: "PARENT", label: "Acudiente" },
];

const DEFAULT_CONFIG: Record<string, string> = {
  schoolName: "Colegio Minerva",
  address: "Carrera 10 #15-20, Bogota D.C.",
  phone: "+57 (1) 234-5678",
  email: "info@colegiominerva.edu.co",
  currency: "COP (Peso Colombiano)",
  timezone: "America/Bogota (UTC-5)",
};

export default function Configuracion() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // General config state
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [generalForm, setGeneralForm] = useState<Record<string, string>>(DEFAULT_CONFIG);

  // Fee type state
  const [feeTypeDialog, setFeeTypeDialog] = useState(false);
  const [feeTypeName, setFeeTypeName] = useState("");

  // User state
  const [userDialog, setUserDialog] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "TEACHER" as UserRole,
  });

  // Edit user state
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [editUserForm, setEditUserForm] = useState<{
    id: number;
    name: string;
    email: string;
    role: UserRole;
    active: boolean;
  } | null>(null);

  // Delete user state
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null);

  // Sede state
  const [sedeDialog, setSedeDialog] = useState(false);
  const [sedeForm, setSedeForm] = useState({
    name: "",
    address: "",
    phone: "",
    organizationId: 0,
  });

  // Payment Plan state
  const [planDialog, setPlanDialog] = useState(false);
  const [editPlanDialog, setEditPlanDialog] = useState(false);
  const [deletePlanDialog, setDeletePlanDialog] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PaymentPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    enrollmentFee: 0,
    tuitionAmount: 0,
    frequency: "MONTHLY" as PaymentFrequency,
    installments: 10,
    materialsCharge: 0,
    uniformCharge: 0,
    transportCharge: 0,
    discountPercent: 0,
  });
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);

  const FREQUENCIES: { value: PaymentFrequency; label: string }[] = [
    { value: "WEEKLY", label: "Semanal" },
    { value: "BIWEEKLY", label: "Quincenal" },
    { value: "MONTHLY", label: "Mensual" },
    { value: "QUARTERLY", label: "Trimestral" },
    { value: "YEARLY", label: "Anual" },
  ];

  // Queries
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["config"],
    queryFn: () => api.get<Record<string, string>>("/config/school"),
  });

  const { data: feeTypes, isLoading: feeTypesLoading } = useFeeTypes();
  const createFeeType = useCreateFeeType();
  const deleteFeeType = useDeleteFeeType();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/auth/users"),
  });

  const { data: sedes, isLoading: sedesLoading } = useQuery({
    queryKey: ["sedes"],
    queryFn: () => api.get<Sede[]>("/organizations/sedes"),
  });

  const { data: orgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.get<Organization[]>("/organizations"),
  });

  const { data: paymentPlans, isLoading: plansLoading } = usePaymentPlans();

  // Mutations
  const updateConfig = useMutation({
    mutationFn: (data: Record<string, string>) => api.put("/config/school", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
  });

  const registerUser = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: string }) =>
      api.post("/auth/register", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, ...data }: { id: number; name: string; role: UserRole; active: boolean }) =>
      api.put(`/auth/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const createSede = useMutation({
    mutationFn: (data: { name: string; address: string; phone: string; organizationId: number }) =>
      api.post("/organizations/sedes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sedes"] });
    },
  });

  const deleteSede = useMutation({
    mutationFn: (id: number) => api.delete(`/organizations/sedes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sedes"] });
    },
  });

  const createPlan = useCreatePaymentPlan();
  const updatePlan = useUpdatePaymentPlan();
  const deletePlan = useDeletePaymentPlan();

  // Sync config data into local form state
  useEffect(() => {
    if (configData) {
      setGeneralForm({
        schoolName: (configData as Record<string, string>).schoolName || DEFAULT_CONFIG.schoolName,
        address: (configData as Record<string, string>).address || DEFAULT_CONFIG.address,
        phone: (configData as Record<string, string>).phone || DEFAULT_CONFIG.phone,
        email: (configData as Record<string, string>).email || DEFAULT_CONFIG.email,
        currency: (configData as Record<string, string>).currency || DEFAULT_CONFIG.currency,
        timezone: (configData as Record<string, string>).timezone || DEFAULT_CONFIG.timezone,
      });
    }
  }, [configData]);

  // Handlers
  const handleSaveConfig = async () => {
    try {
      await updateConfig.mutateAsync(generalForm);
      toast({ title: "Guardado", description: "La configuracion ha sido actualizada" });
      setIsEditingGeneral(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCancelEditConfig = () => {
    if (configData) {
      setGeneralForm({
        schoolName: (configData as Record<string, string>).schoolName || DEFAULT_CONFIG.schoolName,
        address: (configData as Record<string, string>).address || DEFAULT_CONFIG.address,
        phone: (configData as Record<string, string>).phone || DEFAULT_CONFIG.phone,
        email: (configData as Record<string, string>).email || DEFAULT_CONFIG.email,
        currency: (configData as Record<string, string>).currency || DEFAULT_CONFIG.currency,
        timezone: (configData as Record<string, string>).timezone || DEFAULT_CONFIG.timezone,
      });
    } else {
      setGeneralForm(DEFAULT_CONFIG);
    }
    setIsEditingGeneral(false);
  };

  const handleCreateFeeType = async () => {
    if (!feeTypeName.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    try {
      await createFeeType.mutateAsync({ name: feeTypeName });
      toast({ title: "Creado", description: "El tipo de cuota ha sido creado" });
      setFeeTypeDialog(false);
      setFeeTypeName("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteFeeType = async (id: number) => {
    try {
      await deleteFeeType.mutateAsync(id);
      toast({ title: "Eliminado", description: "El tipo de cuota ha sido eliminado" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast({ title: "Error", description: "Nombre, email y contrasena son requeridos", variant: "destructive" });
      return;
    }
    try {
      await registerUser.mutateAsync(userForm);
      toast({ title: "Creado", description: "El usuario ha sido registrado exitosamente" });
      setUserDialog(false);
      setUserForm({ name: "", email: "", password: "", role: "TEACHER" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleOpenEditUser = (user: User) => {
    setEditUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    });
    setEditUserDialog(true);
  };

  const handleSaveEditUser = async () => {
    if (!editUserForm) return;
    try {
      await updateUser.mutateAsync({
        id: editUserForm.id,
        name: editUserForm.name,
        role: editUserForm.role,
        active: editUserForm.active,
      });
      toast({ title: "Actualizado", description: "El usuario ha sido actualizado exitosamente" });
      setEditUserDialog(false);
      setEditUserForm(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleOpenDeleteUser = (user: User) => {
    setDeleteUserTarget(user);
    setDeleteUserDialog(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteUserTarget) return;
    try {
      await updateUser.mutateAsync({
        id: deleteUserTarget.id,
        name: deleteUserTarget.name,
        role: deleteUserTarget.role,
        active: false,
      });
      toast({ title: "Desactivado", description: "El usuario ha sido desactivado exitosamente" });
      setDeleteUserDialog(false);
      setDeleteUserTarget(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateSede = async () => {
    if (!sedeForm.name.trim() || !sedeForm.organizationId) {
      toast({ title: "Error", description: "Nombre y entidad son requeridos", variant: "destructive" });
      return;
    }
    try {
      await createSede.mutateAsync(sedeForm);
      toast({ title: "Creado", description: "La sede ha sido creada exitosamente" });
      setSedeDialog(false);
      setSedeForm({ name: "", address: "", phone: "", organizationId: 0 });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteSede = async (id: number) => {
    try {
      await deleteSede.mutateAsync(id);
      toast({ title: "Eliminado", description: "La sede ha sido eliminada" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Payment Plan handlers
  const handleCreatePlan = async () => {
    if (!planForm.name.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    if (planForm.tuitionAmount <= 0) {
      toast({ title: "Error", description: "La cuota debe ser mayor a 0", variant: "destructive" });
      return;
    }
    try {
      await createPlan.mutateAsync(planForm);
      toast({ title: "Creado", description: "El plan de pago ha sido creado" });
      setPlanDialog(false);
      resetPlanForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleOpenEditPlan = (plan: PaymentPlan) => {
    setPlanForm({
      name: plan.name,
      description: plan.description || "",
      enrollmentFee: plan.enrollmentFee,
      tuitionAmount: plan.tuitionAmount,
      frequency: plan.frequency,
      installments: plan.installments,
      materialsCharge: plan.materialsCharge,
      uniformCharge: plan.uniformCharge,
      transportCharge: plan.transportCharge,
      discountPercent: plan.discountPercent,
    });
    setEditingPlanId(plan.id);
    setEditPlanDialog(true);
  };

  const handleSaveEditPlan = async () => {
    if (!editingPlanId) return;
    if (!planForm.name.trim() || planForm.tuitionAmount <= 0) {
      toast({ title: "Error", description: "Nombre y cuota son requeridos", variant: "destructive" });
      return;
    }
    try {
      await updatePlan.mutateAsync({ id: editingPlanId, data: planForm });
      toast({ title: "Actualizado", description: "El plan ha sido actualizado" });
      setEditPlanDialog(false);
      resetPlanForm();
      setEditingPlanId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleOpenDeletePlan = (plan: PaymentPlan) => {
    setPlanToDelete(plan);
    setDeletePlanDialog(true);
  };

  const handleConfirmDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      await deletePlan.mutateAsync(planToDelete.id);
      toast({ title: "Eliminado", description: "El plan ha sido eliminado" });
      setDeletePlanDialog(false);
      setPlanToDelete(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetPlanForm = () => {
    setPlanForm({
      name: "",
      description: "",
      enrollmentFee: 0,
      tuitionAmount: 0,
      frequency: "MONTHLY",
      installments: 10,
      materialsCharge: 0,
      uniformCharge: 0,
      transportCharge: 0,
      discountPercent: 0,
    });
  };

  // Resolved config values for display mode
  const displayConfig = {
    schoolName: generalForm.schoolName,
    address: generalForm.address,
    phone: generalForm.phone,
    email: generalForm.email,
    currency: generalForm.currency,
    timezone: generalForm.timezone,
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Configuracion
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra la configuracion del sistema
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-muted/50 w-max sm:w-auto">
              <TabsTrigger value="general" className="text-xs sm:text-sm">
                <Settings className="w-4 h-4 mr-1 sm:mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="fee-types" className="text-xs sm:text-sm">
                <CreditCard className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Tipos de </span>Cuota
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm">
                <Users className="w-4 h-4 mr-1 sm:mr-2" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="sedes" className="text-xs sm:text-sm">
                <MapPin className="w-4 h-4 mr-1 sm:mr-2" />
                Sedes
              </TabsTrigger>
              <TabsTrigger value="payment-plans" className="text-xs sm:text-sm">
                <Banknote className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Planes de </span>Pago
              </TabsTrigger>
            </TabsList>
          </div>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    Informacion del Colegio
                  </CardTitle>
                  {!isEditingGeneral ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingGeneral(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEditConfig}
                        disabled={updateConfig.isPending}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                        onClick={handleSaveConfig}
                        disabled={updateConfig.isPending}
                      >
                        {updateConfig.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Guardar
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {configLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : isEditingGeneral ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          Nombre
                        </label>
                        <Input
                          value={generalForm.schoolName}
                          onChange={(e) =>
                            setGeneralForm({ ...generalForm, schoolName: e.target.value })
                          }
                          placeholder="Nombre del colegio"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          Direccion
                        </label>
                        <Input
                          value={generalForm.address}
                          onChange={(e) =>
                            setGeneralForm({ ...generalForm, address: e.target.value })
                          }
                          placeholder="Direccion del colegio"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          Telefono
                        </label>
                        <Input
                          value={generalForm.phone}
                          onChange={(e) =>
                            setGeneralForm({ ...generalForm, phone: e.target.value })
                          }
                          placeholder="Telefono de contacto"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          Email
                        </label>
                        <Input
                          type="email"
                          value={generalForm.email}
                          onChange={(e) =>
                            setGeneralForm({ ...generalForm, email: e.target.value })
                          }
                          placeholder="Email de contacto"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          Moneda
                        </label>
                        <Input
                          value={generalForm.currency}
                          onChange={(e) =>
                            setGeneralForm({ ...generalForm, currency: e.target.value })
                          }
                          placeholder="Moneda del sistema"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          Zona Horaria
                        </label>
                        <Input
                          value={generalForm.timezone}
                          onChange={(e) =>
                            setGeneralForm({ ...generalForm, timezone: e.target.value })
                          }
                          placeholder="Zona horaria"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Building className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Nombre</p>
                          <p className="font-medium">{displayConfig.schoolName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Direccion</p>
                          <p className="font-medium">{displayConfig.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Telefono</p>
                          <p className="font-medium">{displayConfig.phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{displayConfig.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Moneda</p>
                          <p className="font-medium">{displayConfig.currency}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Zona Horaria</p>
                          <p className="font-medium">{displayConfig.timezone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fee Types Tab */}
          <TabsContent value="fee-types" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-semibold">Tipos de Cuota</h3>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setFeeTypeDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Tipo
              </Button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="w-[50px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeTypesLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 3 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !feeTypes || feeTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12">
                        <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay tipos de cuota registrados</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    feeTypes.map((type, index) => (
                      <TableRow key={type.id} className={index % 2 === 0 ? "" : "bg-muted/30"}>
                        <TableCell className="font-mono text-sm">{type.id}</TableCell>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteFeeType(type.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-semibold">Usuarios del Sistema</h3>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setUserDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Rol</TableHead>
                    <TableHead className="font-semibold text-center">Estado</TableHead>
                    <TableHead className="w-[50px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !users || (users as User[]).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay usuarios registrados</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (users as User[]).map((user, index) => {
                      const roleLabel = ROLES.find((r) => r.value === user.role)?.label || user.role;
                      const roleColors: Record<string, string> = {
                        SUPER_ADMIN: "bg-destructive/10 text-destructive",
                        ADMIN: "bg-primary/10 text-primary",
                        TEACHER: "bg-success/10 text-success",
                        ACCOUNTANT: "bg-warning/10 text-warning",
                        STUDENT: "bg-secondary/10 text-secondary",
                        PARENT: "bg-muted text-muted-foreground",
                      };
                      return (
                        <TableRow key={user.id} className={index % 2 === 0 ? "" : "bg-muted/30"}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell>
                            <Badge className={roleColors[user.role] || "bg-muted"}>
                              {roleLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={user.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                              {user.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEditUser(user)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleOpenDeleteUser(user)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Desactivar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Sedes Tab */}
          <TabsContent value="sedes" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-semibold">Sedes</h3>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setSedeDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Sede
              </Button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Direccion</TableHead>
                    <TableHead className="font-semibold">Telefono</TableHead>
                    <TableHead className="font-semibold">Entidad</TableHead>
                    <TableHead className="w-[50px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sedesLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !sedes || (sedes as Sede[]).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay sedes registradas</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (sedes as Sede[]).map((sede, index) => (
                      <TableRow key={sede.id} className={index % 2 === 0 ? "" : "bg-muted/30"}>
                        <TableCell className="font-medium">{sede.name}</TableCell>
                        <TableCell className="text-sm">{sede.address || "-"}</TableCell>
                        <TableCell className="text-sm">{sede.phone || "-"}</TableCell>
                        <TableCell className="text-sm">{sede.organization?.name || "-"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteSede(sede.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Payment Plans Tab */}
          <TabsContent value="payment-plans" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-semibold">Planes de Pago</h3>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setPlanDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Plan
              </Button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Matrícula</TableHead>
                    <TableHead className="font-semibold">Cuota</TableHead>
                    <TableHead className="font-semibold">Frecuencia</TableHead>
                    <TableHead className="font-semibold text-center">Cuotas</TableHead>
                    <TableHead className="font-semibold text-center">Descuento</TableHead>
                    <TableHead className="w-[50px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plansLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !paymentPlans || paymentPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Banknote className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay planes de pago registrados</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentPlans.map((plan, index) => {
                      const frequencyLabel = FREQUENCIES.find((f) => f.value === plan.frequency)?.label || plan.frequency;
                      return (
                        <TableRow key={plan.id} className={index % 2 === 0 ? "" : "bg-muted/30"}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{plan.name}</p>
                              {plan.description && (
                                <p className="text-xs text-muted-foreground">{plan.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            ${plan.enrollmentFee.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono">
                            ${plan.tuitionAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{frequencyLabel}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {plan.installments}
                          </TableCell>
                          <TableCell className="text-center">
                            {plan.discountPercent > 0 ? (
                              <Badge className="bg-success/10 text-success">
                                {plan.discountPercent}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
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
                                <DropdownMenuItem onClick={() => handleOpenEditPlan(plan)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleOpenDeletePlan(plan)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* New Fee Type Dialog */}
        <Dialog open={feeTypeDialog} onOpenChange={setFeeTypeDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Nuevo Tipo de Cuota</DialogTitle>
              <DialogDescription>Crea un nuevo tipo de cuota para el sistema</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Ej: Matricula, Mensualidad, Transporte..."
                  value={feeTypeName}
                  onChange={(e) => setFeeTypeName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFeeTypeDialog(false)}>Cancelar</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleCreateFeeType} disabled={createFeeType.isPending}>
                {createFeeType.isPending ? "Creando..." : "Crear Tipo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New User Dialog */}
        <Dialog open={userDialog} onOpenChange={setUserDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nuevo Usuario</DialogTitle>
              <DialogDescription>Registra un nuevo usuario en el sistema</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Nombre completo"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contrasena *</label>
                <Input
                  type="password"
                  placeholder="Minimo 6 caracteres"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol *</label>
                <Select
                  value={userForm.role}
                  onValueChange={(val) => setUserForm({ ...userForm, role: val as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUserDialog(false)}>Cancelar</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleCreateUser} disabled={registerUser.isPending}>
                {registerUser.isPending ? "Registrando..." : "Registrar Usuario"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editUserDialog} onOpenChange={(open) => {
          setEditUserDialog(open);
          if (!open) setEditUserForm(null);
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>Modifica la informacion del usuario</DialogDescription>
            </DialogHeader>
            {editUserForm && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    placeholder="Nombre completo"
                    value={editUserForm.name}
                    onChange={(e) =>
                      setEditUserForm({ ...editUserForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={editUserForm.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol *</label>
                  <Select
                    value={editUserForm.role}
                    onValueChange={(val) =>
                      setEditUserForm({ ...editUserForm, role: val as UserRole })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Estado</label>
                    <p className="text-sm text-muted-foreground">
                      {editUserForm.active ? "El usuario esta activo" : "El usuario esta inactivo"}
                    </p>
                  </div>
                  <Switch
                    checked={editUserForm.active}
                    onCheckedChange={(checked) =>
                      setEditUserForm({ ...editUserForm, active: checked })
                    }
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditUserDialog(false);
                setEditUserForm(null);
              }}>
                Cancelar
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleSaveEditUser}
                disabled={updateUser.isPending}
              >
                {updateUser.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete (Deactivate) User AlertDialog */}
        <AlertDialog open={deleteUserDialog} onOpenChange={(open) => {
          setDeleteUserDialog(open);
          if (!open) setDeleteUserTarget(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desactivar Usuario</AlertDialogTitle>
              <AlertDialogDescription>
                Esta seguro de que desea desactivar al usuario{" "}
                <span className="font-semibold">{deleteUserTarget?.name}</span>? El usuario no
                podra acceder al sistema, pero su informacion se conservara.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleConfirmDeleteUser}
              >
                {updateUser.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Desactivando...
                  </>
                ) : (
                  "Desactivar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* New Sede Dialog */}
        <Dialog open={sedeDialog} onOpenChange={setSedeDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nueva Sede</DialogTitle>
              <DialogDescription>Registra una nueva sede en el sistema</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Nombre de la sede"
                  value={sedeForm.name}
                  onChange={(e) => setSedeForm({ ...sedeForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Direccion</label>
                <Input
                  placeholder="Direccion de la sede"
                  value={sedeForm.address}
                  onChange={(e) => setSedeForm({ ...sedeForm, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefono</label>
                <Input
                  placeholder="Telefono de contacto"
                  value={sedeForm.phone}
                  onChange={(e) => setSedeForm({ ...sedeForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Entidad *</label>
                <Select
                  value={sedeForm.organizationId ? String(sedeForm.organizationId) : ""}
                  onValueChange={(val) => setSedeForm({ ...sedeForm, organizationId: Number(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar entidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs && (orgs as Organization[]).map((org) => (
                      <SelectItem key={org.id} value={String(org.id)}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSedeDialog(false)}>Cancelar</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleCreateSede} disabled={createSede.isPending}>
                {createSede.isPending ? "Creando..." : "Crear Sede"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Payment Plan Dialog */}
        <Dialog open={planDialog} onOpenChange={setPlanDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo Plan de Pago</DialogTitle>
              <DialogDescription>Crea un nuevo plan de pago para asignar a estudiantes</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Plan Básico 2024"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Descripción</Label>
                  <Textarea
                    placeholder="Descripción del plan de pago"
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Matrícula *</Label>
                  <Input
                    type="number"
                    placeholder="200000"
                    value={planForm.enrollmentFee || ""}
                    onChange={(e) => setPlanForm({ ...planForm, enrollmentFee: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cuota *</Label>
                  <Input
                    type="number"
                    placeholder="150000"
                    value={planForm.tuitionAmount || ""}
                    onChange={(e) => setPlanForm({ ...planForm, tuitionAmount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frecuencia *</Label>
                  <Select
                    value={planForm.frequency}
                    onValueChange={(val) => setPlanForm({ ...planForm, frequency: val as PaymentFrequency })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número de Cuotas *</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={planForm.installments || ""}
                    onChange={(e) => setPlanForm({ ...planForm, installments: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Materiales</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={planForm.materialsCharge || ""}
                    onChange={(e) => setPlanForm({ ...planForm, materialsCharge: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Uniforme</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={planForm.uniformCharge || ""}
                    onChange={(e) => setPlanForm({ ...planForm, uniformCharge: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transporte</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={planForm.transportCharge || ""}
                    onChange={(e) => setPlanForm({ ...planForm, transportCharge: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descuento %</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={planForm.discountPercent || ""}
                    onChange={(e) => setPlanForm({ ...planForm, discountPercent: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setPlanDialog(false); resetPlanForm(); }}>
                Cancelar
              </Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleCreatePlan} disabled={createPlan.isPending}>
                {createPlan.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Plan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Payment Plan Dialog */}
        <Dialog open={editPlanDialog} onOpenChange={(open) => {
          setEditPlanDialog(open);
          if (!open) { resetPlanForm(); setEditingPlanId(null); }
        }}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Plan de Pago</DialogTitle>
              <DialogDescription>Modifica la información del plan de pago</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Plan Básico 2024"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Descripción</Label>
                  <Textarea
                    placeholder="Descripción del plan de pago"
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Matrícula *</Label>
                  <Input
                    type="number"
                    placeholder="200000"
                    value={planForm.enrollmentFee || ""}
                    onChange={(e) => setPlanForm({ ...planForm, enrollmentFee: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cuota *</Label>
                  <Input
                    type="number"
                    placeholder="150000"
                    value={planForm.tuitionAmount || ""}
                    onChange={(e) => setPlanForm({ ...planForm, tuitionAmount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frecuencia *</Label>
                  <Select
                    value={planForm.frequency}
                    onValueChange={(val) => setPlanForm({ ...planForm, frequency: val as PaymentFrequency })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número de Cuotas *</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={planForm.installments || ""}
                    onChange={(e) => setPlanForm({ ...planForm, installments: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Materiales</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={planForm.materialsCharge || ""}
                    onChange={(e) => setPlanForm({ ...planForm, materialsCharge: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Uniforme</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={planForm.uniformCharge || ""}
                    onChange={(e) => setPlanForm({ ...planForm, uniformCharge: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transporte</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={planForm.transportCharge || ""}
                    onChange={(e) => setPlanForm({ ...planForm, transportCharge: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descuento %</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={planForm.discountPercent || ""}
                    onChange={(e) => setPlanForm({ ...planForm, discountPercent: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditPlanDialog(false);
                resetPlanForm();
                setEditingPlanId(null);
              }}>
                Cancelar
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleSaveEditPlan}
                disabled={updatePlan.isPending}
              >
                {updatePlan.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Payment Plan AlertDialog */}
        <AlertDialog open={deletePlanDialog} onOpenChange={(open) => {
          setDeletePlanDialog(open);
          if (!open) setPlanToDelete(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Plan de Pago</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Está seguro de que desea eliminar el plan{" "}
                <span className="font-semibold">{planToDelete?.name}</span>? Esta acción no se puede
                deshacer y fallará si hay estudiantes asignados a este plan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleConfirmDeletePlan}
              >
                {deletePlan.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
