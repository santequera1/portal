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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useExamGroups,
  useExams,
  useMarks,
  useSubmitMarks,
  useGradeScale,
} from "@/hooks/useExams";
import { useStudents } from "@/hooks/useStudents";
import {
  Save,
  BookOpen,
  Award,
  GraduationCap,
} from "lucide-react";
import type { Mark } from "@/types";

const DEFAULT_GRADE_SCALE = [
  { name: "Superior", minMarks: 4.6, maxMarks: 5.0, grade: "S", gpa: 5.0 },
  { name: "Alto", minMarks: 4.0, maxMarks: 4.5, grade: "A", gpa: 4.5 },
  { name: "Basico", minMarks: 3.0, maxMarks: 3.9, grade: "B", gpa: 3.5 },
  { name: "Bajo", minMarks: 1.0, maxMarks: 2.9, grade: "Bj", gpa: 2.0 },
];

function getGradeLabel(value: number): { name: string; color: string } {
  if (value >= 4.6) return { name: "Superior", color: "bg-success/10 text-success" };
  if (value >= 4.0) return { name: "Alto", color: "bg-primary/10 text-primary" };
  if (value >= 3.0) return { name: "Basico", color: "bg-warning/10 text-warning" };
  return { name: "Bajo", color: "bg-destructive/10 text-destructive" };
}

export default function Calificaciones() {
  const { toast } = useToast();

  // State
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined);
  const [selectedExamId, setSelectedExamId] = useState<number | undefined>(undefined);
  const [marksInput, setMarksInput] = useState<Record<number, number>>({});

  // Queries
  const { data: examGroups, isLoading: groupsLoading } = useExamGroups();
  const { data: exams, isLoading: examsLoading } = useExams({
    examGroupId: selectedGroupId,
  });
  const selectedExam = exams?.find((e) => e.id === selectedExamId);
  const { data: marks, isLoading: marksLoading } = useMarks({
    examId: selectedExamId,
  });
  const { data: studentsData, isLoading: studentsLoading } = useStudents({
    classId: selectedExam?.classId,
  });
  const { data: gradeScale, isLoading: scaleLoading } = useGradeScale();

  const submitMarks = useSubmitMarks();

  const students = studentsData?.students || [];
  const scaleData = gradeScale && gradeScale.length > 0 ? gradeScale : DEFAULT_GRADE_SCALE;

  // Initialize marks from existing data
  useEffect(() => {
    if (marks && marks.length > 0) {
      const existing: Record<number, number> = {};
      marks.forEach((m: Mark) => {
        existing[m.studentId] = m.marksObtained;
      });
      setMarksInput(existing);
    } else if (students.length > 0) {
      const initial: Record<number, number> = {};
      students.forEach((s) => {
        initial[s.id] = 0;
      });
      setMarksInput(initial);
    }
  }, [marks, students]);

  const handleMarkChange = (studentId: number, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 5) return;
    setMarksInput((prev) => ({ ...prev, [studentId]: num }));
  };

  const handleSubmitMarks = async () => {
    if (!selectedExamId) {
      toast({ title: "Error", description: "Selecciona un examen", variant: "destructive" });
      return;
    }

    const marksArray = Object.entries(marksInput).map(([studentId, marksObtained]) => ({
      studentId: Number(studentId),
      marksObtained,
    }));

    try {
      await submitMarks.mutateAsync({
        examId: selectedExamId,
        marks: marksArray,
      });
      toast({ title: "Guardado", description: "Las notas han sido guardadas exitosamente" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudieron guardar las notas", variant: "destructive" });
    }
  };

  const isDataLoading = marksLoading || studentsLoading;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Calificaciones
            </h1>
            <p className="text-muted-foreground mt-1">
              Ingresa y consulta las notas de los estudiantes
            </p>
          </div>
        </div>

        <Tabs defaultValue="entry" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="entry">
              <BookOpen className="w-4 h-4 mr-2" />
              Ingreso de Notas
            </TabsTrigger>
            <TabsTrigger value="scale">
              <Award className="w-4 h-4 mr-2" />
              Escala de Calificaciones
            </TabsTrigger>
          </TabsList>

          {/* Grade Entry Tab */}
          <TabsContent value="entry" className="space-y-4">
            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 shadow-card">
              <div className="flex flex-col md:flex-row gap-4">
                <Select
                  value={selectedGroupId ? String(selectedGroupId) : ""}
                  onValueChange={(val) => {
                    setSelectedGroupId(Number(val));
                    setSelectedExamId(undefined);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[250px]">
                    <SelectValue placeholder="Seleccionar Grupo de Examen" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupsLoading ? (
                      <SelectItem value="loading" disabled>Cargando...</SelectItem>
                    ) : (
                      examGroups?.map((group) => (
                        <SelectItem key={group.id} value={String(group.id)}>
                          {group.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedExamId ? String(selectedExamId) : ""}
                  onValueChange={(val) => setSelectedExamId(Number(val))}
                  disabled={!selectedGroupId}
                >
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Seleccionar Examen" />
                  </SelectTrigger>
                  <SelectContent>
                    {examsLoading ? (
                      <SelectItem value="loading" disabled>Cargando...</SelectItem>
                    ) : (
                      exams?.map((exam) => (
                        <SelectItem key={exam.id} value={String(exam.id)}>
                          {exam.subject?.name || "Materia"} - {exam.class?.name || "Curso"} ({new Date(exam.date).toLocaleDateString("es-CO")})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Marks Grid */}
            {selectedExamId ? (
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                {selectedExam && (
                  <div className="px-4 py-3 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">
                        {selectedExam.subject?.name}
                      </span>
                      <span className="text-muted-foreground">
                        Curso: {selectedExam.class?.name}
                      </span>
                      <span className="text-muted-foreground">
                        Nota Maxima: {selectedExam.maxMarks}
                      </span>
                    </div>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold w-[50px]">#</TableHead>
                      <TableHead className="font-semibold">Estudiante</TableHead>
                      <TableHead className="font-semibold">No. Admision</TableHead>
                      <TableHead className="font-semibold w-[150px] text-center">
                        Nota (0 - 5.0)
                      </TableHead>
                      <TableHead className="font-semibold text-center">Calificacion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isDataLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            No hay estudiantes en este curso
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student, index) => {
                        const markValue = marksInput[student.id] ?? 0;
                        const grade = getGradeLabel(markValue);
                        return (
                          <TableRow key={student.id} className={index % 2 === 0 ? "" : "bg-muted/30"}>
                            <TableCell className="font-mono text-sm">{index + 1}</TableCell>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell className="font-mono text-sm">{student.admissionNo}</TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                className="w-20 mx-auto text-center font-mono"
                                value={markValue || ""}
                                onChange={(e) => handleMarkChange(student.id, e.target.value)}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              {markValue > 0 && (
                                <Badge className={grade.color}>
                                  {grade.name}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {students.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      {students.length} estudiantes
                    </p>
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      onClick={handleSubmitMarks}
                      disabled={submitMarks.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {submitMarks.isPending ? "Guardando..." : "Guardar Notas"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-12 shadow-card text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                  Ingreso de Notas
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
                  <div className={`flex items-center gap-3 ${selectedGroupId ? 'text-success' : ''}`}>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${selectedGroupId ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}`}>1</span>
                    <span>Selecciona un grupo de examen (ej: Primer Periodo)</span>
                  </div>
                  <div className={`flex items-center gap-3 ${selectedExamId ? 'text-success' : ''}`}>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${selectedExamId ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}`}>2</span>
                    <span>Selecciona el examen (materia y curso)</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Si no hay examenes disponibles, crea uno primero en la seccion de Examenes
                </p>
              </div>
            )}
          </TabsContent>

          {/* Grade Scale Tab */}
          <TabsContent value="scale" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Escala de Calificaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scaleLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Desempeno</TableHead>
                        <TableHead className="font-semibold text-center">Rango</TableHead>
                        <TableHead className="font-semibold text-center">Indicador</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scaleData.map((scale, index) => {
                        const colorMap: Record<string, string> = {
                          Superior: "bg-success/10 text-success",
                          Alto: "bg-primary/10 text-primary",
                          Basico: "bg-warning/10 text-warning",
                          Bajo: "bg-destructive/10 text-destructive",
                        };
                        return (
                          <TableRow key={index} className={index % 2 === 0 ? "" : "bg-muted/30"}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge className={colorMap[scale.name] || "bg-muted"}>
                                  {scale.name}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-mono">
                              {scale.minMarks.toFixed(1)} - {scale.maxMarks.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-mono font-medium">{scale.grade}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h4 className="text-sm font-semibold mb-2">Nota</h4>
                  <p className="text-sm text-muted-foreground">
                    La escala de calificaciones se basa en el sistema colombiano con rango de 1.0 a 5.0.
                    La nota minima aprobatoria es 3.0 (Basico).
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
