import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useAttendance,
  useSubmitAttendance,
  useAttendanceSummary,
} from "@/hooks/useAttendance";
import { useClasses, useSections } from "@/hooks/useClasses";
import {
  ClipboardCheck,
  Save,
  BarChart3,
  Users,
} from "lucide-react";
import type { AttendanceStatus } from "@/types";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "PRESENT", label: "Presente", color: "bg-success/10 text-success" },
  { value: "ABSENT", label: "Ausente", color: "bg-destructive/10 text-destructive" },
  { value: "LATE", label: "Tarde", color: "bg-warning/10 text-warning" },
  { value: "HALF_DAY", label: "Medio Dia", color: "bg-secondary/10 text-secondary" },
];

export default function Asistencia() {
  const { toast } = useToast();

  // Take attendance state
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(undefined);
  const [selectedSectionId, setSelectedSectionId] = useState<number | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<number, AttendanceStatus>
  >({});

  // Report state
  const [reportClassId, setReportClassId] = useState<number | undefined>(undefined);
  const [reportSectionId, setReportSectionId] = useState<number | undefined>(undefined);
  const [reportMonth, setReportMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // Queries
  const { data: classes } = useClasses();
  const { data: sections } = useSections(selectedClassId);
  const { data: reportSections } = useSections(reportClassId);

  const { data: attendanceData, isLoading: attendanceLoading } = useAttendance({
    sectionId: selectedSectionId,
    date: selectedDate,
  });

  const { data: summaryData, isLoading: summaryLoading } = useAttendanceSummary({
    sectionId: reportSectionId,
    month: reportMonth,
  });

  const submitAttendance = useSubmitAttendance();

  // Initialize attendance records when data loads
  useEffect(() => {
    if (attendanceData?.students) {
      const initial: Record<number, AttendanceStatus> = {};
      attendanceData.students.forEach((student) => {
        const existing = attendanceData.attendances?.find(
          (a) => a.studentId === student.id
        );
        initial[student.id] = existing?.status || "PRESENT";
      });
      setAttendanceRecords(initial);
    }
  }, [attendanceData]);

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSectionId || !selectedDate) {
      toast({ title: "Error", description: "Selecciona curso, seccion y fecha", variant: "destructive" });
      return;
    }

    const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
      studentId: Number(studentId),
      status,
    }));

    try {
      await submitAttendance.mutateAsync({
        sectionId: selectedSectionId,
        date: selectedDate,
        records,
      });
      toast({ title: "Guardado", description: "La asistencia ha sido registrada exitosamente" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo guardar la asistencia", variant: "destructive" });
    }
  };

  const studentsReady = selectedClassId && selectedSectionId && selectedDate;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Asistencia
            </h1>
            <p className="text-muted-foreground mt-1">
              Registra y consulta la asistencia de los estudiantes
            </p>
          </div>
        </div>

        <Tabs defaultValue="take" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="take">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Tomar Asistencia
            </TabsTrigger>
            <TabsTrigger value="report">
              <BarChart3 className="w-4 h-4 mr-2" />
              Reporte
            </TabsTrigger>
          </TabsList>

          {/* Take Attendance Tab */}
          <TabsContent value="take" className="space-y-4">
            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 shadow-card">
              <div className="flex flex-col md:flex-row gap-4">
                <Select
                  value={selectedClassId ? String(selectedClassId) : ""}
                  onValueChange={(val) => {
                    setSelectedClassId(Number(val));
                    setSelectedSectionId(undefined);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[250px]">
                    <SelectValue placeholder="Seleccionar Curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes && classes.filter(c => c.category !== 'TECNICA').length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Primaria y Bachillerato</SelectLabel>
                        {classes.filter(c => c.category !== 'TECNICA').map((cls) => (
                          <SelectItem key={cls.id} value={String(cls.id)}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {classes && classes.filter(c => c.category === 'TECNICA').length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Carreras Tecnicas</SelectLabel>
                        {classes.filter(c => c.category === 'TECNICA').map((cls) => (
                          <SelectItem key={cls.id} value={String(cls.id)}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedSectionId ? String(selectedSectionId) : ""}
                  onValueChange={(val) => setSelectedSectionId(Number(val))}
                  disabled={!selectedClassId}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Seleccionar Seccion" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections?.map((sec) => (
                      <SelectItem key={sec.id} value={String(sec.id)}>
                        {sec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  className="w-full md:w-[200px]"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            {/* Attendance Table */}
            {studentsReady && (
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold w-[50px]">#</TableHead>
                      <TableHead className="font-semibold">Estudiante</TableHead>
                      <TableHead className="font-semibold">No. Admision</TableHead>
                      <TableHead className="font-semibold text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 4 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : !attendanceData?.students || attendanceData.students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            No hay estudiantes en esta seccion
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendanceData.students.map((student, index) => (
                        <TableRow
                          key={student.id}
                          className={index % 2 === 0 ? "" : "bg-muted/30"}
                        >
                          <TableCell className="font-mono text-sm">{index + 1}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell className="font-mono text-sm">{student.admissionNo}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              {STATUS_OPTIONS.map((option) => (
                                <label
                                  key={option.value}
                                  className="flex items-center gap-1 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name={`attendance-${student.id}`}
                                    value={option.value}
                                    checked={attendanceRecords[student.id] === option.value}
                                    onChange={() => handleStatusChange(student.id, option.value)}
                                    className="sr-only"
                                  />
                                  <Badge
                                    className={`cursor-pointer transition-all ${
                                      attendanceRecords[student.id] === option.value
                                        ? `${option.color} ring-2 ring-offset-1 ring-current`
                                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                    }`}
                                  >
                                    {option.label}
                                  </Badge>
                                </label>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {attendanceData?.students && attendanceData.students.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        Total: {attendanceData.students.length} estudiantes
                      </span>
                      <span>
                        Presentes:{" "}
                        {Object.values(attendanceRecords).filter((s) => s === "PRESENT").length}
                      </span>
                      <span>
                        Ausentes:{" "}
                        {Object.values(attendanceRecords).filter((s) => s === "ABSENT").length}
                      </span>
                    </div>
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      onClick={handleSubmitAttendance}
                      disabled={submitAttendance.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {submitAttendance.isPending ? "Guardando..." : "Guardar Asistencia"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!studentsReady && (
              <div className="bg-card rounded-xl border border-border p-12 shadow-card text-center">
                <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                  Tomar Asistencia
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
                  <div className={`flex items-center gap-3 ${selectedClassId ? 'text-success' : ''}`}>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${selectedClassId ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}`}>1</span>
                    <span>Selecciona un curso</span>
                  </div>
                  <div className={`flex items-center gap-3 ${selectedSectionId ? 'text-success' : ''}`}>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${selectedSectionId ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}`}>2</span>
                    <span>Selecciona una seccion</span>
                  </div>
                  <div className={`flex items-center gap-3 ${selectedDate ? 'text-success' : ''}`}>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${selectedDate ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}`}>3</span>
                    <span>Selecciona la fecha</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="space-y-4">
            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 shadow-card">
              <div className="flex flex-col md:flex-row gap-4">
                <Select
                  value={reportClassId ? String(reportClassId) : ""}
                  onValueChange={(val) => {
                    setReportClassId(Number(val));
                    setReportSectionId(undefined);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[250px]">
                    <SelectValue placeholder="Seleccionar Curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes && classes.filter(c => c.category !== 'TECNICA').length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Primaria y Bachillerato</SelectLabel>
                        {classes.filter(c => c.category !== 'TECNICA').map((cls) => (
                          <SelectItem key={cls.id} value={String(cls.id)}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {classes && classes.filter(c => c.category === 'TECNICA').length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Carreras Tecnicas</SelectLabel>
                        {classes.filter(c => c.category === 'TECNICA').map((cls) => (
                          <SelectItem key={cls.id} value={String(cls.id)}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={reportSectionId ? String(reportSectionId) : ""}
                  onValueChange={(val) => setReportSectionId(Number(val))}
                  disabled={!reportClassId}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Seleccionar Seccion" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportSections?.map((sec) => (
                      <SelectItem key={sec.id} value={String(sec.id)}>
                        {sec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="month"
                  className="w-full md:w-[200px]"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                />
              </div>
            </div>

            {/* Summary Table */}
            {reportSectionId && reportMonth ? (
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Estudiante</TableHead>
                      <TableHead className="font-semibold text-center">Presentes</TableHead>
                      <TableHead className="font-semibold text-center">Ausentes</TableHead>
                      <TableHead className="font-semibold text-center">Tardes</TableHead>
                      <TableHead className="font-semibold text-center">Porcentaje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaryLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : !summaryData || summaryData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            No hay datos de asistencia para este periodo
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      summaryData.map((row: any, index: number) => {
                        const total = (row.present || 0) + (row.absent || 0) + (row.late || 0) + (row.halfDay || 0);
                        const percentage = total > 0 ? (((row.present || 0) + (row.late || 0) * 0.5 + (row.halfDay || 0) * 0.5) / total * 100) : 0;
                        return (
                          <TableRow key={row.studentId || index} className={index % 2 === 0 ? "" : "bg-muted/30"}>
                            <TableCell className="font-medium">{row.student?.name || row.studentName || row.name || "-"}</TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-success/10 text-success">{row.present || 0}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-destructive/10 text-destructive">{row.absent || 0}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-warning/10 text-warning">{row.late || 0}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={
                                percentage >= 90
                                  ? "bg-success/10 text-success"
                                  : percentage >= 75
                                  ? "bg-warning/10 text-warning"
                                  : "bg-destructive/10 text-destructive"
                              }>
                                {percentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-12 shadow-card text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                  Reporte de Asistencia
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
                  <div className={`flex items-center gap-3 ${reportClassId ? 'text-success' : ''}`}>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${reportClassId ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}`}>1</span>
                    <span>Selecciona un curso</span>
                  </div>
                  <div className={`flex items-center gap-3 ${reportSectionId ? 'text-success' : ''}`}>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${reportSectionId ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}`}>2</span>
                    <span>Selecciona una seccion</span>
                  </div>
                  <div className={`flex items-center gap-3 ${reportMonth ? 'text-success' : ''}`}>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${reportMonth ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}`}>3</span>
                    <span>Selecciona el mes</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
