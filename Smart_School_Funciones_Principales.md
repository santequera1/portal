# Smart School - Funciones Principales para Sistema Simplificado

> Documento de referencia para crear un prompt de desarrollo de un School Management System inspirado en Smart School by QDOCS.
Lo llamaremos cole
---

## 1. SISTEMA DE USUARIOS Y ROLES

### 1.1 Roles de Usuario (8 roles integrados)
- **Super Admin**: Acceso total al sistema, configuración general, gestión de sesiones académicas, backup/restore de base de datos
- **Admin**: Gestión completa del colegio (estudiantes, profesores, finanzas, reportes)
- **Contador (Accountant)**: Gestión de cobro de cuotas, ingresos, egresos, reportes financieros
- **Profesor (Teacher)**: Asistencia de estudiantes, ingreso de notas, tareas, plan de lección, horarios
- **Recepcionista (Receptionist)**: Gestión de recepción/front office: consultas de admisión, libro de visitantes, registro de llamadas, despacho postal
- **Bibliotecario (Librarian)**: Gestión de libros, préstamos, devoluciones, miembros de biblioteca
- **Padre/Madre (Parent)**: Consulta de información de sus hijos (notas, asistencia, cuotas, tareas), pago de cuotas en línea, comunicación con profesores
- **Estudiante (Student)**: Consulta de su información personal, notas, asistencia, tareas, horarios, material de descarga

### 1.2 Funciones de Autenticación
- Login con usuario/contraseña
- Login con número de teléfono (opcional)
- Recuperación de contraseña por email
- Permisos y roles configurables por módulo (qué puede ver/editar cada rol)
- Modo restringido para profesores (solo ven datos de sus clases/materias asignadas)

---

## 2. GESTIÓN DE ESTUDIANTES

### 2.1 Admisión de Estudiantes
- Formulario de admisión con campos configurables
- Datos personales: nombre completo, fecha de nacimiento, género, foto, grupo sanguíneo, religión, nacionalidad
- Datos del padre/madre/tutor: nombre, ocupación, teléfono, email, foto, dirección
- Datos académicos: clase, sección, número de lista (roll number), fecha de admisión, número de admisión (auto-generado)
- Datos de escuela anterior (si aplica)
- Carga de múltiples documentos (acta de nacimiento, certificados, etc.)
- Campos personalizados (el admin puede crear campos adicionales según necesidad)

### 2.2 Perfil del Estudiante
- Vista completa del perfil con toda la información registrada
- Timeline/historial del estudiante (actividades, documentos subidos)
- Información de hermanos (siblings) vinculados
- Historial de sesiones académicas
- Documentos cargados
- Cuotas pagadas y pendientes 
- Historial de asistencia
- Notas/calificaciones

### 2.3 Admisión en Línea
- Formulario público de admisión online (accesible sin login)
- Revisión de solicitudes por el admin
- Aprobación/rechazo de solicitudes
- Impresión de recibo de admisión

### 2.4 Gestión de Estudiantes
- Listado de estudiantes por clase y sección
- Búsqueda y filtrado avanzado
- Promoción masiva de estudiantes al siguiente año/clase
- Estudiantes deshabilitados/egresados
- Generación de carnets/ID cards para estudiantes
- Generación de certificados personalizables
- **tipos de estudiantes)**: El estudiante puede ser un estudiante de primaria/bachillerato o de una carrera tecnica

---

## 3. GESTIÓN ACADÉMICA

### 3.1 Estructura Académica
- **Sesiones Académicas**: Gestión de años escolares (ej: 2025-2026), con posibilidad de cambiar la sesión activa
- **Clases (Grados)**: Crear y administrar grados/cursos  (ej: 1° Primaria, 2° Primaria...)
- **Secciones**: Subdivisiones dentro de cada clase (ej: Sección A, B, C)
- **Materias/Asignaturas**: Crear materias, asignarlas a clases
- **tipos de materias/asignaturas**: estas materias pueden ser de primaria/bachillerato o carrera tecnica
- **Asignación Clase-Profesor**: Asignar profesor director de grupo (class teacher) a cada clase/sección
- **Asignación Materia-Profesor**: Asignar profesor por materia a cada clase

### 3.2 Horario de Clases (Class Timetable)
- Crear horario semanal por clase/sección
- Asignar materia y profesor a cada bloque horario
- Configurar día de inicio de la semana
- Alerta si un profesor está asignado a múltiples clases en el mismo horario
- Vista del horario por clase y por profesor

### 3.3 Plan de Lección (Lesson Plan)
- Crear lecciones por materia
- Crear temas dentro de cada lección
- Planificar lecciones en el calendario semanal
- Estado del avance del syllabus

### 3.4 Tareas (Homework)
- Crear tareas por clase, sección y materia
- Fecha de entrega
- Adjuntar documentos
- Evaluación/calificación de tareas
- Reporte de tareas y calificaciones

### 3.5 Centro de Descargas (Download Center)
- Subir contenido descargable: syllabus, material de estudio, asignaciones
- Compartir con clases/secciones específicas
- Contenido accesible para estudiantes y profesores
- Página pública de contenido compartido

---

## 4. SISTEMA DE EXÁMENES Y CALIFICACIONES

### 4.1 Exámenes Presenciales
- **Grados de Calificación (Marks Grade)**: Definir escalas de calificación (se calificará de 1 a 5 con posibilidad de usar decimales)
- **Grupos de Examen (Exam Group)**: Crear grupos (ej: Primer Trimestre, Segundo Trimestre, o año)
- **Crear Exámenes**: Definir exámenes dentro de cada grupo
- **Programación de Examen (Exam Schedule)**: Fecha, hora, duración, sala por materia
- **Asignar estudiantes al examen**
- **Registro de Notas (Marks Entry)**: Ingreso de calificaciones por materia, soporte para múltiples campos (teoría, práctica, etc.)
- **Reporte de Progreso / Boleta de calificaciones**: Generación e impresión de boletas con notas, promedios, posición en clase
- **Reporte de notas consolidado por clase**

### 4.2 Exámenes en Línea (Online Examination)
- **Banco de Preguntas (Question Bank)**: Crear preguntas por materia (opción múltiple, verdadero/falso, completar)
- **Importar preguntas** desde archivo
- **Crear examen en línea**: Seleccionar preguntas del banco, definir duración, fecha, intentos
- **Asignar examen a clases/secciones**
- **Auto-calificación**: El sistema califica automáticamente
- **Reportes de resultados del examen en línea**

---

## 5. GESTIÓN DE ASISTENCIA

### 5.1 Asistencia de Estudiantes
- Toma de asistencia diaria por clase/sección
- Estados: Presente, Ausente, Tardanza, Medio Día, Festivo
- Tipos de asistencia configurables
- Toma de asistencia rápida en pocos clics (interfaz intuitiva)

### 5.2 Asistencia del Personal (Staff)
- Toma de asistencia diaria del personal/profesores
- Mismos estados que estudiantes

### 5.3 Reportes de Asistencia
- Reporte mensual de asistencia por clase/sección
- Reporte individual del estudiante
- Reporte por fecha
- Reporte de tipo de asistencia (cuántos presentes, ausentes por día)
- Reporte de asistencia del personal

---

## 6. GESTIÓN FINANCIERA / CUOTAS (FEES)

### 6.1 Configuración de Cuotas
- **Tipos de Cuota (Fees Type)**: Matrícula, mensualidad, transporte, laboratorio, uniforme, etc.
- **Grupos de Cuota (Fees Group)**: Agrupar tipos de cuota (ej: "Cuotas Primer Semestre")
- **Fees Master**: Asignar montos a cada tipo de cuota por clase
- **Descuentos de Cuota (Fees Discount)**: Crear descuentos por porcentaje o monto fijo, asignar a estudiantes específicos

### 6.2 Cobro de Cuotas
- Cobro individual por estudiante
- Búsqueda de estudiante por nombre, clase, número de admisión
- Pago total o parcial
- Métodos de pago: efectivo, cheque, transferencia bancaria
- Generación de recibo de pago (imprimible)
- Cuotas de transporte gestionadas por sesión académica
-por el momento será todo registrado manualmente

### 6.3 Reportes Financieros
- **Reporte de cuotas pagadas**: Estado de cuenta por estudiante
- **Reporte de cuotas pendientes (Balance Fees Report)**: Estudiantes con pagos atrasados por clase
- **Reporte de cuotas vencidas (Due Fees Report)**
- **Reporte de transacciones**: Historial completo de cobros
- **Gráficos y análisis**: Representación visual de ingresos por cuotas y gastos

### 6.4 Ingresos y Egresos del Colegio
- Registrar otros ingresos del colegio (no cuotas) con categorías
- Registrar egresos/gastos con categorías
- Subir comprobantes/recibos
- Reportes de ingresos vs egresos

---

## 7. RECURSOS HUMANOS (RRHH) / PERSONAL

### 7.1 Directorio de Personal
- Registro completo de empleados (profesores, administrativos, personal de servicio)
- Datos personales: nombre, foto, fecha de nacimiento, género, teléfono, email, dirección
- Datos laborales: departamento, designación/cargo, fecha de ingreso, calificaciones
- Documentos del empleado
- Generación de carnet/ID card del personal

### 7.2 Departamentos y Cargos
- Crear departamentos (Académico, Administrativo, Mantenimiento, etc.)
- Crear designaciones/cargos (Director, Coordinador, Profesor, Secretaria, etc.)

### 7.3 Gestión de Permisos/Licencias del Personal
- Definir tipos de licencia/permiso (enfermedad, personal, vacaciones, maternidad, etc.)
- Solicitud de permiso por el empleado
- Aprobación/rechazo por admin
- Solicitud de medio día
- Reporte de permisos por sesión académica

### 7.4 Nómina/Payroll (básico)
- Definir salario base por empleado
- Gestión de deducciones y bonificaciones

---

## 8. COMUNICACIÓN Y NOTIFICACIONES

### 8.1 Tablón de Avisos (Notice Board)
- Publicar avisos/noticias visibles para roles específicos (profesores, estudiantes, padres)
- Fecha de publicación y vencimiento

### 8.2 Mensajería Interna
- Chat interno entre usuarios del sistema
- Agregar contactos
- Mensajes privados entre admin, profesores, estudiantes, padres

### 8.3 Notificaciones
- Notificaciones por email (configuración SMTP)
- Plantillas de notificación personalizables
- Notificación automática de: asistencia, cuotas, resultados de examen, tareas

### 8.4 Calendario de Eventos
- Calendario general del colegio
- Crear eventos con fecha, título, descripción
- Visible para todos los usuarios según permisos
- Lista de tareas pendientes (To-Do List) personal
---

## 9. BIBLIOTECA (dejar como proximamente)

### 9.1 Gestión de Libros
- Agregar libros con: título, número de libro, ISBN, editorial, autor, categoría, cantidad
- Búsqueda de libros

### 9.2 Préstamos y Devoluciones
- Registrar miembros de la biblioteca
- Prestar libros (issue)
- Registrar devolución (return)
- Fecha de vencimiento del préstamo

---
. CERTIFICADOS E ID CARDS

### 13.1 Certificados
- Diseñador de plantillas de certificados (con variables dinámicas: nombre, clase, fecha, etc.)
- Generar certificados individuales o masivos
- Variables disponibles: nombre del estudiante, número de admisión, clase, sección, fecha de nacimiento, nombre de padres, foto, etc.

### 13.2 ID Cards / Carnets
- Diseñador de plantillas de carnet estudiantil
- Diseñador de plantillas de carnet de personal
- Generación masiva de carnets
- Soporte para código de barras y código QR

### 13.3 Certificado de Transferencia
- Generación de certificado de transferencia cuando un estudiante se retira

---

## 14. REPORTES

### 14.1 Reportes de Estudiantes
- Listado de estudiantes por clase/sección
- Reporte de clase y sección
- Reporte de credenciales de login de padres
- Reporte de hermanos (siblings)
- Reporte de estudiantes por categoría

### 14.2 Reportes Financieros (importante)
- Estado de cuenta de cuotas por estudiante
- Reporte de cuotas pendientes por clase
- Reporte de cuotas vencidas
- Reporte de transacciones/cobros
- Reporte de ingresos y egresos

### 14.3 Reportes de Asistencia (importante)
- Reporte mensual de asistencia por clase
- Reporte de asistencia del personal
- Reporte por tipo de asistencia

### 14.4 Reportes de Exámenes
- Reporte de notas por examen
- Reporte de notas de tareas (homework)
- Boleta de calificaciones individual



## 15. CONFIGURACIÓN DEL SISTEMA

### 15.1 Configuración General
- Nombre del colegio, dirección, teléfono, email, logo
- Sesión académica activa
- Formato de fecha
- Zona horaria de Bogotá, Colombia
- Moneda (peso colombiano COP sin decimales)
- Día de inicio de la semana (la semana inicia el lunes)
- Formato de ID auto-generado (para admisión, personal, etc.)

### 15.2 Campos del Sistema
- Habilitar/deshabilitar campos del formulario de admisión
- Hacer campos obligatorios u opcionales
- Campos personalizados adicionales

### 15.5 Roles y Permisos
- Configuración granular de permisos por módulo para cada rol
- Activar/desactivar acceso a módulos específicos


## 16. FRONT CMS (Sitio Web Público)

### 16.1 Gestión del Sitio Web Público
- CMS integrado para la página web pública del colegio
- Gestión de menús de navegación
- Crear/editar páginas estáticas
- Publicar eventos
- Publicar noticias/avisos
- Galería de fotos
- Media Manager para archivos
- Múltiples temas/plantillas visuales (dark mode y light mode)
- Formulario de contacto
- Resultado de exámenes público (consulta por estudiante)

---

## 17. DASHBOARD / PANEL PRINCIPAL

### 17.1 Dashboard del Admin
- Resumen de estadísticas: total de estudiantes, profesores, ingresos, egresos
- Gráficos de ingresos vs egresos
- Distribución de estudiantes por clase
- Asistencia del día
- Calendario de eventos
- Avisos recientes

### 17.2 Dashboard del Profesor
- Sus clases asignadas
- Asistencia pendiente
- Tareas pendientes
- Horario del día
- Avisos

### 17.3 Dashboard del Estudiante/Padre
- Asistencia del estudiante
- Cuotas pendientes
- Próximos exámenes
- Tareas pendientes
- Avisos
- Resultados recientes

---

## 18. ALUMNI (Exalumnos)

- Registro de exalumnos
- Ver lista de exalumnos

---


## RESUMEN DE MÓDULOS PRIORITARIOS (Para versión simplificada)

| Prioridad | Módulo | Razón |
|-----------|--------|-------|
| 🔴 Crítico | Usuarios y Roles | Base de todo el sistema |
| 🔴 Crítico | Gestión de Estudiantes | Core del negocio |
| 🔴 Crítico | Estructura Académica | Clases, secciones, materias, horarios |
| 🔴 Crítico | Gestión de Cuotas/Finanzas | Flujo de caja del colegio |
| 🔴 Crítico | Exámenes y Calificaciones | Razón de ser académica |
| 🔴 Crítico | Asistencia | Operación diaria |
| 🟡 Importante | RRHH / Personal | Gestión de empleados |
| 🟡 Importante | Comunicación/Notificaciones | Mantener informados a padres |
| 🟡 Importante | Dashboard | Visión general del sistema |
| 🟡 Importante | Reportes | Toma de decisiones |
| 🟢 Deseable | Biblioteca | Complementario |
| 🟢 Deseable | Recepción/Front Office | Complementario |
| 🟢 Deseable | Certificados/ID Cards | Complementario |
| 🟢 Deseable | Front | Solo login |
| ⚪ Opcional | Exámenes Online | Fase posterior |

---

*Documento generado como referencia para desarrollo.


Frontend: React sin terminar, luego customizado por ti
Backend: Express.js + TypeScript
ORM/DB: Prisma + PostgreSQL
Auth: Firebase Admin
Finanzas: En la base de datos, con exportación opcional a Google Sheets
Deploy: VPS con PM2