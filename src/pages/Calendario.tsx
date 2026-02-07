import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
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
import { useSchedules, useCreateSchedule, useDeleteSchedule } from "@/hooks/useSchedules";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";
import { useClasses, useSections, useSubjects } from "@/hooks/useClasses";
import { useStaff } from "@/hooks/useStaff";
import { Plus, Trash2, Clock, Loader2, Calendar } from "lucide-react";
import type { Schedule, ClassInfo, StaffMember } from "@/types";

const DAY_NAMES = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

const TIME_SLOTS = [
  { start: "07:00", end: "07:50", label: "07:00 - 07:50" },
  { start: "07:50", end: "08:40", label: "07:50 - 08:40" },
  { start: "08:40", end: "09:30", label: "08:40 - 09:30" },
  { start: "09:30", end: "10:00", label: "09:30 - 10:00" }, // Descanso
  { start: "10:00", end: "10:50", label: "10:00 - 10:50" },
  { start: "10:50", end: "11:40", label: "10:50 - 11:40" },
  { start: "11:40", end: "12:20", label: "11:40 - 12:20" },
];

const BLOCK_COLORS = [
  "bg-blue-100 border-blue-300 text-blue-900",
  "bg-green-100 border-green-300 text-green-900",
  "bg-purple-100 border-purple-300 text-purple-900",
  "bg-orange-100 border-orange-300 text-orange-900",
  "bg-pink-100 border-pink-300 text-pink-900",
  "bg-teal-100 border-teal-300 text-teal-900",
  "bg-amber-100 border-amber-300 text-amber-900",
  "bg-indigo-100 border-indigo-300 text-indigo-900",
];

function getBlockColor(subjectId?: number): string {
  if (!subjectId) return BLOCK_COLORS[0];
  return BLOCK_COLORS[subjectId % BLOCK_COLORS.length];
}

const BREAK_SLOT_INDEX = 3; // Index of the 09:30 - 10:00 slot

interface ScheduleFormData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  classId: number;
  sectionId: number;
  subjectId: number;
  teacherId: number;
  room: string;
}

const INITIAL_FORM: ScheduleFormData = {
  dayOfWeek: 1,
  startTime: "07:00",
  endTime: "07:50",
  classId: 0,
  sectionId: 0,
  subjectId: 0,
  teacherId: 0,
  room: "",
};

export default function Calendario() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedOrgId } = useOrganization();

  // Filters
  const [filterClassId, setFilterClassId] = useState<number | undefined>(undefined);
  const [filterTeacherId, setFilterTeacherId] = useState<number | undefined>(undefined);

  // Dialog state
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<ScheduleFormData>({ ...INITIAL_FORM });

  // Queries
  const { data: schedules, isLoading: schedulesLoading } = useSchedules({
    classId: filterClassId,
    teacherId: filterTeacherId,
  });
  const { data: classes } = useClasses();
  const { data: staff } = useStaff();
  const { data: formSections } = useSections(form.classId || undefined);
  const { data: formSubjects } = useSubjects(form.classId || undefined);

  // Mutations
  const createSchedule = useCreateSchedule();
  const deleteSchedule = useDeleteSchedule();

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Build a lookup: schedulesByDayAndSlot[dayOfWeek][slotStartTime] = Schedule[]
  const schedulesByDayAndSlot = useMemo(() => {
    const map: Record<number, Record<string, Schedule[]>> = {};
    for (let d = 1; d <= 5; d++) {
      map[d] = {};
      for (const slot of TIME_SLOTS) {
        map[d][slot.start] = [];
      }
    }
    if (schedules) {
      for (const sch of schedules) {
        if (map[sch.dayOfWeek] && map[sch.dayOfWeek][sch.startTime]) {
          map[sch.dayOfWeek][sch.startTime].push(sch);
        }
      }
    }
    return map;
  }, [schedules]);

  // Handlers
  const handleCreate = async () => {
    if (!form.classId || !form.sectionId || !form.subjectId || !form.teacherId) {
      toast({
        title: "Error",
        description: "Todos los campos obligatorios deben ser completados",
        variant: "destructive",
      });
      return;
    }

    const subjectName = formSubjects?.find((s) => s.id === form.subjectId)?.name || "Clase";

    try {
      await createSchedule.mutateAsync({
        title: subjectName,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        classId: form.classId,
        sectionId: form.sectionId,
        subjectId: form.subjectId,
        teacherId: form.teacherId,
        room: form.room || undefined,
        organizationId: selectedOrgId || undefined,
      });
      toast({ title: "Creado", description: "El horario ha sido creado exitosamente" });
      setCreateDialog(false);
      setForm({ ...INITIAL_FORM });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSchedule.mutateAsync(deleteId);
      toast({ title: "Eliminado", description: "El horario ha sido eliminado" });
      setDeleteId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openCreateWithSlot = (dayOfWeek: number, startTime: string, endTime: string) => {
    setForm({ ...INITIAL_FORM, dayOfWeek, startTime, endTime });
    setCreateDialog(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Horario Semanal
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualiza y gestiona los horarios de clase semanales
            </p>
          </div>

          {isAdmin && (
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                setForm({ ...INITIAL_FORM });
                setCreateDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Horario
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-[220px]">
            <Select
              value={filterClassId ? String(filterClassId) : "all"}
              onValueChange={(val) =>
                setFilterClassId(val === "all" ? undefined : Number(val))
              }
            >
              <SelectTrigger>
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
          </div>
          <div className="w-full sm:w-[220px]">
            <Select
              value={filterTeacherId ? String(filterTeacherId) : "all"}
              onValueChange={(val) =>
                setFilterTeacherId(val === "all" ? undefined : Number(val))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por docente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los docentes</SelectItem>
                {staff?.map((member: StaffMember) => (
                  <SelectItem key={member.id} value={String(member.id)}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Schedule Grid */}
        {schedulesLoading ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="space-y-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border-b border-r border-border px-3 py-3 text-left text-sm font-semibold text-muted-foreground w-[120px]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Hora
                    </div>
                  </th>
                  {DAY_NAMES.map((day, idx) => (
                    <th
                      key={idx}
                      className="border-b border-r border-border px-3 py-3 text-center text-sm font-semibold text-foreground last:border-r-0"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot, slotIdx) => {
                  const isBreak = slotIdx === BREAK_SLOT_INDEX;

                  return (
                    <tr
                      key={slotIdx}
                      className={isBreak ? "bg-amber-50/50" : slotIdx % 2 === 0 ? "" : "bg-muted/20"}
                    >
                      {/* Time column */}
                      <td className="border-b border-r border-border px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap align-top">
                        <div>{slot.start} - {slot.end}</div>
                        {isBreak && (
                          <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                            DESCANSO
                          </div>
                        )}
                      </td>

                      {/* Day columns */}
                      {DAY_NAMES.map((_, dayIdx) => {
                        const dayNumber = dayIdx + 1;
                        const cellSchedules = schedulesByDayAndSlot[dayNumber]?.[slot.start] || [];

                        return (
                          <td
                            key={dayIdx}
                            className="border-b border-r border-border px-1.5 py-1.5 align-top last:border-r-0 min-h-[60px]"
                          >
                            {isBreak && cellSchedules.length === 0 ? (
                              <div className="text-center text-[10px] text-amber-500 italic py-2">
                                Descanso
                              </div>
                            ) : cellSchedules.length > 0 ? (
                              <div className="space-y-1">
                                {cellSchedules.map((sch) => (
                                  <div
                                    key={sch.id}
                                    className={`rounded-md border px-2 py-1.5 text-xs group relative ${getBlockColor(sch.subjectId)}`}
                                  >
                                    <div className="font-semibold truncate">
                                      {sch.subject?.name || sch.title}
                                    </div>
                                    <div className="text-[10px] opacity-80 truncate">
                                      {sch.class?.name}
                                      {sch.section ? ` - ${sch.section.name}` : ""}
                                    </div>
                                    {sch.teacher && (
                                      <div className="text-[10px] opacity-70 truncate">
                                        {sch.teacher.name}
                                      </div>
                                    )}
                                    {sch.room && (
                                      <div className="text-[10px] opacity-60">
                                        Salon: {sch.room}
                                      </div>
                                    )}
                                    {isAdmin && (
                                      <button
                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-200"
                                        onClick={() => setDeleteId(sch.id)}
                                        title="Eliminar horario"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-600" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : isAdmin ? (
                              <button
                                className="w-full h-full min-h-[48px] flex items-center justify-center text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/30 rounded transition-colors"
                                onClick={() => openCreateWithSlot(dayNumber, slot.start, slot.end)}
                                title="Agregar horario"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="min-h-[48px]" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state when no schedules and not loading */}
        {!schedulesLoading && (!schedules || schedules.length === 0) && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              No hay horarios registrados.
              {isAdmin && " Haz clic en \"Nuevo Horario\" o en una celda vacia para agregar uno."}
            </p>
          </div>
        )}

        {/* ===================== CREATE DIALOG ===================== */}
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Nuevo Horario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Day and Time */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dia *</label>
                  <Select
                    value={String(form.dayOfWeek)}
                    onValueChange={(val) =>
                      setForm({ ...form, dayOfWeek: Number(val) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_NAMES.map((day, idx) => (
                        <SelectItem key={idx} value={String(idx + 1)}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hora Inicio *</label>
                  <Select
                    value={form.startTime}
                    onValueChange={(val) => {
                      const slot = TIME_SLOTS.find((s) => s.start === val);
                      setForm({
                        ...form,
                        startTime: val,
                        endTime: slot?.end || form.endTime,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Inicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot.start} value={slot.start}>
                          {slot.start}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hora Fin *</label>
                  <Select
                    value={form.endTime}
                    onValueChange={(val) => setForm({ ...form, endTime: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Fin" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot.end} value={slot.end}>
                          {slot.end}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Class */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Curso *</label>
                <Select
                  value={form.classId ? String(form.classId) : ""}
                  onValueChange={(val) =>
                    setForm({
                      ...form,
                      classId: Number(val),
                      sectionId: 0,
                      subjectId: 0,
                    })
                  }
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

              {/* Section and Subject */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Seccion *</label>
                  <Select
                    value={form.sectionId ? String(form.sectionId) : ""}
                    onValueChange={(val) =>
                      setForm({ ...form, sectionId: Number(val) })
                    }
                    disabled={!form.classId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar seccion" />
                    </SelectTrigger>
                    <SelectContent>
                      {formSections?.map((sec) => (
                        <SelectItem key={sec.id} value={String(sec.id)}>
                          {sec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Materia *</label>
                  <Select
                    value={form.subjectId ? String(form.subjectId) : ""}
                    onValueChange={(val) =>
                      setForm({ ...form, subjectId: Number(val) })
                    }
                    disabled={!form.classId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {formSubjects?.map((sub) => (
                        <SelectItem key={sub.id} value={String(sub.id)}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Teacher */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Docente *</label>
                <Select
                  value={form.teacherId ? String(form.teacherId) : ""}
                  onValueChange={(val) =>
                    setForm({ ...form, teacherId: Number(val) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff?.map((member: StaffMember) => (
                      <SelectItem key={member.id} value={String(member.id)}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Room */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Salon</label>
                <Input
                  placeholder="Ej: Salon 101, Lab. Informatica"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialog(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleCreate}
                disabled={createSchedule.isPending}
              >
                {createSchedule.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Horario"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===================== DELETE CONFIRMATION ===================== */}
        <AlertDialog
          open={!!deleteId}
          onOpenChange={(open) => {
            if (!open) setDeleteId(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Horario</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion no se puede deshacer. Se eliminara permanentemente este horario del calendario.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDelete}
              >
                {deleteSchedule.isPending ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
