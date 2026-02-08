import { z } from 'zod';

export const createStudentSchema = z.object({
  name: z.string().min(2, 'Minimo 2 caracteres'),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Masculino', 'Femenino']),
  bloodGroup: z.string().optional(),
  religion: z.string().optional(),
  nationality: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),

  // Identificacion
  tipoIdentificacion: z.string().optional(),
  numeroIdentificacion: z.string().optional(),
  fechaExpedicion: z.string().optional(),

  // Seguridad Social
  tipoSalud: z.string().optional(),
  numeroContrato: z.string().optional(),
  numeroPoliza: z.string().optional(),
  numeroCotizacion: z.string().optional(),
  certificado: z.string().optional(),
  eps: z.string().optional(),

  // Responsable / Acudiente
  responsableTipo: z.string().optional(),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  fatherEmail: z.string().email().optional().or(z.literal('')),
  fatherOccupation: z.string().optional(),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  acudienteNombre: z.string().optional(),
  acudienteTelefono: z.string().optional(),
  acudienteEmail: z.string().email().optional().or(z.literal('')),
  acudienteOcupacion: z.string().optional(),

  address: z.string().optional(),
  classId: z.number({ required_error: 'Clase requerida' }),
  sectionId: z.number({ required_error: 'Seccion requerida' }),
  organizationId: z.number().optional().nullable(),

  // Historial academico
  exalumno: z.boolean().optional(),
  fechaSalida: z.string().optional(),
});

export const updateStudentSchema = createStudentSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'graduated', 'transferred']).optional(),
});
