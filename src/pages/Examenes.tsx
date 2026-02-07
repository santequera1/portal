import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import {
  useExamGroups,
  useExams,
  useCreateExamGroup,
  useCreateExam,
  useDeleteExam,
  useDeleteExamGroup,
} from "@/hooks/useExams";
import { useClasses, useSubjects } from "@/hooks/useClasses";
import {
  Plus,
  Trash2,
  FileText,
  BookOpen,
  Calendar,
} from "lucide-react";

export default function Examenes() {
  const { toast } = useToast();

  // Exam group state
  const [groupDialog, setGroupDialog] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", sessionId: 0 });

  // Delete confirmation state
  const [deleteGroupId, setDeleteGroupId] = useState<number | null>(null);
  const [deleteExamId, setDeleteExamId] = useState<number | null>(null);

  // Exam state
  const [examDialog, setExamDialog] = useState(false);
  const [examGroupFilter, setExamGroupFilter] = useState<number | undefined>(undefined);
  const [examForm, setExamForm] = useState({
    examGroupId: 0,
    subjectId: 0,
    classId: 0,
    date: "",
    startTime: "",
    duration: 60,
    maxMarks: 5,
  });

  // Queries
  const { data: examGroups, isLoading: groupsLoading } = useExamGroups();
  const { data: exams, isLoading: examsLoading } = useExams({
    examGroupId: examGroupFilter,
  });
  const { data: classes } = useClasses();
  const { data: examSubjects } = useSubjects(examForm.classId || undefined);

  // Mutations
  const createExamGroup = useCreateExamGroup();
  const deleteExamGroup = useDeleteExamGroup();
  const createExam = useCreateExam();
  const deleteExam = useDeleteExam();

  const handleCreateGroup = async () => {
    if (!groupForm.name) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    try {
      await createExamGroup.mutateAsync(groupForm);
      toast({ title: "Creado", description: "El grupo de examen ha sido creado" });
      setGroupDialog(false);
      setGroupForm({ name: "", sessionId: 0 });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateExam = async () => {
    if (!examForm.examGroupId || !examForm.subjectId || !examForm.classId || !examForm.date) {
      toast({ title: "Error", description: "Grupo, materia, curso y fecha son requeridos", variant: "destructive" });
      return;
    }
    try {
      await createExam.mutateAsync({
        examGroupId: examForm.examGroupId,
        subjectId: examForm.subjectId,
        classId: examForm.classId,
        date: examForm.date,
        startTime: examForm.startTime || undefined,
        duration: examForm.duration || undefined,
        maxMarks: examForm.maxMarks || 5,
      });
      toast({ title: "Creado", description: "El examen ha sido creado exitosamente" });
      setExamDialog(false);
      setExamForm({
        examGroupId: 0,
        subjectId: 0,
        classId: 0,
        date: "",
        startTime: "",
        duration: 60,
        maxMarks: 5,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Examenes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona grupos de examen y examenes individuales
            </p>
          </div>
        </div>

        <Tabs defaultValue="groups" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="groups">Grupos de Examen</TabsTrigger>
            <TabsTrigger value="exams">Examenes</TabsTrigger>
          </TabsList>

          {/* Exam Groups Tab */}
          <TabsContent value="groups" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-semibold">Grupos de Examen</h3>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setGroupDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Grupo
              </Button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold text-center">No. Examenes</TableHead>
                    <TableHead className="w-[50px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 3 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !examGroups || examGroups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay grupos de examen</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    examGroups.map((group, index) => (
                      <TableRow key={group.id} className={index % 2 === 0 ? "" : "bg-muted/30"}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{group._count?.exams || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteGroupId(group.id)}
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

          {/* Exams Tab */}
          <TabsContent value="exams" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <Select
                value={examGroupFilter ? String(examGroupFilter) : "all"}
                onValueChange={(val) => setExamGroupFilter(val === "all" ? undefined : Number(val))}
              >
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Filtrar por grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los grupos</SelectItem>
                  {examGroups?.map((group) => (
                    <SelectItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setExamDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Examen
              </Button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Materia</TableHead>
                    <TableHead className="font-semibold">Curso</TableHead>
                    <TableHead className="font-semibold">Fecha</TableHead>
                    <TableHead className="font-semibold">Hora</TableHead>
                    <TableHead className="font-semibold text-center">Duracion (min)</TableHead>
                    <TableHead className="font-semibold text-center">Nota Maxima</TableHead>
                    <TableHead className="font-semibold text-center">Notas</TableHead>
                    <TableHead className="w-[50px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !exams || exams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay examenes registrados</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    exams.map((exam, index) => (
                      <TableRow key={exam.id} className={index % 2 === 0 ? "" : "bg-muted/30"}>
                        <TableCell className="font-medium">{exam.subject?.name || "-"}</TableCell>
                        <TableCell>{exam.class?.name || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            {new Date(exam.date).toLocaleDateString("es-CO")}
                          </div>
                        </TableCell>
                        <TableCell>{exam.startTime || "-"}</TableCell>
                        <TableCell className="text-center">{exam.duration || "-"}</TableCell>
                        <TableCell className="text-center font-mono">{exam.maxMarks}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{exam._count?.marks || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteExamId(exam.id)}
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
        </Tabs>

        {/* New Group Dialog */}
        <Dialog open={groupDialog} onOpenChange={setGroupDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Nuevo Grupo de Examen</DialogTitle>
              <DialogDescription>Crea un grupo para organizar los examenes</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Ej: Primer Periodo 2025"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGroupDialog(false)}>Cancelar</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleCreateGroup} disabled={createExamGroup.isPending}>
                {createExamGroup.isPending ? "Creando..." : "Crear Grupo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Exam Dialog */}
        <Dialog open={examDialog} onOpenChange={setExamDialog}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Nuevo Examen</DialogTitle>
              <DialogDescription>Registra un nuevo examen</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Grupo de Examen *</label>
                <Select
                  value={examForm.examGroupId ? String(examForm.examGroupId) : ""}
                  onValueChange={(val) => setExamForm({ ...examForm, examGroupId: Number(val) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {examGroups?.map((group) => (
                      <SelectItem key={group.id} value={String(group.id)}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Curso *</label>
                <Select
                  value={examForm.classId ? String(examForm.classId) : ""}
                  onValueChange={(val) => setExamForm({ ...examForm, classId: Number(val), subjectId: 0 })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar curso" />
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Materia *</label>
                <Select
                  value={examForm.subjectId ? String(examForm.subjectId) : ""}
                  onValueChange={(val) => setExamForm({ ...examForm, subjectId: Number(val) })}
                  disabled={!examForm.classId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {examSubjects?.map((sub) => (
                      <SelectItem key={sub.id} value={String(sub.id)}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha *</label>
                  <Input
                    type="date"
                    value={examForm.date}
                    onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hora Inicio</label>
                  <Input
                    type="time"
                    value={examForm.startTime}
                    onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duracion (minutos)</label>
                  <Input
                    type="number"
                    value={examForm.duration || ""}
                    onChange={(e) => setExamForm({ ...examForm, duration: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nota Maxima</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={examForm.maxMarks || ""}
                    onChange={(e) => setExamForm({ ...examForm, maxMarks: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExamDialog(false)}>Cancelar</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleCreateExam} disabled={createExam.isPending}>
                {createExam.isPending ? "Creando..." : "Crear Examen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Delete Group Confirmation */}
        <AlertDialog open={!!deleteGroupId} onOpenChange={(open) => { if (!open) setDeleteGroupId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Grupo de Examen</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion eliminara el grupo y todos los examenes asociados. Esta accion no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deleteGroupId) {
                    deleteExamGroup.mutateAsync(deleteGroupId).then(() => {
                      toast({ title: "Eliminado", description: "Grupo de examen eliminado" });
                    }).catch((err: any) => {
                      toast({ title: "Error", description: err.message, variant: "destructive" });
                    });
                  }
                  setDeleteGroupId(null);
                }}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Exam Confirmation */}
        <AlertDialog open={!!deleteExamId} onOpenChange={(open) => { if (!open) setDeleteExamId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Examen</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminara este examen y todas las notas registradas. Esta accion no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deleteExamId) {
                    deleteExam.mutateAsync(deleteExamId).then(() => {
                      toast({ title: "Eliminado", description: "Examen eliminado" });
                    }).catch((err: any) => {
                      toast({ title: "Error", description: err.message, variant: "destructive" });
                    });
                  }
                  setDeleteExamId(null);
                }}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
