import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  useClasses,
  useSessions,
  useSubjects,
  useTeacherAssignments,
  useCreateClass,
  useDeleteClass,
  useCreateSection,
  useDeleteSection,
  useCreateSubject,
  useDeleteSubject,
  useCreateSession,
  useCreateTeacherAssignment,
  useDeleteTeacherAssignment,
  useSections,
  useAddSubjectToClass,
  useRemoveSubjectFromClass,
} from "@/hooks/useClasses";
import {
  useStaff,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
} from "@/hooks/useStaff";
import { useStudents } from "@/hooks/useStudents";
import {
  Plus,
  Trash2,
  Calendar,
  BookOpen,
  GraduationCap,
  ClipboardList,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Users,
  Edit,
  Search,
  Loader2,
  LayoutGrid,
  List,
  Table as TableIcon,
} from "lucide-react";
import type { AcademicSession, ClassInfo, SubjectInfo, StaffMember, Student } from "@/types";

// Component to display students in different view modes
function ClassStudentsView({ classId, viewMode }: { classId: number; viewMode: 'grid' | 'list' | 'table' }) {
  const { data: studentsData } = useStudents({ classId });
  const students = studentsData?.students || [];

  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay estudiantes en este curso</p>;
  }

  // Grid view (cards)
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {students.map((student: Student) => (
          <div key={student.id} className="bg-muted/30 rounded-lg p-3 border border-border hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-sm">{student.name} {student.lastName}</p>
                <p className="text-xs text-muted-foreground">{student.admissionNo}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {student.section?.name || 'Sin sección'}
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{student.gender}</span>
              <span>•</span>
              <span className={student.status === 'active' ? 'text-success' : 'text-muted-foreground'}>
                {student.status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List view (compact)
  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {students.map((student: Student) => (
          <div key={student.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                {student.name.charAt(0)}{student.lastName?.charAt(0) || ''}
              </div>
              <div>
                <p className="text-sm font-medium">{student.name} {student.lastName}</p>
                <p className="text-xs text-muted-foreground">{student.admissionNo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {student.section?.name || 'Sin sección'}
              </Badge>
              <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                {student.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table view (full details)
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">N° Matrícula</TableHead>
            <TableHead className="font-semibold">Nombre</TableHead>
            <TableHead className="font-semibold">Sección</TableHead>
            <TableHead className="font-semibold">Género</TableHead>
            <TableHead className="font-semibold">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student: Student, index: number) => (
            <TableRow key={student.id} className={index % 2 === 0 ? "" : "bg-muted/30"}>
              <TableCell className="font-mono text-sm">{student.admissionNo}</TableCell>
              <TableCell className="font-medium">{student.name} {student.lastName}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {student.section?.name || 'Sin sección'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{student.gender}</TableCell>
              <TableCell>
                <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {student.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Academico() {
  const { toast } = useToast();

  // Session state
  const [sessionDialog, setSessionDialog] = useState(false);
  const [sessionForm, setSessionForm] = useState({ name: "", startDate: "", endDate: "" });

  // Class state
  const [classDialog, setClassDialog] = useState(false);
  const [classForm, setClassForm] = useState({ name: "", order: 0, sessionId: 0, category: "REGULAR" as "REGULAR" | "TECNICA" });
  const [sectionDialog, setSectionDialog] = useState(false);
  const [sectionForm, setSectionForm] = useState({ name: "", classId: 0 });
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());
  const [studentsViewMode, setStudentsViewMode] = useState<'grid' | 'list' | 'table'>('grid');

  // Assign subject to class state
  const [assignSubjectDialog, setAssignSubjectDialog] = useState(false);
  const [assignSubjectForm, setAssignSubjectForm] = useState({ classId: 0, subjectId: 0 });

  // Subject state
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [subjectForm, setSubjectForm] = useState<{ name: string; code: string; classIds: number[] }>({ name: "", code: "", classIds: [] });
  const [subjectClassFilter, setSubjectClassFilter] = useState<number | undefined>(undefined);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(new Set());

  // Assignment state
  const [assignmentDialog, setAssignmentDialog] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    teacherId: 0,
    subjectId: 0,
    classId: 0,
    sectionId: 0,
  });

  // Staff / Docentes state
  const [staffDialog, setStaffDialog] = useState(false);
  const [staffEditId, setStaffEditId] = useState<number | null>(null);
  const [staffForm, setStaffForm] = useState({ name: "", department: "", designation: "", phone: "", email: "" });
  const [staffDeleteId, setStaffDeleteId] = useState<number | null>(null);
  const [staffSearch, setStaffSearch] = useState("");

  // Queries
  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects(subjectClassFilter);
  const { data: allSubjects } = useSubjects();
  const { data: assignments, isLoading: assignmentsLoading } = useTeacherAssignments();
  const { data: staff } = useStaff();
  const { data: assignmentSections } = useSections(assignmentForm.classId || undefined);
  const { data: assignmentSubjects } = useSubjects(assignmentForm.classId || undefined);

  // Mutations
  const createSession = useCreateSession();
  const createClass = useCreateClass();
  const deleteClass = useDeleteClass();
  const createSection = useCreateSection();
  const deleteSection = useDeleteSection();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const addSubjectToClass = useAddSubjectToClass();
  const removeSubjectFromClass = useRemoveSubjectFromClass();
  const createAssignment = useCreateTeacherAssignment();
  const deleteAssignment = useDeleteTeacherAssignment();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const activeSession = sessions?.find((s: AcademicSession) => s.isActive);
  const teachers = staff?.filter(
    (s) =>
      s.designation?.toLowerCase().includes("docente") ||
      s.department?.toLowerCase().includes("academico")
  ) || [];

  // Filtered docentes for the Docentes tab
  const filteredDocentes = teachers.filter((t) =>
    staffSearch
      ? t.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        t.email?.toLowerCase().includes(staffSearch.toLowerCase())
      : true
  );

  // Toggle helpers
  const toggleClassExpanded = (id: number) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSubjectExpanded = (id: number) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Handlers
  const handleCreateSession = async () => {
    if (!sessionForm.name || !sessionForm.startDate || !sessionForm.endDate) {
      toast({ title: "Error", description: "Todos los campos son requeridos", variant: "destructive" });
      return;
    }
    try {
      await createSession.mutateAsync({ ...sessionForm, isActive: true });
      toast({ title: "Creado", description: "La sesion academica ha sido creada" });
      setSessionDialog(false);
      setSessionForm({ name: "", startDate: "", endDate: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateClass = async () => {
    if (!classForm.name || !classForm.sessionId) {
      toast({ title: "Error", description: "Nombre y sesion son requeridos", variant: "destructive" });
      return;
    }
    try {
      await createClass.mutateAsync(classForm);
      toast({ title: "Creado", description: "El curso ha sido creado" });
      setClassDialog(false);
      setClassForm({ name: "", order: 0, sessionId: 0, category: "REGULAR" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateSection = async () => {
    if (!sectionForm.name || !sectionForm.classId) {
      toast({ title: "Error", description: "Nombre y curso son requeridos", variant: "destructive" });
      return;
    }
    try {
      await createSection.mutateAsync(sectionForm);
      toast({ title: "Creado", description: "La seccion ha sido creada" });
      setSectionDialog(false);
      setSectionForm({ name: "", classId: 0 });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateSubject = async () => {
    if (!subjectForm.name || !subjectForm.code) {
      toast({ title: "Error", description: "Nombre y codigo son requeridos", variant: "destructive" });
      return;
    }
    try {
      await createSubject.mutateAsync({
        name: subjectForm.name,
        code: subjectForm.code,
        classIds: subjectForm.classIds.length > 0 ? subjectForm.classIds : undefined,
      });
      toast({ title: "Creado", description: "La materia ha sido creada" });
      setSubjectDialog(false);
      setSubjectForm({ name: "", code: "", classIds: [] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAssignSubjectToClass = async () => {
    if (!assignSubjectForm.classId || !assignSubjectForm.subjectId) {
      toast({ title: "Error", description: "Selecciona un curso y una materia", variant: "destructive" });
      return;
    }
    try {
      await addSubjectToClass.mutateAsync(assignSubjectForm);
      toast({ title: "Asignado", description: "La materia ha sido asignada al curso" });
      setAssignSubjectDialog(false);
      setAssignSubjectForm({ classId: 0, subjectId: 0 });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateAssignment = async () => {
    if (!assignmentForm.teacherId || !assignmentForm.subjectId || !assignmentForm.classId || !assignmentForm.sectionId) {
      toast({ title: "Error", description: "Todos los campos son requeridos", variant: "destructive" });
      return;
    }
    try {
      await createAssignment.mutateAsync(assignmentForm);
      toast({ title: "Creado", description: "La asignacion ha sido creada" });
      setAssignmentDialog(false);
      setAssignmentForm({ teacherId: 0, subjectId: 0, classId: 0, sectionId: 0 });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveStaff = async () => {
    if (!staffForm.name) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    try {
      if (staffEditId) {
        await updateStaff.mutateAsync({ id: staffEditId, data: staffForm });
        toast({ title: "Actualizado", description: "El docente ha sido actualizado" });
      } else {
        await createStaff.mutateAsync({
          ...staffForm,
          department: staffForm.department || "Academico",
          designation: staffForm.designation || "Docente",
          joinDate: new Date().toISOString(),
        });
        toast({ title: "Creado", description: "El docente ha sido creado" });
      }
      setStaffDialog(false);
      setStaffEditId(null);
      setStaffForm({ name: "", department: "", designation: "", phone: "", email: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffDeleteId) return;
    try {
      await deleteStaff.mutateAsync(staffDeleteId);
      toast({ title: "Eliminado", description: "El docente ha sido eliminado" });
      setStaffDeleteId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditStaff = (member: StaffMember) => {
    setStaffEditId(member.id);
    setStaffForm({
      name: member.name,
      department: member.department || "",
      designation: member.designation || "",
      phone: member.phone || "",
      email: member.email || "",
    });
    setStaffDialog(true);
  };

  const toggleSubjectClassId = (classId: number) => {
    setSubjectForm((prev) => {
      const has = prev.classIds.includes(classId);
      return {
        ...prev,
        classIds: has ? prev.classIds.filter((id) => id !== classId) : [...prev.classIds, classId],
      };
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Estructura Academica
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona sesiones, cursos, materias, asignaciones y docentes
            </p>
          </div>
        </div>

        <Tabs defaultValue="session" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="session">Sesion Academica</TabsTrigger>
            <TabsTrigger value="classes">Cursos</TabsTrigger>
            <TabsTrigger value="subjects">Materias</TabsTrigger>
            <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
            <TabsTrigger value="docentes">Docentes</TabsTrigger>
          </TabsList>

          {/* ===================== SESSION TAB ===================== */}
          <TabsContent value="session" className="space-y-4">
            {activeSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    Sesion Activa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{activeSession.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha Inicio</p>
                      <p className="font-medium">
                        {new Date(activeSession.startDate).toLocaleDateString("es-CO")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha Fin</p>
                      <p className="font-medium">
                        {new Date(activeSession.endDate).toLocaleDateString("es-CO")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-semibold">Todas las Sesiones</h3>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setSessionDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Sesion
              </Button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Fecha Inicio</TableHead>
                    <TableHead className="font-semibold">Fecha Fin</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !sessions || sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No hay sesiones academicas</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((session: AcademicSession, index: number) => (
                      <TableRow key={session.id} className={index % 2 === 0 ? "" : "bg-muted/30"}>
                        <TableCell className="font-medium">{session.name}</TableCell>
                        <TableCell>{new Date(session.startDate).toLocaleDateString("es-CO")}</TableCell>
                        <TableCell>{new Date(session.endDate).toLocaleDateString("es-CO")}</TableCell>
                        <TableCell>
                          <Badge className={session.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                            {session.isActive ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ===================== CURSOS TAB (Collapsible Cards) ===================== */}
          <TabsContent value="classes" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h3 className="text-lg font-heading font-semibold">Cursos y Secciones</h3>
              <div className="flex gap-2 items-center">
                <div className="flex gap-1 border border-border rounded-md p-1">
                  <Button
                    variant={studentsViewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setStudentsViewMode('grid')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={studentsViewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setStudentsViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={studentsViewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setStudentsViewMode('table')}
                  >
                    <TableIcon className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setSectionDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Seccion
                </Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                  setClassForm({ name: "", order: 0, sessionId: activeSession?.id || 0, category: "REGULAR" });
                  setClassDialog(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Curso
                </Button>
              </div>
            </div>

            {classesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border shadow-card p-4">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ))}
              </div>
            ) : !classes || classes.length === 0 ? (
              <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
                <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No hay cursos registrados</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Primaria y Bachillerato */}
                {(() => {
                  const regularClasses = classes.filter((cls: ClassInfo) => cls.category !== 'TECNICA');
                  return regularClasses.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-md font-heading font-semibold text-foreground">Primaria y Bachillerato</h4>
                      {regularClasses.map((cls: ClassInfo) => {
                        const isExpanded = expandedClasses.has(cls.id);
                        const studentCount = cls._count?.students || 0;
                        const assignedSubjects = cls.classSubjects || [];

                        return (
                          <div key={cls.id} className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                            <div
                              role="button"
                              tabIndex={0}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left cursor-pointer"
                              onClick={() => toggleClassExpanded(cls.id)}
                            >
                              <div className="flex items-center gap-4">
                                <div>
                                  <span className="font-semibold text-foreground">{cls.name}</span>
                                  <span className="ml-3 text-sm text-muted-foreground">Orden: {cls.order}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {studentCount} estudiantes
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteClass.mutateAsync(cls.id).then(() => {
                                      toast({ title: "Eliminado", description: "Curso eliminado" });
                                    }).catch((err: any) => {
                                      toast({ title: "Error", description: err.message, variant: "destructive" });
                                    });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-border pt-3 space-y-4">
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Secciones</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSectionForm({ name: "", classId: cls.id });
                                        setSectionDialog(true);
                                      }}
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Agregar Seccion
                                    </Button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {cls.sections && cls.sections.length > 0 ? (
                                      cls.sections.map((sec) => (
                                        <Badge key={sec.id} variant="secondary" className="text-xs">
                                          {sec.name}
                                          {sec._count?.students !== undefined && ` (${sec._count.students})`}
                                          <button
                                            className="ml-1 hover:text-destructive"
                                            onClick={() => deleteSection.mutateAsync(sec.id).then(() => {
                                              toast({ title: "Eliminado", description: "Seccion eliminada" });
                                            }).catch((err: any) => {
                                              toast({ title: "Error", description: err.message, variant: "destructive" });
                                            })}
                                          >
                                            x
                                          </button>
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-sm text-muted-foreground">Sin secciones</span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Materias Asignadas</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setAssignSubjectForm({ classId: cls.id, subjectId: 0 });
                                        setAssignSubjectDialog(true);
                                      }}
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Asignar Materia
                                    </Button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {assignedSubjects.length > 0 ? (
                                      assignedSubjects.map((cs) => (
                                        <Badge key={cs.id} variant="outline" className="text-xs">
                                          {cs.subject?.name || `Materia #${cs.subjectId}`}
                                          <button
                                            className="ml-1 hover:text-destructive"
                                            onClick={() => removeSubjectFromClass.mutateAsync({ classId: cls.id, subjectId: cs.subjectId }).then(() => {
                                              toast({ title: "Desasignado", description: "Materia desasignada del curso" });
                                            }).catch((err: any) => {
                                              toast({ title: "Error", description: err.message, variant: "destructive" });
                                            })}
                                          >
                                            x
                                          </button>
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-sm text-muted-foreground">Sin materias asignadas</span>
                                    )}
                                  </div>
                                </div>

                                {/* Students Section */}
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-2">Estudiantes</p>
                                  <ClassStudentsView classId={cls.id} viewMode={studentsViewMode} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : null;
                })()}

                {/* Carreras Tecnicas */}
                {(() => {
                  const tecnicaClasses = classes.filter((cls: ClassInfo) => cls.category === 'TECNICA');
                  return tecnicaClasses.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-md font-heading font-semibold text-foreground">Carreras Tecnicas</h4>
                      {tecnicaClasses.map((cls: ClassInfo) => {
                        const isExpanded = expandedClasses.has(cls.id);
                        const studentCount = cls._count?.students || 0;
                        const assignedSubjects = cls.classSubjects || [];

                        return (
                          <div key={cls.id} className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                            <div
                              role="button"
                              tabIndex={0}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left cursor-pointer"
                              onClick={() => toggleClassExpanded(cls.id)}
                            >
                              <div className="flex items-center gap-4">
                                <div>
                                  <span className="font-semibold text-foreground">{cls.name}</span>
                                  <span className="ml-3 text-sm text-muted-foreground">Orden: {cls.order}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {studentCount} estudiantes
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteClass.mutateAsync(cls.id).then(() => {
                                      toast({ title: "Eliminado", description: "Curso eliminado" });
                                    }).catch((err: any) => {
                                      toast({ title: "Error", description: err.message, variant: "destructive" });
                                    });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-border pt-3 space-y-4">
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Secciones</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSectionForm({ name: "", classId: cls.id });
                                        setSectionDialog(true);
                                      }}
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Agregar Seccion
                                    </Button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {cls.sections && cls.sections.length > 0 ? (
                                      cls.sections.map((sec) => (
                                        <Badge key={sec.id} variant="secondary" className="text-xs">
                                          {sec.name}
                                          {sec._count?.students !== undefined && ` (${sec._count.students})`}
                                          <button
                                            className="ml-1 hover:text-destructive"
                                            onClick={() => deleteSection.mutateAsync(sec.id).then(() => {
                                              toast({ title: "Eliminado", description: "Seccion eliminada" });
                                            }).catch((err: any) => {
                                              toast({ title: "Error", description: err.message, variant: "destructive" });
                                            })}
                                          >
                                            x
                                          </button>
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-sm text-muted-foreground">Sin secciones</span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Materias Asignadas</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setAssignSubjectForm({ classId: cls.id, subjectId: 0 });
                                        setAssignSubjectDialog(true);
                                      }}
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Asignar Materia
                                    </Button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {assignedSubjects.length > 0 ? (
                                      assignedSubjects.map((cs) => (
                                        <Badge key={cs.id} variant="outline" className="text-xs">
                                          {cs.subject?.name || `Materia #${cs.subjectId}`}
                                          <button
                                            className="ml-1 hover:text-destructive"
                                            onClick={() => removeSubjectFromClass.mutateAsync({ classId: cls.id, subjectId: cs.subjectId }).then(() => {
                                              toast({ title: "Desasignado", description: "Materia desasignada del curso" });
                                            }).catch((err: any) => {
                                              toast({ title: "Error", description: err.message, variant: "destructive" });
                                            })}
                                          >
                                            x
                                          </button>
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-sm text-muted-foreground">Sin materias asignadas</span>
                                    )}
                                  </div>
                                </div>

                                {/* Students Section */}
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-2">Estudiantes</p>
                                  <ClassStudentsView classId={cls.id} viewMode={studentsViewMode} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </TabsContent>

          {/* ===================== MATERIAS TAB (Collapsible Cards) ===================== */}
          <TabsContent value="subjects" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <Select
                value={subjectClassFilter ? String(subjectClassFilter) : "all"}
                onValueChange={(val) => setSubjectClassFilter(val === "all" ? undefined : Number(val))}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los cursos</SelectItem>
                  {classes?.map((cls: ClassInfo) => (
                    <SelectItem key={cls.id} value={String(cls.id)}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setSubjectDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Materia
              </Button>
            </div>

            {subjectsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border shadow-card p-4">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ))}
              </div>
            ) : !subjects || subjects.length === 0 ? (
              <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
                <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No hay materias registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subjects.map((sub: SubjectInfo) => {
                  const isExpanded = expandedSubjects.has(sub.id);
                  const assignedClasses = sub.classSubjects || [];

                  return (
                    <div key={sub.id} className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                      {/* Card header - clickable */}
                      <div
                        role="button"
                        tabIndex={0}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left cursor-pointer"
                        onClick={() => toggleSubjectExpanded(sub.id)}
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-foreground">{sub.name}</span>
                          <Badge variant="secondary" className="text-xs font-mono">{sub.code}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSubject.mutateAsync(sub.id).then(() => {
                                toast({ title: "Eliminado", description: "Materia eliminada" });
                              }).catch((err: any) => {
                                toast({ title: "Error", description: err.message, variant: "destructive" });
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-border pt-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Cursos asignados</p>
                          <div className="flex flex-wrap gap-2">
                            {assignedClasses.length > 0 ? (
                              assignedClasses.map((cs) => (
                                <Badge key={cs.id} variant="outline" className="text-xs">
                                  {cs.class?.name || `Curso #${cs.classId}`}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No asignada a ningun curso</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ===================== ASSIGNMENTS TAB ===================== */}
          <TabsContent value="assignments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-semibold">Asignaciones Docente-Materia</h3>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setAssignmentDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Asignacion
              </Button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Docente</TableHead>
                    <TableHead className="font-semibold">Materia</TableHead>
                    <TableHead className="font-semibold">Curso</TableHead>
                    <TableHead className="font-semibold">Seccion</TableHead>
                    <TableHead className="w-[50px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !assignments || assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No hay asignaciones registradas</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments.map((assgn, index) => (
                      <TableRow key={assgn.id} className={index % 2 === 0 ? "" : "bg-muted/30"}>
                        <TableCell className="font-medium">{assgn.teacher?.name || "-"}</TableCell>
                        <TableCell>{assgn.subject?.name || "-"}</TableCell>
                        <TableCell>{assgn.class?.name || "-"}</TableCell>
                        <TableCell>{assgn.section?.name || "-"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteAssignment.mutateAsync(assgn.id).then(() => {
                              toast({ title: "Eliminado", description: "Asignacion eliminada" });
                            }).catch((err: any) => {
                              toast({ title: "Error", description: err.message, variant: "destructive" });
                            })}
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

          {/* ===================== DOCENTES TAB ===================== */}
          <TabsContent value="docentes" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar docente..."
                  className="pl-9"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                />
              </div>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  setStaffEditId(null);
                  setStaffForm({ name: "", department: "", designation: "Docente", phone: "", email: "" });
                  setStaffDialog(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Docente
              </Button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Area</TableHead>
                    <TableHead className="font-semibold">Cargo</TableHead>
                    <TableHead className="font-semibold">Telefono</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!staff ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredDocentes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Users className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No hay docentes registrados</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocentes.map((member, index) => (
                      <TableRow key={member.id} className={index % 2 === 0 ? "" : "bg-muted/30"}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.department || "-"}</TableCell>
                        <TableCell>{member.designation || "-"}</TableCell>
                        <TableCell>{member.phone || "-"}</TableCell>
                        <TableCell>{member.email || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditStaff(member)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setStaffDeleteId(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* ===================== DIALOGS ===================== */}

        {/* New Session Dialog */}
        <Dialog open={sessionDialog} onOpenChange={setSessionDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Nueva Sesion Academica</DialogTitle>
              <DialogDescription>Crea una nueva sesion academica</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Ej: 2025-2026"
                  value={sessionForm.name}
                  onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha Inicio *</label>
                  <Input
                    type="date"
                    value={sessionForm.startDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha Fin *</label>
                  <Input
                    type="date"
                    value={sessionForm.endDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSessionDialog(false)}>Cancelar</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleCreateSession} disabled={createSession.isPending}>
                {createSession.isPending ? "Creando..." : "Crear Sesion"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Class (Curso) Dialog */}
        <Dialog open={classDialog} onOpenChange={setClassDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Nuevo Curso</DialogTitle>
              <DialogDescription>Crea un nuevo curso</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Ej: 5 Primaria"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Orden</label>
                <Input
                  type="number"
                  placeholder="Ej: 5"
                  value={classForm.order || ""}
                  onChange={(e) => setClassForm({ ...classForm, order: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria *</label>
                <Select
                  value={classForm.category}
                  onValueChange={(val) => setClassForm({ ...classForm, category: val as "REGULAR" | "TECNICA" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGULAR">Primaria y Bachillerato</SelectItem>
                    <SelectItem value="TECNICA">Carrera Tecnica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sesion Academica *</label>
                <Select
                  value={classForm.sessionId ? String(classForm.sessionId) : ""}
                  onValueChange={(val) => setClassForm({ ...classForm, sessionId: Number(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sesion" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions?.map((s: AcademicSession) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClassDialog(false)}>Cancelar</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleCreateClass} disabled={createClass.isPending}>
                {createClass.isPending ? "Creando..." : "Crear Curso"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Section Dialog */}
        <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Nueva Seccion</DialogTitle>
              <DialogDescription>Agrega una seccion a un curso</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Curso *</label>
                <Select
                  value={sectionForm.classId ? String(sectionForm.classId) : ""}
                  onValueChange={(val) => setSectionForm({ ...sectionForm, classId: Number(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((cls: ClassInfo) => (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Ej: A, B, C..."
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSectionDialog(false)}>Cancelar</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleCreateSection} disabled={createSection.isPending}>
                {createSection.isPending ? "Creando..." : "Crear Seccion"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Subject Dialog - multi-select checkboxes for courses */}
        <Dialog open={subjectDialog} onOpenChange={setSubjectDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Nueva Materia</DialogTitle>
              <DialogDescription>Registra una nueva materia y selecciona los cursos donde se imparte</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Ej: Matematicas"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Codigo *</label>
                <Input
                  placeholder="Ej: MAT"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cursos (opcional)</label>
                <p className="text-xs text-muted-foreground">Selecciona los cursos a los que se asignara esta materia</p>
                <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                  {classes && classes.length > 0 ? (
                    classes.map((cls: ClassInfo) => (
                      <label key={cls.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 p-1 rounded">
                        <input
                          type="checkbox"
                          className="rounded border-border"
                          checked={subjectForm.classIds.includes(cls.id)}
                          onChange={() => toggleSubjectClassId(cls.id)}
                        />
                        <span className="text-sm">{cls.name}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay cursos disponibles</p>
                  )}
                </div>
                {subjectForm.classIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {subjectForm.classIds.map((cid) => {
                      const cls = classes?.find((c: ClassInfo) => c.id === cid);
                      return (
                        <Badge key={cid} variant="secondary" className="text-xs">
                          {cls?.name || `#${cid}`}
                          <button className="ml-1 hover:text-destructive" onClick={() => toggleSubjectClassId(cid)}>x</button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubjectDialog(false)}>Cancelar</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleCreateSubject} disabled={createSubject.isPending}>
                {createSubject.isPending ? "Creando..." : "Crear Materia"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Subject to Class Dialog */}
        <Dialog open={assignSubjectDialog} onOpenChange={setAssignSubjectDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Asignar Materia al Curso</DialogTitle>
              <DialogDescription>Selecciona una materia existente para asignar a este curso</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Materia *</label>
                <Select
                  value={assignSubjectForm.subjectId ? String(assignSubjectForm.subjectId) : ""}
                  onValueChange={(val) => setAssignSubjectForm({ ...assignSubjectForm, subjectId: Number(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {allSubjects?.map((sub: SubjectInfo) => (
                      <SelectItem key={sub.id} value={String(sub.id)}>
                        {sub.name} ({sub.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignSubjectDialog(false)}>Cancelar</Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleAssignSubjectToClass}
                disabled={addSubjectToClass.isPending}
              >
                {addSubjectToClass.isPending ? "Asignando..." : "Asignar Materia"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Assignment Dialog */}
        <Dialog open={assignmentDialog} onOpenChange={setAssignmentDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nueva Asignacion</DialogTitle>
              <DialogDescription>Asigna un docente a una materia en un curso y seccion</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Docente *</label>
                <Select
                  value={assignmentForm.teacherId ? String(assignmentForm.teacherId) : ""}
                  onValueChange={(val) => setAssignmentForm({ ...assignmentForm, teacherId: Number(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Curso *</label>
                <Select
                  value={assignmentForm.classId ? String(assignmentForm.classId) : ""}
                  onValueChange={(val) => setAssignmentForm({
                    ...assignmentForm,
                    classId: Number(val),
                    subjectId: 0,
                    sectionId: 0,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((cls: ClassInfo) => (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Materia *</label>
                  <Select
                    value={assignmentForm.subjectId ? String(assignmentForm.subjectId) : ""}
                    onValueChange={(val) => setAssignmentForm({ ...assignmentForm, subjectId: Number(val) })}
                    disabled={!assignmentForm.classId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignmentSubjects?.map((sub: SubjectInfo) => (
                        <SelectItem key={sub.id} value={String(sub.id)}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Seccion *</label>
                  <Select
                    value={assignmentForm.sectionId ? String(assignmentForm.sectionId) : ""}
                    onValueChange={(val) => setAssignmentForm({ ...assignmentForm, sectionId: Number(val) })}
                    disabled={!assignmentForm.classId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar seccion" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignmentSections?.map((sec) => (
                        <SelectItem key={sec.id} value={String(sec.id)}>
                          {sec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignmentDialog(false)}>Cancelar</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleCreateAssignment} disabled={createAssignment.isPending}>
                {createAssignment.isPending ? "Creando..." : "Crear Asignacion"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Staff (Docente) Create/Edit Dialog */}
        <Dialog open={staffDialog} onOpenChange={(open) => { setStaffDialog(open); if (!open) { setStaffEditId(null); } }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{staffEditId ? "Editar Docente" : "Nuevo Docente"}</DialogTitle>
              <DialogDescription>
                {staffEditId ? "Modifica los datos del docente" : "Registra un nuevo docente en el sistema"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Nombre completo"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Area</label>
                  <Select
                    value={staffForm.department}
                    onValueChange={(val) => setStaffForm({ ...staffForm, department: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Matematicas y Ciencias">Matematicas y Ciencias</SelectItem>
                      <SelectItem value="Humanidades y Sociales">Humanidades y Sociales</SelectItem>
                      <SelectItem value="Idiomas">Idiomas</SelectItem>
                      <SelectItem value="Educacion Fisica">Educacion Fisica</SelectItem>
                      <SelectItem value="Informatica y Tecnologia">Informatica y Tecnologia</SelectItem>
                      <SelectItem value="Artes">Artes</SelectItem>
                      <SelectItem value="Tecnica - Salud">Tecnica - Salud</SelectItem>
                      <SelectItem value="Tecnica - Administrativa">Tecnica - Administrativa</SelectItem>
                      <SelectItem value="Tecnica - Sistemas">Tecnica - Sistemas</SelectItem>
                      <SelectItem value="Tecnica - Industrial">Tecnica - Industrial</SelectItem>
                      <SelectItem value="Otra">Otra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cargo</label>
                  <Input
                    placeholder="Ej: Docente"
                    value={staffForm.designation}
                    onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefono</label>
                  <Input
                    placeholder="Ej: 300 123 4567"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setStaffDialog(false); setStaffEditId(null); }}>Cancelar</Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleSaveStaff}
                disabled={createStaff.isPending || updateStaff.isPending}
              >
                {(createStaff.isPending || updateStaff.isPending) ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
                ) : staffEditId ? "Guardar Cambios" : "Crear Docente"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Staff Delete Confirmation */}
        <AlertDialog open={!!staffDeleteId} onOpenChange={(open) => { if (!open) setStaffDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Docente</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion no se puede deshacer. Se eliminara permanentemente este docente del sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteStaff}
              >
                {deleteStaff.isPending ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
