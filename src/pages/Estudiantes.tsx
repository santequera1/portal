import { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Loader2,
} from "lucide-react";

import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useAddStudentBalance } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useSedes } from "@/hooks/useSedes";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import type { Student } from "@/types";

// ---------------------------------------------------------------------------
// Zod schema for create / edit student form
// ---------------------------------------------------------------------------
const studentFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().optional(),
  gender: z.enum(["Masculino", "Femenino"], {
    required_error: "Selecciona el genero",
  }),
  dateOfBirth: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  bloodGroup: z.string().optional(),

  // Identificacion
  tipoIdentificacion: z.string().optional(),
  numeroIdentificacion: z.string().optional(),
  fechaExpedicion: z.string().optional(),

  // Curso
  classId: z.coerce.number({ required_error: "Selecciona el curso" }).min(1, "Selecciona el curso"),
  sectionId: z.coerce.number({ required_error: "Selecciona la seccion" }).min(1, "Selecciona la seccion"),
  sedeId: z.coerce.number().optional(),

  // Seguridad Social
  tipoSalud: z.string().optional(),
  eps: z.string().optional(),
  numeroContrato: z.string().optional(),
  numeroPoliza: z.string().optional(),
  numeroCotizacion: z.string().optional(),
  certificado: z.string().optional(),

  // Historial
  exalumno: z.boolean().optional(),
  fechaSalida: z.string().optional(),

  // Responsable
  responsableTipo: z.string().optional(),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  acudienteNombre: z.string().optional(),
  acudienteTelefono: z.string().optional(),
  acudienteEmail: z.string().optional(),
  acudienteOcupacion: z.string().optional(),

  address: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

const EPS_OPTIONS = [
  "Familiar de Colombia",
  "Nueva EPS",
  "Salud Total",
  "Cajacopi",
  "Anas Wayuu",
  "Sanitas",
  "A1",
] as const;

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(name: string, lastName?: string) {
  const full = lastName ? `${name} ${lastName}` : name;
  return full
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getFullName(student: Student) {
  return student.lastName ? `${student.name} ${student.lastName}` : student.name;
}

const statusConfig: Record<Student["status"], { label: string; className: string }> = {
  active: { label: "Activo", className: "bg-success/10 text-success" },
  inactive: { label: "Inactivo", className: "bg-muted text-muted-foreground" },
  graduated: { label: "Graduado", className: "bg-primary/10 text-primary" },
  transferred: { label: "Trasladado", className: "bg-warning/10 text-warning" },
};

// ---------------------------------------------------------------------------
// Loading skeleton for table rows
// ---------------------------------------------------------------------------
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-36" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
export default function Estudiantes() {
  const { toast } = useToast();
  const { selectedOrgId } = useOrganization();

  // ---- Filter / pagination state ----
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("");
  const [sectionFilter, setSectionFilter] = useState<string>("");
  const [sedeFilter, setSedeFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // ---- Sheet / dialog state ----
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // ---- Debounce search input ----
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimer) clearTimeout(searchTimer);
      const timer = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 400);
      setSearchTimer(timer);
    },
    [searchTimer],
  );

  // ---- Data queries ----
  const { data: classesData } = useClasses();
  const classes = classesData ?? [];

  const { data: sedesDataList } = useSedes(selectedOrgId);
  const sedesList = sedesDataList ?? [];

  const studentsQuery = useStudents({
    page,
    search: debouncedSearch || undefined,
    classId: classFilter ? Number(classFilter) : undefined,
    sectionId: sectionFilter ? Number(sectionFilter) : undefined,
    sedeId: sedeFilter ? Number(sedeFilter) : undefined,
  });

  const students = studentsQuery.data?.students ?? [];
  const total = studentsQuery.data?.total ?? 0;
  const totalPages = studentsQuery.data?.totalPages ?? 1;
  const isLoading = studentsQuery.isLoading;

  // ---- Mutations ----
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  // ---- Derived: sections for the selected class filter ----
  const filteredSections = useMemo(() => {
    if (!classFilter) return [];
    const cls = classes.find((c) => c.id === Number(classFilter));
    return cls?.sections ?? [];
  }, [classFilter, classes]);

  // ---- Form ----
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      lastName: "",
      gender: undefined,
      dateOfBirth: "",
      email: "",
      phone: "",
      bloodGroup: "",
      tipoIdentificacion: "",
      numeroIdentificacion: "",
      fechaExpedicion: "",
      classId: 0,
      sectionId: 0,
      sedeId: 0,
      tipoSalud: "",
      eps: "",
      numeroContrato: "",
      numeroPoliza: "",
      numeroCotizacion: "",
      certificado: "",
      exalumno: false,
      fechaSalida: "",
      responsableTipo: "",
      fatherName: "",
      fatherPhone: "",
      motherName: "",
      motherPhone: "",
      acudienteNombre: "",
      acudienteTelefono: "",
      acudienteEmail: "",
      acudienteOcupacion: "",
      address: "",
    },
  });

  const selectedFormClassId = form.watch("classId");
  const formSections = useMemo(() => {
    if (!selectedFormClassId) return [];
    const cls = classes.find((c) => c.id === Number(selectedFormClassId));
    return cls?.sections ?? [];
  }, [selectedFormClassId, classes]);

  // Determine organization based on selected class
  const formOrganizationId = useMemo(() => {
    if (!selectedFormClassId) return undefined;
    const cls = classes.find((c) => c.id === Number(selectedFormClassId));
    return cls?.organizationId;
  }, [selectedFormClassId, classes]);

  // Fetch sedes for the selected organization
  const { data: sedesData } = useSedes(formOrganizationId);
  const formSedes = sedesData ?? [];

  // ---- Open sheet for create ----
  const handleOpenCreate = useCallback(() => {
    setEditingStudent(null);
    form.reset({
      name: "",
      lastName: "",
      gender: undefined,
      dateOfBirth: "",
      email: "",
      phone: "",
      bloodGroup: "",
      tipoIdentificacion: "",
      numeroIdentificacion: "",
      fechaExpedicion: "",
      classId: 0,
      sectionId: 0,
      sedeId: 0,
      tipoSalud: "",
      eps: "",
      numeroContrato: "",
      numeroPoliza: "",
      numeroCotizacion: "",
      certificado: "",
      exalumno: false,
      fechaSalida: "",
      responsableTipo: "",
      fatherName: "",
      fatherPhone: "",
      motherName: "",
      motherPhone: "",
      acudienteNombre: "",
      acudienteTelefono: "",
      acudienteEmail: "",
      acudienteOcupacion: "",
      address: "",
    });
    setSheetOpen(true);
  }, [form]);

  // ---- Open sheet for edit ----
  const handleOpenEdit = useCallback(
    (student: Student) => {
      setEditingStudent(student);
      form.reset({
        name: student.name,
        lastName: student.lastName ?? "",
        gender: student.gender as "Masculino" | "Femenino",
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : "",
        email: student.email ?? "",
        phone: student.phone ?? "",
        bloodGroup: student.bloodGroup ?? "",
        tipoIdentificacion: student.tipoIdentificacion ?? "",
        numeroIdentificacion: student.numeroIdentificacion ?? "",
        fechaExpedicion: student.fechaExpedicion ? student.fechaExpedicion.slice(0, 10) : "",
        classId: student.classId,
        sectionId: student.sectionId,
        sedeId: student.sedeId ?? 0,
        tipoSalud: student.tipoSalud ?? "",
        eps: student.eps ?? "",
        numeroContrato: student.numeroContrato ?? "",
        numeroPoliza: student.numeroPoliza ?? "",
        numeroCotizacion: student.numeroCotizacion ?? "",
        certificado: student.certificado ?? "",
        exalumno: student.exalumno ?? false,
        fechaSalida: student.fechaSalida ? student.fechaSalida.slice(0, 10) : "",
        responsableTipo: student.responsableTipo ?? "",
        fatherName: student.fatherName ?? "",
        fatherPhone: student.fatherPhone ?? "",
        motherName: student.motherName ?? "",
        motherPhone: student.motherPhone ?? "",
        acudienteNombre: student.acudienteNombre ?? "",
        acudienteTelefono: student.acudienteTelefono ?? "",
        acudienteEmail: student.acudienteEmail ?? "",
        acudienteOcupacion: student.acudienteOcupacion ?? "",
        address: student.address ?? "",
      });
      setSheetOpen(true);
    },
    [form],
  );

  // ---- Submit handler (create or update) ----
  const onSubmit = useCallback(
    async (values: StudentFormValues) => {
      try {
        if (editingStudent) {
          await updateStudent.mutateAsync({
            id: editingStudent.id,
            data: values,
          });
          const fullName = values.lastName ? `${values.name} ${values.lastName}` : values.name;
          toast({
            title: "Estudiante actualizado",
            description: `${fullName} ha sido actualizado exitosamente.`,
          });
        } else {
          await createStudent.mutateAsync({ ...values, organizationId: selectedOrgId });
          const fullName = values.lastName ? `${values.name} ${values.lastName}` : values.name;
          toast({
            title: "Estudiante registrado",
            description: `${fullName} ha sido registrado exitosamente.`,
          });
        }
        setSheetOpen(false);
        form.reset();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Ocurrio un error inesperado";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    },
    [editingStudent, updateStudent, createStudent, toast, form],
  );

  // ---- Delete handler ----
  const handleConfirmDelete = useCallback(async () => {
    if (!studentToDelete) return;
    try {
      await deleteStudent.mutateAsync(studentToDelete.id);
      toast({
        title: "Estudiante eliminado",
        description: `${studentToDelete.name} ha sido eliminado del sistema.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ocurrio un error inesperado";
      toast({
        title: "Error al eliminar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  }, [studentToDelete, deleteStudent, toast]);

  // ---- Pagination helpers ----
  const paginationRange = useMemo(() => {
    const delta = 2;
    const range: (number | "ellipsis")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== "ellipsis") {
        range.push("ellipsis");
      }
    }
    return range;
  }, [page, totalPages]);

  // ---- Calculate showing range for info text ----
  const showingFrom = total === 0 ? 0 : (page - 1) * (studentsQuery.data?.limit ?? 10) + 1;
  const showingTo = Math.min(page * (studentsQuery.data?.limit ?? 10), total);

  // ---- Handle class filter change (reset section filter) ----
  const handleClassFilterChange = useCallback((value: string) => {
    setClassFilter(value === "all" ? "" : value);
    setSectionFilter("");
    setPage(1);
  }, []);

  const handleSectionFilterChange = useCallback((value: string) => {
    setSectionFilter(value === "all" ? "" : value);
    setPage(1);
  }, []);

  const handleSedeFilterChange = useCallback((value: string) => {
    setSedeFilter(value === "all" ? "" : value);
    setPage(1);
  }, []);

  const isMutating = createStudent.isPending || updateStudent.isPending;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* ---------------------------------------------------------------- */}
        {/* Page Header                                                       */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Estudiantes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona la informacion de todos los estudiantes
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Admision
          </Button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Filters                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-card">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, numero de admision..."
                className="pl-9"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Class filter */}
            <Select value={classFilter || "all"} onValueChange={handleClassFilterChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {classes.filter(c => c.category !== 'TECNICA').length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Primaria y Bachillerato</SelectLabel>
                    {classes.filter(c => c.category !== 'TECNICA').map((cls) => (
                      <SelectItem key={cls.id} value={String(cls.id)}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {classes.filter(c => c.category === 'TECNICA').length > 0 && (
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

            {/* Section filter */}
            <Select
              value={sectionFilter || "all"}
              onValueChange={handleSectionFilterChange}
              disabled={!classFilter}
            >
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Seccion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {filteredSections.map((sec) => (
                  <SelectItem key={sec.id} value={String(sec.id)}>
                    {sec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sede filter */}
            {sedesList.length > 0 && (
              <Select
                value={sedeFilter || "all"}
                onValueChange={handleSedeFilterChange}
              >
                <SelectTrigger className="w-full md:w-[160px]">
                  <SelectValue placeholder="Sede" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sedes</SelectItem>
                  {sedesList.map((sede) => (
                    <SelectItem key={sede.id} value={String(sede.id)}>
                      {sede.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Export button */}
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Students Table                                                    */}
        {/* ---------------------------------------------------------------- */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">#Admision</TableHead>
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Curso</TableHead>
                  <TableHead className="font-semibold">Seccion</TableHead>
                  <TableHead className="font-semibold">Genero</TableHead>
                  <TableHead className="font-semibold">Padre/Madre</TableHead>
                  <TableHead className="font-semibold">Telefono</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UserPlus className="h-10 w-10" />
                        <p className="text-sm">No se encontraron estudiantes</p>
                        {(debouncedSearch || classFilter || sectionFilter) && (
                          <p className="text-xs">
                            Intenta ajustar los filtros de busqueda
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student, index) => {
                    const status = statusConfig[student.status] ?? statusConfig.inactive;
                    const parentDisplay = student.fatherName || student.motherName || student.acudienteNombre || "-";
                    const phoneDisplay = student.fatherPhone || student.motherPhone || student.acudienteTelefono || "-";
                    const fullName = getFullName(student);

                    return (
                      <TableRow
                        key={student.id}
                        className={`table-row-hover ${index % 2 === 0 ? "" : "bg-muted/30"}`}
                      >
                        {/* Admission No */}
                        <TableCell className="font-mono text-sm">
                          {student.admissionNo}
                        </TableCell>

                        {/* Name with avatar */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {getInitials(student.name, student.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{fullName}</span>
                          </div>
                        </TableCell>

                        {/* Class */}
                        <TableCell>{student.class?.name ?? "-"}</TableCell>

                        {/* Section */}
                        <TableCell>{student.section?.name ?? "-"}</TableCell>

                        {/* Gender */}
                        <TableCell>{student.gender}</TableCell>

                        {/* Parent */}
                        <TableCell>{parentDisplay}</TableCell>

                        {/* Phone */}
                        <TableCell className="font-mono text-sm">
                          {phoneDisplay}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge variant="secondary" className={status.className}>
                            {status.label}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setProfileStudent(student); setProfileOpen(true); }}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(student)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setStudentToDelete(student);
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Pagination                                                      */}
          {/* -------------------------------------------------------------- */}
          {!isLoading && total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-border gap-3">
              <p className="text-sm text-muted-foreground">
                Mostrando {showingFrom} a {showingTo} de {total} estudiantes
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Anterior</span>
                </Button>

                {paginationRange.map((item, idx) =>
                  item === "ellipsis" ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant="outline"
                      size="sm"
                      className={
                        page === item
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : ""
                      }
                      onClick={() => setPage(item)}
                    >
                      {item}
                    </Button>
                  ),
                )}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Siguiente</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* Create / Edit Student Sheet                                        */}
      {/* ================================================================== */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-heading">
              {editingStudent ? "Editar Estudiante" : "Nueva Admision"}
            </SheetTitle>
            <SheetDescription>
              {editingStudent
                ? "Actualiza la informacion del estudiante."
                : "Completa el formulario para registrar un nuevo estudiante."}
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* ---- DATOS PERSONALES ---- */}
              <div className="border-b border-border pb-2">
                <p className="text-sm font-semibold text-foreground">Datos del estudiante</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Juan Carlos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Perez Garcia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genero *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Femenino">Femenino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de nacimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electronico</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 300-123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de sangre</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BLOOD_TYPES.map((bt) => (
                            <SelectItem key={bt} value={bt}>
                              {bt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ---- IDENTIFICACION ---- */}
              <div className="border-b border-border pb-2 pt-2">
                <p className="text-sm font-semibold text-foreground">Identificacion</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tipoIdentificacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CC">Cedula de Ciudadania</SelectItem>
                          <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                          <SelectItem value="CE">Cedula de Extranjeria</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numeroIdentificacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 1001234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fechaExpedicion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha expedicion</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ---- CURSO ---- */}
              <div className="border-b border-border pb-2 pt-2">
                <p className="text-sm font-semibold text-foreground">Institucion y curso</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curso *</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(Number(v));
                          form.setValue("sectionId", 0);
                        }}
                        value={field.value ? String(field.value) : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar curso" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes.filter(c => c.category !== 'TECNICA').length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Minerva - Primaria y Bachillerato</SelectLabel>
                              {classes.filter(c => c.category !== 'TECNICA').map((cls) => (
                                <SelectItem key={cls.id} value={String(cls.id)}>
                                  {cls.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                          {classes.filter(c => c.category === 'TECNICA').length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Fundisalud - Carreras Tecnicas</SelectLabel>
                              {classes.filter(c => c.category === 'TECNICA').map((cls) => (
                                <SelectItem key={cls.id} value={String(cls.id)}>
                                  {cls.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seccion *</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(Number(v))}
                        value={field.value ? String(field.value) : ""}
                        disabled={!selectedFormClassId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar seccion" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {formSections.map((sec) => (
                            <SelectItem key={sec.id} value={String(sec.id)}>
                              {sec.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ---- SEDE ---- */}
              {formSedes.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="sedeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sede</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(Number(v))}
                          value={field.value ? String(field.value) : ""}
                          disabled={!formOrganizationId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar sede" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {formSedes.map((sede) => (
                              <SelectItem key={sede.id} value={String(sede.id)}>
                                {sede.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* ---- SEGURIDAD SOCIAL ---- */}
              <div className="border-b border-border pb-2 pt-2">
                <p className="text-sm font-semibold text-foreground">Seguridad social</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipoSalud"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de cobertura</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue("eps", "");
                        }}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EPS">EPS</SelectItem>
                          <SelectItem value="SISBEN">SISBEN</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("tipoSalud") === "EPS" && (
                  <FormField
                    control={form.control}
                    name="eps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>EPS</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar EPS" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EPS_OPTIONS.map((eps) => (
                              <SelectItem key={eps} value={eps}>
                                {eps}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("tipoSalud") === "SISBEN" && (
                  <FormField
                    control={form.control}
                    name="eps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SISBEN</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Grupo A, Subgrupo 5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numeroContrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Contrato</FormLabel>
                      <FormControl>
                        <Input placeholder="Numero de contrato" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numeroPoliza"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Poliza</FormLabel>
                      <FormControl>
                        <Input placeholder="Numero de poliza" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numeroCotizacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Cotizacion</FormLabel>
                      <FormControl>
                        <Input placeholder="Numero de cotizacion" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="certificado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificado</FormLabel>
                      <FormControl>
                        <Input placeholder="Certificado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ---- INFO ACADEMICA ---- */}
              <div className="border-b border-border pb-2 pt-2">
                <p className="text-sm font-semibold text-foreground">Informacion academica</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <FormField
                  control={form.control}
                  name="exalumno"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0 p-3 rounded-lg border border-border">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer">Exalumno</FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch("exalumno") && (
                  <FormField
                    control={form.control}
                    name="fechaSalida"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de salida</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* ---- RESPONSABLE ---- */}
              <div className="border-b border-border pb-2 pt-2">
                <p className="text-sm font-semibold text-foreground">Responsable</p>
              </div>

              <FormField
                control={form.control}
                name="responsableTipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de responsable</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar responsable" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Padre">Padre</SelectItem>
                        <SelectItem value="Madre">Madre</SelectItem>
                        <SelectItem value="Acudiente">Acudiente</SelectItem>
                        <SelectItem value="Estudiante">Estudiante (mayor de edad)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Father fields */}
              {(form.watch("responsableTipo") === "Padre" || !form.watch("responsableTipo")) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fatherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del padre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del padre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fatherPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefono del padre</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: 301-234-5678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Mother fields */}
              {(form.watch("responsableTipo") === "Madre" || !form.watch("responsableTipo")) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="motherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la madre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de la madre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="motherPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefono de la madre</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: 302-345-6789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Acudiente fields */}
              {form.watch("responsableTipo") === "Acudiente" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="acudienteNombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del acudiente</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="acudienteTelefono"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefono del acudiente</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: 300-123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="acudienteEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email del acudiente</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="acudienteOcupacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ocupacion del acudiente</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Comerciante" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direccion</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Direccion de residencia"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSheetOpen(false)}
                  disabled={isMutating}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={isMutating}
                >
                  {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingStudent ? "Guardar Cambios" : "Registrar Estudiante"}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* ================================================================== */}
      {/* Delete Confirmation Dialog                                          */}
      {/* ================================================================== */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar estudiante</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminara permanentemente a{" "}
              <span className="font-semibold text-foreground">
                {studentToDelete?.name}
              </span>{" "}
              del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteStudent.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteStudent.isPending}
            >
              {deleteStudent.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================================================================== */}
      {/* Student Profile Sheet                                               */}
      {/* ================================================================== */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-heading">Perfil del Estudiante</SheetTitle>
            <SheetDescription>
              Informacion detallada de {profileStudent?.name}
            </SheetDescription>
          </SheetHeader>

          {profileStudent && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getInitials(profileStudent.name, profileStudent.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{getFullName(profileStudent)}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{profileStudent.admissionNo}</p>
                  <Badge variant="secondary" className={statusConfig[profileStudent.status]?.className || ""}>
                    {statusConfig[profileStudent.status]?.label || profileStudent.status}
                  </Badge>
                </div>
              </div>

              {/* Contacto */}
              {(profileStudent.email || profileStudent.phone || profileStudent.bloodGroup) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contacto y Salud</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {profileStudent.email && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Correo</p>
                        <p className="font-medium text-sm">{profileStudent.email}</p>
                      </div>
                    )}
                    {profileStudent.phone && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Telefono</p>
                        <p className="font-medium font-mono">{profileStudent.phone}</p>
                      </div>
                    )}
                    {profileStudent.bloodGroup && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Tipo de Sangre</p>
                        <p className="font-medium">{profileStudent.bloodGroup}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Saldo */}
              {profileStudent.balance !== undefined && profileStudent.balance > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Finanzas</h4>
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-xs text-muted-foreground">Saldo Disponible</p>
                    <p className="font-mono font-bold text-success text-lg">
                      ${profileStudent.balance.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              )}

              {/* Identificacion */}
              {(profileStudent.tipoIdentificacion || profileStudent.numeroIdentificacion) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Identificacion</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="font-medium">{profileStudent.tipoIdentificacion === 'CC' ? 'Cedula' : profileStudent.tipoIdentificacion === 'TI' ? 'Tarjeta de Identidad' : profileStudent.tipoIdentificacion === 'CE' ? 'Cedula Extranjeria' : profileStudent.tipoIdentificacion || "-"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Numero</p>
                      <p className="font-medium font-mono">{profileStudent.numeroIdentificacion || "-"}</p>
                    </div>
                    {profileStudent.fechaExpedicion && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Fecha de Expedicion</p>
                        <p className="font-medium">{new Date(profileStudent.fechaExpedicion).toLocaleDateString("es-CO")}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Academic Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informacion Academica</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Curso</p>
                    <p className="font-medium">{profileStudent.class?.name || "-"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Seccion</p>
                    <p className="font-medium">{profileStudent.section?.name || "-"}</p>
                  </div>
                  {profileStudent.sede && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Sede</p>
                      <p className="font-medium">{profileStudent.sede.name}</p>
                    </div>
                  )}
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Genero</p>
                    <p className="font-medium">{profileStudent.gender}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Fecha de Nacimiento</p>
                    <p className="font-medium">
                      {profileStudent.dateOfBirth
                        ? new Date(profileStudent.dateOfBirth).toLocaleDateString("es-CO")
                        : "-"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Fecha de Ingreso</p>
                    <p className="font-medium">
                      {new Date(profileStudent.enrollmentDate).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  {profileStudent.exalumno && (
                    <div className="p-3 rounded-lg bg-warning/10">
                      <p className="text-xs text-muted-foreground">Exalumno - Fecha de Salida</p>
                      <p className="font-medium">
                        {profileStudent.fechaSalida
                          ? new Date(profileStudent.fechaSalida).toLocaleDateString("es-CO")
                          : "Sin fecha"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Seguridad Social */}
              {(profileStudent.eps || profileStudent.numeroContrato || profileStudent.numeroPoliza) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Seguridad Social</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(profileStudent.tipoSalud || profileStudent.eps) && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">{profileStudent.tipoSalud || "EPS / SISBEN"}</p>
                        <p className="font-medium">{profileStudent.eps || "-"}</p>
                      </div>
                    )}
                    {profileStudent.numeroContrato && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">No. Contrato</p>
                        <p className="font-medium font-mono">{profileStudent.numeroContrato}</p>
                      </div>
                    )}
                    {profileStudent.numeroPoliza && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">No. Poliza</p>
                        <p className="font-medium font-mono">{profileStudent.numeroPoliza}</p>
                      </div>
                    )}
                    {profileStudent.numeroCotizacion && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">No. Cotizacion</p>
                        <p className="font-medium font-mono">{profileStudent.numeroCotizacion}</p>
                      </div>
                    )}
                    {profileStudent.certificado && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Certificado</p>
                        <p className="font-medium">{profileStudent.certificado}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Responsable / Acudientes */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Responsable {profileStudent.responsableTipo ? `(${profileStudent.responsableTipo})` : ""}
                </h4>
                <div className="space-y-2">
                  {profileStudent.fatherName && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Padre</p>
                      <p className="font-medium">{profileStudent.fatherName}</p>
                      {profileStudent.fatherPhone && (
                        <p className="text-sm text-muted-foreground font-mono">{profileStudent.fatherPhone}</p>
                      )}
                    </div>
                  )}
                  {profileStudent.motherName && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Madre</p>
                      <p className="font-medium">{profileStudent.motherName}</p>
                      {profileStudent.motherPhone && (
                        <p className="text-sm text-muted-foreground font-mono">{profileStudent.motherPhone}</p>
                      )}
                    </div>
                  )}
                  {profileStudent.acudienteNombre && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Acudiente</p>
                      <p className="font-medium">{profileStudent.acudienteNombre}</p>
                      {profileStudent.acudienteTelefono && (
                        <p className="text-sm text-muted-foreground font-mono">{profileStudent.acudienteTelefono}</p>
                      )}
                      {profileStudent.acudienteEmail && (
                        <p className="text-sm text-muted-foreground">{profileStudent.acudienteEmail}</p>
                      )}
                      {profileStudent.acudienteOcupacion && (
                        <p className="text-sm text-muted-foreground">Ocupacion: {profileStudent.acudienteOcupacion}</p>
                      )}
                    </div>
                  )}
                  {profileStudent.responsableTipo === "Estudiante" && (
                    <div className="p-3 rounded-lg bg-primary/5">
                      <p className="text-sm text-muted-foreground">El estudiante es su propio responsable (mayor de edad)</p>
                    </div>
                  )}
                  {!profileStudent.fatherName && !profileStudent.motherName && !profileStudent.acudienteNombre && profileStudent.responsableTipo !== "Estudiante" && (
                    <p className="text-sm text-muted-foreground">Sin informacion de responsable</p>
                  )}
                </div>
              </div>

              {/* Address */}
              {profileStudent.address && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Direccion</h4>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="font-medium">{profileStudent.address}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setProfileOpen(false);
                    handleOpenEdit(profileStudent);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setProfileOpen(false);
                    setStudentToDelete(profileStudent);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}
