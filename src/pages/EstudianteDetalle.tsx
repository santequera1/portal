import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudent } from '@/hooks/useStudents';
import { useFees } from '@/hooks/useFees';
import { useStudentPlan } from '@/hooks/usePaymentPlans';
import { ArrowLeft, Pencil } from 'lucide-react';
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

  const { data: student, isLoading } = useStudent(id ? parseInt(id) : null);
  const { data: feesData } = useFees({ studentId: id ? parseInt(id) : undefined });
  const { data: studentPlan } = useStudentPlan(id ? parseInt(id) : undefined);

  const fees = feesData?.fees || [];

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
            {studentPlan && (
              <div className="bg-card rounded-xl border border-border p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Plan de Pago Activo</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {studentPlan.paymentPlan.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Cuota</p>
                    <p className="font-mono font-bold">
                      ${(studentPlan.customTuition || studentPlan.paymentPlan.tuitionAmount).toLocaleString()}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {getFrequencyLabel(studentPlan.paymentPlan.frequency)}
                    </Badge>
                  </div>
                </div>
              </div>
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
