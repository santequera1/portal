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
import { useFees, useCreatePayment, useFeeTypes, useDeleteFee, useUpdateFeeStatus } from '@/hooks/useFees';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useStudentPlan, usePaymentPlans, useAssignPlanToStudent } from '@/hooks/usePaymentPlans';
import { useDeleteReceipt } from '@/hooks/useReceipts';
import { ArrowLeft, Pencil, Banknote, Loader2, Calendar, DollarSign, Percent, AlertCircle, Clock, FileText, Printer, Receipt as ReceiptIcon, ChevronDown, ChevronUp, CreditCard, Trash2, Download } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import type { PaymentFrequency, Fee } from '@/types';
import { Progress } from '@/components/ui/progress';
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

  const createPaymentMutation = useCreatePayment();
  const deleteFee = useDeleteFee();
  const updateFeeStatus = useUpdateFeeStatus();
  const deleteReceipt = useDeleteReceipt();
  const { data: feeTypes } = useFeeTypes();
  const { user } = useAuth();
  const canDeleteFees = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';
  const [receiptToDelete, setReceiptToDelete] = useState<any>(null);

  const fees = (student?.fees || feesData?.fees || []) as Fee[];
  const [receiptDialog, setReceiptDialog] = useState<any>(null);
  const [expandedFees, setExpandedFees] = useState(false);
  const [deleteFeeDialogOpen, setDeleteFeeDialogOpen] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<Fee | null>(null);

  // Payment dialog state
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentFeeId, setPaymentFeeId] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'CASH',
    reference: '',
  });

  // Get pending fees for payment selection
  const pendingFees = fees.filter((f: any) => f.status !== 'PAID');

  const handleRegisterPayment = async () => {
    if (!paymentFeeId || !paymentForm.amount || !id) {
      toast({ title: "Error", description: "Selecciona una cuota y monto", variant: "destructive" });
      return;
    }
    try {
      const fee = fees.find((f: any) => f.id === paymentFeeId) as any;
      await createPaymentMutation.mutateAsync({
        feeId: paymentFeeId,
        studentId: parseInt(id),
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference || undefined,
      });
      toast({ title: "Pago Registrado", description: `Pago de $${parseFloat(paymentForm.amount).toLocaleString("es-CO")} registrado` });
      setPaymentDialog(false);
      setPaymentFeeId(null);
      setPaymentForm({ amount: '', method: 'CASH', reference: '' });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

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

  const fs = student?.financialSummary;
  const totalFees = fs?.totalFees || fees.reduce((sum: number, fee: any) => sum + fee.amount, 0);
  const totalPaid = fs?.totalPaid || fees.reduce((sum: number, fee: any) => {
    const paid = fee.payments?.reduce((s: number, p: any) => s + p.amount, 0) || fee.totalPaid || 0;
    return sum + paid;
  }, 0);
  const totalBalance = totalFees - totalPaid;
  const paymentProgress = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0;

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
                {student.admissionNo} • {student.class?.name} • {student.section?.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setPaymentDialog(true)}
              className="bg-success hover:bg-success/90 text-white"
              disabled={pendingFees.length === 0}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Registrar Pago
            </Button>
            <Button
              variant="outline"
              onClick={() => setAssignPlanDialog(true)}
              className="bg-primary/10 text-primary hover:bg-primary/20"
            >
              <Banknote className="w-4 h-4 mr-2" />
              {studentPlan ? "Cambiar Plan" : "Asignar Plan"}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="stat-card">
                <p className="text-sm text-muted-foreground">Total a Pagar</p>
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
                <p className="text-sm text-muted-foreground">Pendiente</p>
                <p className="text-2xl font-bold font-mono text-destructive">
                  ${totalBalance.toLocaleString("es-CO")}
                </p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-muted-foreground">Saldo a Favor</p>
                <p className="text-2xl font-bold font-mono text-primary">
                  ${(student.balance || 0).toLocaleString("es-CO")}
                </p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-muted-foreground">Progreso</p>
                <p className="text-2xl font-bold font-mono">
                  {paymentProgress.toFixed(0)}%
                </p>
                <Progress value={paymentProgress} className="mt-2 h-2" />
              </div>
            </div>

            {/* Next Payment Alert */}
            {fs?.nextPaymentDue && (
              <div className="bg-card rounded-xl border border-primary/20 p-4 shadow-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Próximo Pago</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(fs.nextPaymentDue).toLocaleDateString("es-CO", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold font-mono text-primary">
                  ${fs.nextPaymentAmount.toLocaleString("es-CO")}
                </p>
              </div>
            )}

            {/* Concept Breakdown */}
            {fs?.conceptBreakdown && fs.conceptBreakdown.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h3 className="font-semibold text-lg mb-4">Desglose por Concepto</h3>
                <div className="space-y-4">
                  {fs.conceptBreakdown.map((concept) => {
                    const progress = concept.total > 0 ? (concept.paid / concept.total) * 100 : 0;
                    return (
                      <div key={concept.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{concept.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {concept.count} {concept.count === 1 ? 'cuota' : 'cuotas'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm font-mono">
                            <span className="text-success">${concept.paid.toLocaleString("es-CO")}</span>
                            <span className="text-muted-foreground">/</span>
                            <span>${concept.total.toLocaleString("es-CO")}</span>
                          </div>
                        </div>
                        <Progress value={progress} className="h-2" />
                        {concept.pending > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Falta: <span className="text-destructive font-mono">${concept.pending.toLocaleString("es-CO")}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fees Table */}
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Historial de Cuotas</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedFees(!expandedFees)}
                >
                  {expandedFees ? (
                    <><ChevronUp className="w-4 h-4 mr-1" /> Colapsar</>
                  ) : (
                    <><ChevronDown className="w-4 h-4 mr-1" /> Ver todas ({fees.length})</>
                  )}
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Mes</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Pagado</TableHead>
                    <TableHead>Pendiente</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    {canDeleteFees && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canDeleteFees ? 8 : 7} className="text-center py-8 text-muted-foreground">
                        No hay cuotas registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    (expandedFees ? fees : fees.slice(0, 5)).map((fee: any) => {
                      const feePaid = fee.payments?.reduce((s: number, p: any) => s + p.amount, 0) || fee.totalPaid || 0;
                      const feePending = fee.amount - feePaid;
                      return (
                        <TableRow key={fee.id} className={fee.status === 'PAID' ? 'opacity-60' : ''}>
                          <TableCell className="text-muted-foreground text-xs capitalize">
                            {fee.installmentNumber && fee.installmentNumber > 0
                              ? new Date(fee.dueDate).toLocaleDateString("es-CO", { month: 'long' })
                              : '-'}
                          </TableCell>
                          <TableCell>{fee.feeType?.name}</TableCell>
                          <TableCell className="font-mono">
                            ${fee.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-success">
                            ${feePaid.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-destructive">
                            ${feePending.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(fee.dueDate).toLocaleDateString("es-CO")}
                          </TableCell>
                          <TableCell>
                            {canDeleteFees ? (
                              <Select
                                value={fee.status}
                                onValueChange={async (newStatus: string) => {
                                  try {
                                    await updateFeeStatus.mutateAsync({ feeId: fee.id, status: newStatus });
                                    toast({ title: "Estado actualizado" });
                                  } catch (err: any) {
                                    toast({ title: "Error", description: err.message, variant: "destructive" });
                                  }
                                }}
                              >
                                <SelectTrigger className="h-7 w-[130px] text-xs">
                                  <Badge className={getStatusColor(fee.status)}>
                                    {getStatusLabel(fee.status)}
                                  </Badge>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PAID">Pagado</SelectItem>
                                  <SelectItem value="PARTIAL">Parcial/Abono</SelectItem>
                                  <SelectItem value="PENDING">Pendiente</SelectItem>
                                  <SelectItem value="OVERDUE">Vencido</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge className={getStatusColor(fee.status)}>
                                {getStatusLabel(fee.status)}
                              </Badge>
                            )}
                          </TableCell>
                          {canDeleteFees && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setFeeToDelete(fee);
                                  setDeleteFeeDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Receipts Section */}
            {student.receipts && student.receipts.length > 0 && (
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <ReceiptIcon className="w-4 h-4" />
                  <h3 className="font-semibold">Recibos de Pago</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Nº Recibo</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.receipts.map((receipt: any) => (
                      <TableRow key={receipt.id}>
                        <TableCell className="font-mono text-sm">
                          {receipt.receiptNumber}
                        </TableCell>
                        <TableCell>{receipt.concept}</TableCell>
                        <TableCell className="font-mono">
                          ${receipt.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(receipt.date).toLocaleDateString("es-CO")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReceiptDialog(receipt)}
                            >
                              <Printer className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            {canDeleteFees && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setReceiptToDelete(receipt)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Tab: Académico */}
          <TabsContent value="academico" className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Programa ETDH" value={student.class?.name || "-"} />
                <InfoRow label="Semestre" value={student.section?.name || "-"} />
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

        {/* Register Payment Dialog */}
        <Dialog open={paymentDialog} onOpenChange={(open) => {
          setPaymentDialog(open);
          if (!open) {
            setPaymentFeeId(null);
            setPaymentForm({ amount: '', method: 'CASH', reference: '' });
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Registrar Pago
              </DialogTitle>
              <DialogDescription>
                {student.name} {student.lastName} - {student.class?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Fee selection */}
              <div className="space-y-2">
                <Label>Cuota a Pagar *</Label>
                <Select
                  value={paymentFeeId ? String(paymentFeeId) : ""}
                  onValueChange={(val) => {
                    const feeId = Number(val);
                    setPaymentFeeId(feeId);
                    const fee = fees.find((f: any) => f.id === feeId) as any;
                    if (fee) {
                      const paid = fee.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0;
                      const pending = fee.amount - paid;
                      setPaymentForm(prev => ({ ...prev, amount: String(pending) }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuota pendiente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingFees.map((fee: any) => {
                      const paid = fee.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0;
                      const pending = fee.amount - paid;
                      return (
                        <SelectItem key={fee.id} value={String(fee.id)}>
                          {fee.feeType?.name}
                          {fee.installmentNumber && fee.installmentNumber > 0
                            ? ` (${new Date(fee.dueDate).toLocaleDateString("es-CO", { month: 'long' })})`
                            : ''} -
                          ${pending.toLocaleString()} pendiente -
                          Vence: {new Date(fee.dueDate).toLocaleDateString("es-CO")}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Monto a Pagar *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
              </div>

              {/* Payment method */}
              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select
                  value={paymentForm.method}
                  onValueChange={(val) => setPaymentForm({ ...paymentForm, method: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Efectivo</SelectItem>
                    <SelectItem value="TRANSFER">Transferencia</SelectItem>
                    <SelectItem value="CHECK">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label>Referencia (opcional)</Label>
                <Input
                  placeholder="Nº de transferencia, cheque, etc."
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialog(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-success hover:bg-success/90"
                onClick={handleRegisterPayment}
                disabled={!paymentFeeId || !paymentForm.amount || createPaymentMutation.isPending}
              >
                {createPaymentMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registrando...</>
                ) : (
                  "Registrar Pago"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receipt Print Dialog */}
        <Dialog open={!!receiptDialog} onOpenChange={() => setReceiptDialog(null)}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Recibo de Pago</DialogTitle>
            </DialogHeader>
            {receiptDialog && (() => {
              const orgName = student.organization?.name || 'Institución Educativa';
              const isFoundisalud = orgName.toLowerCase().includes('fundisalud');
              const licencias = isFoundisalud
                ? 'Licencia de funcionamiento #1408 del 13 de abril del 2021'
                : 'Licencia #0689 del 12 de abril del 2023 | Licencia #3276 del 02 de diciembre del 2024';
              const reference = receiptDialog.payment?.reference || receiptDialog.notes || '';

              return (
              <div id="receipt-print-area" style={{ background: 'white' }}>
                {/* Header with gradient */}
                <div style={{ background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 50%, #1E88E5 100%)' }} className="px-6 pt-6 pb-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: '#F9A825', transform: 'translate(30%, -30%)' }} />
                  <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10" style={{ background: '#F9A825', transform: 'translate(-30%, 30%)' }} />
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <img src="/logo-horizontal.png" alt="Logo" className="h-10 object-contain" />
                  </div>
                  <div className="relative z-10">
                    <h2 className="text-lg font-bold tracking-widest uppercase">{orgName}</h2>
                    {isFoundisalud && (
                      <p className="text-blue-100 text-[11px] mt-0.5 italic">Fundación integral para la enseñanza y la salud</p>
                    )}
                    <p className="text-blue-100 text-xs mt-0.5">Cartagena - Arjona</p>
                    <p className="text-blue-200 text-[9px] mt-1 leading-tight opacity-80">{licencias}</p>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 pt-4 pb-6 space-y-5">
                  {/* Receipt number badge */}
                  <div className="flex justify-end -mt-4 mb-1">
                    <div className="px-4 py-1.5 rounded-full font-mono text-sm font-bold shadow-lg" style={{ background: '#F9A825', color: '#1565C0' }}>
                      {receiptDialog.receiptNumber}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(receiptDialog.date).toLocaleDateString("es-CO", {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#1565C020', background: '#1565C005' }}>
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                      <span className="text-muted-foreground font-medium">Estudiante</span>
                      <span className="font-semibold">{student.name} {student.lastName || ''}</span>
                      <span className="text-muted-foreground font-medium">Identificación</span>
                      <span className="font-mono">{student.numeroIdentificacion || student.admissionNo}</span>
                      <span className="text-muted-foreground font-medium">Programa</span>
                      <span>{student.class?.name || '-'}</span>
                    </div>
                  </div>

                  {/* Concept + method + reference */}
                  <div className="rounded-xl border p-4" style={{ borderColor: '#F9A82530', background: '#F9A82508' }}>
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Concepto</p>
                    <p className="font-semibold text-base">{receiptDialog.concept}</p>
                    {receiptDialog.payment?.method && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {getMethodLabel(receiptDialog.payment.method)}
                      </p>
                    )}
                    {reference && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">Ref:</span> {reference}
                      </p>
                    )}
                  </div>

                  {/* Total */}
                  <div className="rounded-xl p-5 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #F9A825 0%, #F57F17 100%)' }}>
                    <p className="text-yellow-900/70 text-xs uppercase tracking-widest mb-1 font-medium">Total Pagado</p>
                    <p className="text-3xl font-bold font-mono text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                      ${receiptDialog.amount.toLocaleString("es-CO")}
                    </p>
                  </div>

                  {receiptDialog.notes && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <span className="font-medium">Nota:</span> {receiptDialog.notes}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="text-center pt-3 border-t space-y-1">
                    <p className="text-[10px] text-muted-foreground">Documento generado electrónicamente</p>
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-6 h-0.5 rounded-full" style={{ background: '#F9A825' }} />
                      <div className="w-6 h-0.5 rounded-full" style={{ background: '#1565C0' }} />
                      <div className="w-6 h-0.5 rounded-full" style={{ background: '#F9A825' }} />
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}
            <div className="flex justify-end gap-2 px-6 pb-4 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setReceiptDialog(null)}>
                Cerrar
              </Button>
              <Button
                size="sm"
                style={{ background: '#1565C0' }}
                onClick={async () => {
                  const el = document.getElementById('receipt-print-area');
                  if (!el) return;
                  try {
                    const canvas = await html2canvas(el, {
                      scale: 2,
                      useCORS: true,
                      backgroundColor: '#ffffff',
                    });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const imgWidth = pdfWidth - 20;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
                    pdf.save(`Recibo-${receiptDialog?.receiptNumber}.pdf`);
                  } catch (err) {
                    console.error('Error generating PDF:', err);
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                PDF Color
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!receiptDialog) return;
                  const orgName = student.organization?.name || 'Institución Educativa';
                  const isFundi = orgName.toLowerCase().includes('fundisalud');
                  const subtitle = isFundi ? 'Fundación integral para la enseñanza y la salud' : '';
                  const lics = isFundi
                    ? 'Licencia de funcionamiento #1408 del 13 de abril del 2021'
                    : 'Licencia #0689 del 12 de abril del 2023 | Licencia #3276 del 02 de diciembre del 2024';
                  const studentName = `${student.name} ${student.lastName || ''}`;
                  const studentDoc = student.numeroIdentificacion || student.admissionNo;
                  const programa = student.class?.name || '-';
                  const semestre = student.section?.name || '';
                  const dateStr = new Date(receiptDialog.date).toLocaleDateString("es-CO", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                  const method = receiptDialog.payment?.method ? getMethodLabel(receiptDialog.payment.method) : '';
                  const ref = receiptDialog.payment?.reference || receiptDialog.notes || '';
                  const amount = `$${receiptDialog.amount.toLocaleString("es-CO")}`;

                  const receiptBlock = (copyLabel: string) => `
                    <div class="receipt">
                      <div class="header">
                        <img src="/logo-horizontal.png" class="logo" alt="Logo">
                        <div class="header-text">
                          <div class="org-name">${orgName.toUpperCase()}</div>
                          ${subtitle ? `<div class="org-subtitle">${subtitle}</div>` : ''}
                          <div class="org-addr">Cartagena - Arjona</div>
                          <div class="org-lic">${lics}</div>
                        </div>
                        <div class="receipt-num">${receiptDialog.receiptNumber}</div>
                      </div>
                      <div class="body">
                        <div class="copy-label">${copyLabel}</div>
                        <div class="date">${dateStr}</div>
                        <div class="info-grid">
                          <span class="lbl">Estudiante</span><span class="val">${studentName}</span>
                          <span class="lbl">Identificación</span><span class="val mono">${studentDoc}</span>
                          <span class="lbl">Programa</span><span class="val">${programa}</span>
                          ${semestre ? `<span class="lbl">Semestre</span><span class="val">${semestre}</span>` : ''}
                        </div>
                        <div class="concept-row">
                          <span class="lbl">Concepto</span>
                          <span class="val-concept">${receiptDialog.concept}</span>
                        </div>
                        ${method ? `<div class="detail-row"><span class="lbl">Método</span><span class="val">${method}</span></div>` : ''}
                        ${ref ? `<div class="detail-row"><span class="lbl">Referencia</span><span class="val">${ref}</span></div>` : ''}
                        <div class="total-row">
                          <span>TOTAL PAGADO</span>
                          <span class="total-amount">${amount}</span>
                        </div>
                        <div class="signature-area">
                          <div class="sig-line"><div class="line"></div><span>Firma Estudiante</span></div>
                          <div class="sig-line"><div class="line"></div><span>Firma Autorizada</span></div>
                        </div>
                      </div>
                    </div>`;

                  const w = window.open('', '_blank');
                  if (!w) return;
                  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recibo ${receiptDialog.receiptNumber}</title>
<style>
  @page { size: letter; margin: 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  .page { width: 100%; }
  .receipt { border: 1px solid #ccc; margin-bottom: 8mm; page-break-inside: avoid; }
  .header { background: linear-gradient(135deg, #1565C0 0%, #1976D2 50%, #1E88E5 100%); color: white; padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
  .logo { height: 32px; flex-shrink: 0; }
  .header-text { flex: 1; }
  .org-name { font-size: 14px; font-weight: 800; letter-spacing: 1.5px; }
  .org-subtitle { font-size: 9px; opacity: 0.85; font-style: italic; }
  .org-addr { font-size: 10px; opacity: 0.8; }
  .org-lic { font-size: 8px; opacity: 0.7; margin-top: 1px; }
  .receipt-num { background: #F9A825; color: #1565C0; font-family: 'Courier New', monospace; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 12px; white-space: nowrap; }
  .body { padding: 10px 16px 12px; color: #000; }
  .copy-label { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #999; text-align: right; margin-bottom: 2px; }
  .date { font-size: 11px; color: #555; margin-bottom: 8px; }
  .info-grid { display: grid; grid-template-columns: 100px 1fr; gap: 2px 8px; font-size: 11px; margin-bottom: 8px; padding: 6px; border: 1px solid #e0e0e0; border-radius: 4px; }
  .lbl { color: #666; font-weight: 500; font-size: 10px; }
  .val { font-weight: 600; font-size: 11px; }
  .val.mono { font-family: 'Courier New', monospace; }
  .concept-row { font-size: 11px; margin-bottom: 4px; padding: 6px; border: 1px solid #e0e0e0; border-radius: 4px; }
  .val-concept { font-weight: 700; font-size: 12px; display: block; margin-top: 2px; }
  .detail-row { display: flex; gap: 8px; font-size: 10px; margin-bottom: 2px; padding: 0 6px; }
  .total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding: 8px 12px; border: 2px solid #333; border-radius: 4px; font-weight: 700; font-size: 12px; }
  .total-amount { font-family: 'Courier New', monospace; font-size: 16px; }
  .signature-area { display: flex; justify-content: space-between; margin-top: 16px; gap: 20px; }
  .sig-line { flex: 1; text-align: center; }
  .sig-line .line { border-top: 1px solid #333; margin-bottom: 3px; margin-top: 24px; }
  .sig-line span { font-size: 9px; color: #555; }
  .separator { border: none; border-top: 1px dashed #aaa; margin: 0; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head><body>
<div class="page">
  ${receiptBlock('Copia Estudiante')}
  <hr class="separator">
  ${receiptBlock('Copia Institución')}
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`);
                  w.document.close();
                }}
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir x2 (Carta)
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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

      {/* Delete Fee Confirmation Dialog */}
      <AlertDialog open={deleteFeeDialogOpen} onOpenChange={setDeleteFeeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la cuota de {feeToDelete?.feeType?.name} por ${feeToDelete?.amount?.toLocaleString()}. Esta acción no se puede deshacer.
              {feeToDelete?.payments && feeToDelete.payments.length > 0 && (
                <span className="block text-destructive font-medium mt-2">
                  Se eliminarán también {feeToDelete.payments.length} pago(s) y sus recibos asociados.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!feeToDelete) return;
                try {
                  await deleteFee.mutateAsync(feeToDelete.id);
                  toast({ title: "Cuota eliminada exitosamente" });
                  setFeeToDelete(null);
                } catch (error: any) {
                  toast({
                    title: "Error al eliminar",
                    description: error.message || "No se pudo eliminar la cuota",
                    variant: "destructive"
                  });
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Receipt AlertDialog */}
      <AlertDialog open={!!receiptToDelete} onOpenChange={(open) => { if (!open) setReceiptToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar recibo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el recibo {receiptToDelete?.receiptNumber} por ${receiptToDelete?.amount?.toLocaleString()}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!receiptToDelete) return;
                try {
                  await deleteReceipt.mutateAsync(receiptToDelete.id);
                  toast({ title: "Recibo eliminado exitosamente" });
                  setReceiptToDelete(null);
                } catch (error: any) {
                  toast({
                    title: "Error al eliminar",
                    description: error.message || "No se pudo eliminar el recibo",
                    variant: "destructive"
                  });
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    PARTIAL: 'Parcial/Abono',
    PENDING: 'Pendiente',
    OVERDUE: 'Vencido',
    active: 'Activo',
    inactive: 'Inactivo',
  };
  return labels[status] || status;
}

function getMethodLabel(method: string) {
  const labels: Record<string, string> = {
    CASH: 'Efectivo',
    TRANSFER: 'Transferencia',
    CHECK: 'Cheque',
    BALANCE: 'Saldo',
  };
  return labels[method] || method;
}
