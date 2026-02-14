import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useStudent } from '@/hooks/useStudents';
import { useFees } from '@/hooks/useFees';
import { useStudentPlan, usePaymentPlans, useAssignPlanToStudent } from '@/hooks/usePaymentPlans';
import { ArrowLeft, Pencil, Banknote, Loader2, Calendar, DollarSign, Percent, AlertCircle } from 'lucide-react';
import type { PaymentFrequency } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function EstudianteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: student, isLoading } = useStudent(id ? parseInt(id) : null);
  const { data: feesData } = useFees({ studentId: id ? parseInt(id) : undefined });
  const { data: studentPlan } = useStudentPlan(id ? parseInt(id) : undefined);
  const { data: paymentPlans } = usePaymentPlans();
  const assignPlanMutation = useAssignPlanToStudent();

  const fees = feesData?.fees || [];

  // Assignment dialog state
  const [assignPlanDialog, setAssignPlanDialog] = useState(false);
  const [assignForm, setAssignForm] = useState({
    paymentPlanId: 0,
    customTuition: 0,
    customDiscount: 0,
    startDate: new Date().toISOString().split('T')[0],
  });

  // Helper to calculate preview
  const calculatePreview = () => {
    const selectedPlan = paymentPlans?.find((p) => p.id === assignForm.paymentPlanId);
    if (!selectedPlan) return null;

    const baseTuition = assignForm.customTuition > 0 ? assignForm.customTuition : selectedPlan.tuitionAmount;
    const discountPercent = assignForm.customDiscount > 0 ? assignForm.customDiscount : selectedPlan.discountPercent;
    const discountAmount = (baseTuition * discountPercent) / 100;
    const finalTuition = baseTuition - discountAmount;

    const totalCharges = selectedPlan.materialsCharge + selectedPlan.uniformCharge + selectedPlan.transportCharge;
    const totalTuition = finalTuition * selectedPlan.installments;
    const totalCost = selectedPlan.enrollmentFee + totalTuition + totalCharges;

    return {
      finalTuition,
      totalCost,
      discountAmount: discountAmount * selectedPlan.installments,
      installments: selectedPlan.installments,
      enrollmentFee: selectedPlan.enrollmentFee,
      totalCharges,
    };
  };

  // Handler to assign plan
  const handleAssignPlan = async () => {
    if (!id || assignForm.paymentPlanId === 0) {
      toast({ title: "Error", description: "Selecciona un plan de pago", variant: "destructive" });
      return;
    }

    try {
      await assignPlanMutation.mutateAsync({
        studentId: parseInt(id),
        paymentPlanId: assignForm.paymentPlanId,
        customTuition: assignForm.customTuition > 0 ? assignForm.customTuition : undefined,
        customDiscount: assignForm.customDiscount > 0 ? assignForm.customDiscount : undefined,
        startDate: new Date(assignForm.startDate),
      });

      const preview = calculatePreview();
      toast({
        title: "Plan Asignado",
        description: `Se generaron ${preview?.installments || 0} cuotas exitosamente`,
      });

      setAssignPlanDialog(false);
      setAssignForm({
        paymentPlanId: 0,
        customTuition: 0,
        customDiscount: 0,
        startDate: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!student) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Estudiante no encontrado</p>
          <Button className="mt-4" onClick={() => navigate('/estudiantes')}>
            Volver a Estudiantes
          </Button>
        </div>
      </MainLayout>
    );
  }

  const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPaid = fees.reduce((sum, fee) => sum + (fee.totalPaid || 0), 0);
  const totalBalance = totalFees - totalPaid;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/estudiantes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold">
                {student.name} {student.lastName}
              </h1>
              <p className="text-muted-foreground">
                {student.admissionNo} • {student.class?.name} {student.section?.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAssignPlanDialog(true)}
              className="bg-primary/10 text-primary hover:bg-primary/20"
            >
              <Banknote className="w-4 h-4 mr-2" />
              {studentPlan ? "Cambiar Plan" : "Asignar Plan"}
            </Button>
            <Button variant="outline">
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="personal">Información Personal</TabsTrigger>
            <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
            <TabsTrigger value="academico">Académico</TabsTrigger>
          </TabsList>

          {/* Tab: Personal Info */}
          <TabsContent value="personal" className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Datos Personales */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Datos Personales</h3>
                  <div className="space-y-2">
                    <InfoRow label="Género" value={student.gender} />
                    <InfoRow label="Fecha de Nacimiento"
                      value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("es-CO") : "-"}
                    />
                    <InfoRow label="Tipo Sangre" value={student.bloodGroup || "-"} />
                    <InfoRow label="Email" value={student.email || "-"} />
                    <InfoRow label="Teléfono" value={student.phone || "-"} />
                    <InfoRow label="Dirección" value={student.address || "-"} />
                  </div>
                </div>

                {/* Identificación */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Identificación</h3>
                  <div className="space-y-2">
                    <InfoRow label="Tipo ID" value={student.tipoIdentificacion || "-"} />
                    <InfoRow label="Número ID" value={student.numeroIdentificacion || "-"} />
                    <InfoRow label="Fecha Expedición"
                      value={student.fechaExpedicion ? new Date(student.fechaExpedicion).toLocaleDateString("es-CO") : "-"}
                    />
                  </div>
                </div>

                {/* Responsables */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-semibold">Responsables</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Padre</p>
                      <InfoRow label="Nombre" value={student.fatherName || "-"} />
                      <InfoRow label="Teléfono" value={student.fatherPhone || "-"} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Madre</p>
                      <InfoRow label="Nombre" value={student.motherName || "-"} />
                      <InfoRow label="Teléfono" value={student.motherPhone || "-"} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Acudiente</p>
                      <InfoRow label="Nombre" value={student.acudienteNombre || "-"} />
                      <InfoRow label="Teléfono" value={student.acudienteTelefono || "-"} />
                      <InfoRow label="Email" value={student.acudienteEmail || "-"} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Finanzas */}
          <TabsContent value="finanzas" className="space-y-4">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat-card">
                <p className="text-sm text-muted-foreground">Saldo Disponible</p>
                <p className="text-2xl font-bold font-mono text-success">
                  ${(student.balance || 0).toLocaleString("es-CO")}
                </p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-muted-foreground">Total Cuotas</p>
                <p className="text-2xl font-bold font-mono">
                  ${totalFees.toLocaleString("es-CO")}
                </p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-muted-foreground">Total Pagado</p>
                <p className="text-2xl font-bold font-mono text-success">
                  ${totalPaid.toLocaleString("es-CO")}
                </p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
                <p className="text-2xl font-bold font-mono text-destructive">
                  ${totalBalance.toLocaleString("es-CO")}
                </p>
              </div>
            </div>

            {/* Payment Plan Info */}
            {studentPlan ? (
              <div className="bg-card rounded-xl border border-success/20 p-6 shadow-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{studentPlan.paymentPlan.name}</h3>
                      <Badge className="bg-success/10 text-success">Activo</Badge>
                    </div>
                    {studentPlan.paymentPlan.description && (
                      <p className="text-sm text-muted-foreground">
                        {studentPlan.paymentPlan.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAssignPlanDialog(true)}
                  >
                    <Banknote className="w-4 h-4 mr-2" />
                    Cambiar
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Matrícula</p>
                    <p className="font-mono font-semibold">
                      ${studentPlan.paymentPlan.enrollmentFee.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Cuota</p>
                    <p className="font-mono font-semibold text-primary">
                      ${(studentPlan.customTuition || studentPlan.paymentPlan.tuitionAmount).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Frecuencia</p>
                    <Badge variant="secondary">
                      {getFrequencyLabel(studentPlan.paymentPlan.frequency)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Cuotas</p>
                    <p className="font-mono font-semibold">
                      {studentPlan.paymentPlan.installments}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Alert className="border-warning/50 bg-warning/10">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertDescription>
                  Este estudiante no tiene un plan de pago asignado.{" "}
                  <button
                    onClick={() => setAssignPlanDialog(true)}
                    className="font-semibold underline hover:text-primary"
                  >
                    Asignar plan ahora
                  </button>
                </AlertDescription>
              </Alert>
            )}

            {/* Fees Table */}
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Historial de Cuotas</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Tipo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Pagado</TableHead>
                    <TableHead>Pendiente</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay cuotas registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    fees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell>{fee.feeType?.name}</TableCell>
                        <TableCell className="font-mono">
                          ${fee.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-success">
                          ${(fee.totalPaid || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-destructive">
                          ${((fee.balance ?? (fee.amount - (fee.totalPaid || 0)))).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(fee.dueDate).toLocaleDateString("es-CO")}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(fee.status)}>
                            {getStatusLabel(fee.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tab: Académico */}
          <TabsContent value="academico" className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Curso" value={student.class?.name || "-"} />
                <InfoRow label="Sección" value={student.section?.name || "-"} />
                <InfoRow label="Sede" value={student.sede?.name || "-"} />
                <InfoRow label="Fecha Matrícula"
                  value={new Date(student.enrollmentDate).toLocaleDateString("es-CO")}
                />
                <InfoRow label="Estado" value={
                  <Badge className={getStatusColor(student.status)}>
                    {getStatusLabel(student.status)}
                  </Badge>
                } />
                {student.exalumno && (
                  <InfoRow label="Fecha Salida"
                    value={student.fechaSalida ? new Date(student.fechaSalida).toLocaleDateString("es-CO") : "-"}
                  />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Assign Payment Plan Dialog */}
        <Dialog open={assignPlanDialog} onOpenChange={setAssignPlanDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {studentPlan ? "Cambiar Plan de Pago" : "Asignar Plan de Pago"}
              </DialogTitle>
              <DialogDescription>
                {studentPlan
                  ? "Selecciona un nuevo plan. El plan anterior será desactivado automáticamente."
                  : "Selecciona un plan de pago y configura los parámetros para el estudiante."}
              </DialogDescription>
            </DialogHeader>

            {/* Warning if student already has a plan */}
            {studentPlan && (
              <Alert className="border-warning/50 bg-warning/10">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertDescription>
                  El estudiante tiene actualmente el plan <strong>{studentPlan.paymentPlan.name}</strong>.
                  Al asignar un nuevo plan, el anterior será desactivado y se generarán nuevas cuotas.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              {/* Plan Selection */}
              <div className="space-y-2">
                <Label>Plan de Pago *</Label>
                <Select
                  value={assignForm.paymentPlanId ? String(assignForm.paymentPlanId) : ""}
                  onValueChange={(val) =>
                    setAssignForm({ ...assignForm, paymentPlanId: Number(val) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentPlans?.map((plan) => (
                      <SelectItem key={plan.id} value={String(plan.id)}>
                        {plan.name} - ${plan.tuitionAmount.toLocaleString()} (
                        {getFrequencyLabel(plan.frequency)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Tuition (Optional) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  Cuota Personalizada (Opcional)
                </Label>
                <Input
                  type="number"
                  placeholder="Dejar en 0 para usar la cuota del plan"
                  value={assignForm.customTuition || ""}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, customTuition: Number(e.target.value) })
                  }
                />
              </div>

              {/* Custom Discount (Optional) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-muted-foreground" />
                  Descuento Personalizado % (Opcional)
                </Label>
                <Input
                  type="number"
                  placeholder="Dejar en 0 para usar el descuento del plan"
                  min="0"
                  max="100"
                  value={assignForm.customDiscount || ""}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, customDiscount: Number(e.target.value) })
                  }
                />
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Fecha de Inicio *
                </Label>
                <Input
                  type="date"
                  value={assignForm.startDate}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, startDate: e.target.value })
                  }
                />
              </div>

              {/* Preview Section */}
              {assignForm.paymentPlanId > 0 && (() => {
                const preview = calculatePreview();
                if (!preview) return null;

                return (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Vista Previa de Costos
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Matrícula</p>
                        <p className="font-mono font-semibold">
                          ${preview.enrollmentFee.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Cuota Final</p>
                        <p className="font-mono font-semibold text-primary">
                          ${preview.finalTuition.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Número de Cuotas</p>
                        <p className="font-mono font-semibold">{preview.installments}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Otros Cargos</p>
                        <p className="font-mono font-semibold">
                          ${preview.totalCharges.toLocaleString()}
                        </p>
                      </div>
                      {preview.discountAmount > 0 && (
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Descuento Total</p>
                          <p className="font-mono font-semibold text-success">
                            -${preview.discountAmount.toLocaleString()}
                          </p>
                        </div>
                      )}
                      <div className="space-y-1 col-span-2 pt-2 border-t border-border">
                        <p className="text-muted-foreground">Costo Total</p>
                        <p className="font-mono font-bold text-lg">
                          ${preview.totalCost.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                      Se generarán{" "}
                      <span className="font-semibold">{preview.installments + 1}</span> cuotas:
                      1 de matrícula + {preview.installments} de mensualidad
                      {preview.totalCharges > 0 && " + cargos adicionales"}
                    </div>
                  </div>
                );
              })()}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAssignPlanDialog(false);
                  setAssignForm({
                    paymentPlanId: 0,
                    customTuition: 0,
                    customDiscount: 0,
                    startDate: new Date().toISOString().split('T')[0],
                  });
                }}
              >
                Cancelar
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleAssignPlan}
                disabled={assignForm.paymentPlanId === 0 || assignPlanMutation.isPending}
              >
                {assignPlanMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Asignando...
                  </>
                ) : (
                  <>{studentPlan ? "Cambiar Plan" : "Asignar Plan"}</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

// Helper component
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function getFrequencyLabel(frequency: string) {
  const labels: Record<string, string> = {
    WEEKLY: 'Semanal',
    BIWEEKLY: 'Quincenal',
    MONTHLY: 'Mensual',
    QUARTERLY: 'Trimestral',
    YEARLY: 'Anual',
  };
  return labels[frequency] || frequency;
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PAID: 'bg-success/10 text-success',
    PARTIAL: 'bg-warning/10 text-warning',
    PENDING: 'bg-secondary/10 text-secondary',
    OVERDUE: 'bg-destructive/10 text-destructive',
    active: 'bg-success/10 text-success',
    inactive: 'bg-secondary/10 text-secondary',
  };
  return colors[status] || '';
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PAID: 'Pagado',
    PARTIAL: 'Parcial',
    PENDING: 'Pendiente',
    OVERDUE: 'Vencido',
    active: 'Activo',
    inactive: 'Inactivo',
  };
  return labels[status] || status;
}
