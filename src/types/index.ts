export interface Organization {
  id: number;
  name: string;
  code: string;
  _count?: { classes: number; students: number; subjects: number; sedes: number };
}

export interface Sede {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  organizationId: number;
  organization?: Organization;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  cargo?: string;
  avatar?: string;
  active: boolean;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'ACCOUNTANT' | 'STUDENT' | 'PARENT';

export interface Student {
  id: number;
  admissionNo: string;
  name: string;
  lastName?: string;
  dateOfBirth?: string;
  gender: string;
  bloodGroup?: string;
  religion?: string;
  nationality?: string;
  photo?: string;
  email?: string;
  phone?: string;

  // Identificacion
  tipoIdentificacion?: string;
  numeroIdentificacion?: string;
  fechaExpedicion?: string;
  lugarExpedicion?: string;
  lugarNacimiento?: string;

  // Seguridad Social
  tipoSalud?: string;
  numeroContrato?: string;
  numeroPoliza?: string;
  numeroCotizacion?: string;
  certificado?: string;
  eps?: string;

  // Responsable / Acudiente
  responsableTipo?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  acudienteNombre?: string;
  acudienteTelefono?: string;
  acudienteEmail?: string;
  acudienteOcupacion?: string;

  address?: string;
  classId: number;
  sectionId: number;
  organizationId?: number;
  sedeId?: number;
  balance?: number;
  enrollmentDate: string;
  exalumno?: boolean;
  fechaSalida?: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  class: ClassInfo;
  section: SectionInfo;
  sede?: Sede;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSubjectInfo {
  id: number;
  classId: number;
  subjectId: number;
  class?: ClassInfo;
  subject?: SubjectInfo;
}

export interface ClassInfo {
  id: number;
  name: string;
  order: number;
  sessionId: number;
  category?: 'REGULAR' | 'TECNICA';
  organizationId?: number;
  sections?: SectionInfo[];
  classSubjects?: ClassSubjectInfo[];
  _count?: { students: number };
}

export interface SectionInfo {
  id: number;
  name: string;
  classId: number;
  _count?: { students: number };
}

export interface SubjectInfo {
  id: number;
  name: string;
  code: string;
  organizationId?: number;
  classSubjects?: ClassSubjectInfo[];
}

export interface SearchResult {
  id: number;
  name: string;
  type: 'STUDENT' | 'TEACHER' | 'THIRD_PARTY';
  detail: string;
}

export interface AcademicSession {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface StaffMember {
  id: number;
  name: string;
  department?: string;
  designation?: string;
  phone?: string;
  email?: string;
  joinDate: string;
  userId?: number;
  user?: { id: number; email: string; role: string; active: boolean };
  teacherAssignments?: TeacherAssignment[];
  staffOrgs?: Array<{ id: number; organizationId: number; organization?: Organization }>;
}

export interface TeacherAssignment {
  id: number;
  teacherId: number;
  subjectId: number;
  classId: number;
  sectionId: number;
  teacher?: StaffMember;
  subject?: SubjectInfo;
  class?: ClassInfo;
  section?: SectionInfo;
}

export interface Attendance {
  id: number;
  studentId: number;
  sectionId: number;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  student?: { id: number; name: string; admissionNo: string };
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY';

export interface Fee {
  id: number;
  studentId: number;
  feeTypeId: number;
  amount: number;
  dueDate: string;
  status: FeeStatus;
  student?: { id: number; name: string; admissionNo: string; class: ClassInfo; section: SectionInfo };
  feeType?: FeeType;
  payments?: Payment[];
  totalPaid?: number;
  balance?: number;
}

export type FeeStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';

export interface FeeType {
  id: number;
  name: string;
}

export interface Payment {
  id: number;
  feeId: number;
  studentId: number;
  amount: number;
  date: string;
  method: string;
  reference?: string;
}

export interface Transaction {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: number;
  date: string;
  category: string;
  status: string;
  organizationId?: number;
}

export interface ExamGroup {
  id: number;
  name: string;
  sessionId: number;
  _count?: { exams: number };
}

export interface Exam {
  id: number;
  examGroupId: number;
  subjectId: number;
  classId: number;
  date: string;
  startTime?: string;
  duration?: number;
  maxMarks: number;
  subject?: SubjectInfo;
  class?: ClassInfo;
  examGroup?: ExamGroup;
  _count?: { marks: number };
}

export interface Mark {
  id: number;
  examId: number;
  studentId: number;
  marksObtained: number;
  remarks?: string;
  student?: { id: number; name: string; admissionNo: string };
  exam?: Exam;
}

export interface GradeScale {
  id: number;
  name: string;
  minMarks: number;
  maxMarks: number;
  grade: string;
  gpa: number;
}

export interface AppEvent {
  id: number | string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  type: 'exam' | 'meeting' | 'event' | 'deadline';
}

export interface DashboardStats {
  totalStudents: number;
  activeStaff: number;
  teacherCount: number;
  adminCount: number;
  monthlyIncome: number;
  monthlyExpense: number;
  incomeGrowth: number;
  attendanceToday: {
    present: number;
    absent: number;
    total: number;
    percentage: number;
  };
  attendanceWeekly: Array<{ day: string; presentes: number; ausentes: number }>;
  financeMonthly: Array<{ month: string; ingresos: number; egresos: number }>;
  studentDistribution: Array<{ name: string; value: number; color: string }>;
  pendingFees: Array<{ id: number; name: string; class: string; amount: number; daysOverdue: number }>;
  upcomingEvents: Array<{ id: string; title: string; date: string; time: string; location: string; type: string }>;
  recentActivity: Array<{ id: string; type: string; title: string; description: string; time: string }>;
  academicSession: string;
}

export interface Schedule {
  id: number;
  title: string;
  description?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  classId?: number;
  sectionId?: number;
  subjectId?: number;
  teacherId?: number;
  organizationId?: number;
  class?: ClassInfo;
  section?: SectionInfo;
  subject?: SubjectInfo;
  teacher?: StaffMember;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  [key: string]: any;
}
