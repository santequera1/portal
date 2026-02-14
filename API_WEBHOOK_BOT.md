# API Webhook - Portal Minerva/Fundisalud

## Informacion General

- **Base URL:** `https://portal.fundisalud.edu.co/api/webhook`
- **Autenticacion:** API Key estatica via header
- **Metodo:** Solo GET (lectura)
- **Formato:** JSON

## Autenticacion

Todas las peticiones requieren el header `X-API-Key`:

```
X-API-Key: TU_API_KEY_AQUI
```

Si la API Key es invalida o no se envia, la respuesta sera:

```json
{ "error": "API Key invalida o no proporcionada" }
```

**Status:** `401 Unauthorized`

---

## Organizaciones

El sistema maneja dos organizaciones:

| ID | Nombre | Codigo |
|----|--------|--------|
| 1  | Minerva (Primaria y Bachillerato) | MINERVA |
| 2  | Fundisalud (Carreras Tecnicas) | FUNDISALUD |

Muchos endpoints aceptan `?organizationId=1` o `?organizationId=2` para filtrar por organizacion.

---

## Endpoints

### 1. Ping (Health Check)

```
GET /ping
```

Verifica que la API esta funcionando.

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-11T12:00:00.000Z"
}
```

---

### 2. Organizaciones

```
GET /organizations
```

Lista todas las organizaciones con sus sedes y conteos.

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "Minerva",
    "code": "MINERVA",
    "sedes": [
      { "id": 1, "name": "Sede Principal", "address": "...", "phone": "..." }
    ],
    "_count": { "students": 15, "classes": 12 }
  }
]
```

---

### 3. Estudiantes

#### Listar estudiantes

```
GET /students
```

**Query params:**

| Param | Tipo | Descripcion |
|-------|------|-------------|
| `page` | number | Pagina (default: 1) |
| `limit` | number | Resultados por pagina (default: 20) |
| `organizationId` | number | Filtrar por organizacion (1 o 2) |
| `classId` | number | Filtrar por clase/programa |
| `sectionId` | number | Filtrar por seccion |
| `status` | string | `active` o `inactive` |
| `search` | string | Buscar por nombre, apellido, admissionNo, identificacion, padre o acudiente |

**Respuesta:**
```json
{
  "students": [
    {
      "id": 1,
      "admissionNo": "FUN-2026-001",
      "name": "Maria",
      "lastName": "Garcia Lopez",
      "dateOfBirth": "2000-05-15T00:00:00.000Z",
      "gender": "Femenino",
      "bloodGroup": "O+",
      "nationality": "Colombiana",
      "email": "maria@email.com",
      "phone": "3001234567",
      "tipoIdentificacion": "CC",
      "numeroIdentificacion": "1098765432",
      "fechaExpedicion": "2018-03-20T00:00:00.000Z",
      "lugarExpedicion": "Bogota",
      "lugarNacimiento": "Bogota",
      "tipoSalud": "EPS",
      "eps": "Sanitas",
      "numeroContrato": null,
      "numeroPoliza": null,
      "numeroCotizacion": null,
      "certificado": null,
      "responsableTipo": "Padre",
      "fatherName": "Carlos Garcia",
      "fatherPhone": "3009876543",
      "fatherEmail": "carlos@email.com",
      "fatherOccupation": "Ingeniero",
      "motherName": "Ana Lopez",
      "motherPhone": "3005551234",
      "acudienteNombre": "Carlos Garcia",
      "acudienteTelefono": "3009876543",
      "acudienteEmail": "carlos@email.com",
      "acudienteOcupacion": "Ingeniero",
      "address": "Calle 45 #12-34, Bogota",
      "classId": 13,
      "sectionId": 13,
      "organizationId": 2,
      "enrollmentDate": "2026-02-01T00:00:00.000Z",
      "exalumno": false,
      "fechaSalida": null,
      "status": "active",
      "class": { "id": 13, "name": "Auxiliar de Enfermeria" },
      "section": { "id": 13, "name": "Jornada A" }
    }
  ],
  "total": 37,
  "page": 1,
  "limit": 20,
  "totalPages": 2
}
```

#### Detalle de un estudiante

```
GET /students/:id
```

Retorna el estudiante con sus cuotas, pagos y ultimas 30 asistencias.

**Respuesta:** Igual que arriba pero incluye:
```json
{
  "...campos del estudiante...",
  "fees": [
    {
      "id": 1,
      "amount": 150000,
      "dueDate": "2026-03-01T00:00:00.000Z",
      "status": "PENDING",
      "feeType": { "id": 1, "name": "Matricula" },
      "payments": []
    }
  ],
  "attendances": [
    {
      "id": 1,
      "date": "2026-02-10T00:00:00.000Z",
      "status": "PRESENT",
      "remarks": null
    }
  ]
}
```

---

### 4. Personal (Staff)

#### Listar personal

```
GET /staff
```

**Query params:**

| Param | Tipo | Descripcion |
|-------|------|-------------|
| `organizationId` | number | Filtrar por organizacion |
| `department` | string | Filtrar por departamento |
| `designation` | string | Filtrar por cargo (ej: `Profesor`) |
| `search` | string | Buscar por nombre o email |

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "Juan Perez",
    "department": "Academico",
    "designation": "Profesor",
    "phone": "3001112233",
    "email": "juan@minerva.edu.co",
    "user": { "id": 2, "email": "juan@minerva.edu.co", "role": "TEACHER", "active": true },
    "staffOrgs": [
      { "organization": { "id": 1, "name": "Minerva" } }
    ]
  }
]
```

#### Detalle de personal

```
GET /staff/:id
```

Retorna el miembro del personal con sus asignaciones de clases.

**Respuesta:** Igual que arriba pero incluye:
```json
{
  "...campos del staff...",
  "teacherAssignments": [
    {
      "subject": { "id": 1, "name": "Matematicas" },
      "class": { "id": 7, "name": "6°" },
      "section": { "id": 7, "name": "Jornada A" }
    }
  ]
}
```

---

### 5. Finanzas

#### Resumen financiero

```
GET /finance/summary
```

Resumen del mes actual vs mes anterior.

**Respuesta:**
```json
{
  "monthlyIncome": 5000000,
  "monthlyExpense": 2000000,
  "pendingFees": 12,
  "overdueFees": 3,
  "incomeGrowth": 15.5
}
```

#### Transacciones

```
GET /finance/transactions
```

**Query params:**

| Param | Tipo | Descripcion |
|-------|------|-------------|
| `page` | number | Pagina (default: 1) |
| `limit` | number | Resultados por pagina (default: 20) |
| `organizationId` | number | Filtrar por organizacion |
| `type` | string | `INCOME` o `EXPENSE` |
| `category` | string | Categoria de transaccion |
| `from` | string | Fecha inicio (formato: `YYYY-MM-DD`) |
| `to` | string | Fecha fin (formato: `YYYY-MM-DD`) |

**Respuesta:**
```json
{
  "transactions": [
    {
      "id": 1,
      "type": "INCOME",
      "description": "Pago matricula Maria Garcia",
      "amount": 150000,
      "date": "2026-02-01T00:00:00.000Z",
      "category": "Matriculas",
      "status": "completed",
      "organizationId": 2
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

#### Cuotas (Fees)

```
GET /finance/fees
```

**Query params:**

| Param | Tipo | Descripcion |
|-------|------|-------------|
| `page` | number | Pagina (default: 1) |
| `limit` | number | Resultados por pagina (default: 20) |
| `studentId` | number | Filtrar por estudiante |
| `classId` | number | Filtrar por clase/programa |
| `status` | string | `PENDING`, `PAID` o `OVERDUE` |

**Respuesta:**
```json
{
  "fees": [
    {
      "id": 1,
      "amount": 150000,
      "dueDate": "2026-03-01T00:00:00.000Z",
      "status": "PENDING",
      "student": { "id": 1, "name": "Maria", "admissionNo": "FUN-2026-001", "class": {...}, "section": {...} },
      "feeType": { "id": 1, "name": "Matricula" },
      "payments": [],
      "totalPaid": 0,
      "balance": 150000
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

#### Pagos

```
GET /finance/payments
```

**Query params:**

| Param | Tipo | Descripcion |
|-------|------|-------------|
| `studentId` | number | Filtrar por estudiante |
| `feeId` | number | Filtrar por cuota |

**Respuesta:**
```json
[
  {
    "id": 1,
    "amount": 75000,
    "date": "2026-02-15T00:00:00.000Z",
    "method": "CASH",
    "reference": null,
    "fee": { "id": 1, "feeType": { "name": "Matricula" } },
    "student": { "id": 1, "name": "Maria" }
  }
]
```

---

### 6. Academico

#### Clases / Programas

```
GET /academic/classes
```

**Query params:**

| Param | Tipo | Descripcion |
|-------|------|-------------|
| `organizationId` | number | Filtrar por organizacion |
| `sessionId` | number | Filtrar por sesion academica (default: sesion activa) |

**Respuesta:**
```json
[
  {
    "id": 13,
    "name": "Auxiliar de Enfermeria",
    "order": 1,
    "category": "REGULAR",
    "organizationId": 2,
    "sections": [
      { "id": 13, "name": "Jornada A" }
    ],
    "classSubjects": [
      { "subject": { "id": 1, "name": "Anatomia", "code": "ANAT" } }
    ],
    "_count": { "students": 2 }
  }
]
```

#### Materias

```
GET /academic/subjects
```

**Query params:**

| Param | Tipo | Descripcion |
|-------|------|-------------|
| `organizationId` | number | Filtrar por organizacion |
| `classId` | number | Filtrar materias de una clase especifica |

**Respuesta (sin classId):**
```json
[
  {
    "id": 1,
    "name": "Matematicas",
    "code": "MAT",
    "organizationId": 1,
    "classSubjects": [
      { "class": { "id": 7, "name": "6°" } }
    ]
  }
]
```

**Respuesta (con classId):**
```json
[
  { "id": 1, "name": "Matematicas", "code": "MAT" }
]
```

#### Examenes

```
GET /academic/exams
```

**Query params:**

| Param | Tipo | Descripcion |
|-------|------|-------------|
| `examGroupId` | number | Filtrar por grupo de examen |
| `classId` | number | Filtrar por clase |

**Respuesta:**
```json
[
  {
    "id": 1,
    "date": "2026-03-15T00:00:00.000Z",
    "startTime": "08:00",
    "duration": 120,
    "maxMarks": 5.0,
    "subject": { "id": 1, "name": "Matematicas" },
    "class": { "id": 7, "name": "6°" },
    "examGroup": { "id": 1, "name": "Primer Periodo" },
    "_count": { "marks": 3 }
  }
]
```

#### Notas (Marks)

```
GET /academic/marks
```

**Query params:**

| Param | Tipo | Descripcion |
|-------|------|-------------|
| `examId` | number | Filtrar por examen |
| `studentId` | number | Filtrar por estudiante |

**Respuesta:**
```json
[
  {
    "id": 1,
    "marksObtained": 4.2,
    "remarks": null,
    "student": { "id": 1, "name": "Maria", "admissionNo": "FUN-2026-001" },
    "exam": {
      "subject": { "name": "Matematicas" },
      "class": { "name": "6°" },
      "examGroup": { "name": "Primer Periodo" }
    }
  }
]
```

#### Asistencia del dia

```
GET /academic/attendance
```

**Query params (requeridos):**

| Param | Tipo | Descripcion |
|-------|------|-------------|
| `sectionId` | number | **Requerido.** ID de la seccion |
| `date` | string | **Requerido.** Fecha (formato: `YYYY-MM-DD`) |
| `classId` | number | Opcional. Filtrar por clase |

**Respuesta:**
```json
{
  "attendances": [
    {
      "id": 1,
      "status": "PRESENT",
      "date": "2026-02-10T00:00:00.000Z",
      "remarks": null,
      "student": { "id": 1, "name": "Maria", "admissionNo": "FUN-2026-001" }
    }
  ],
  "students": [
    { "id": 1, "name": "Maria", "admissionNo": "FUN-2026-001" }
  ]
}
```

**Valores de status de asistencia:** `PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`

#### Reporte de asistencia de un estudiante

```
GET /academic/attendance/report
```

**Query params:**

| Param | Tipo | Descripcion |
|-------|------|-------------|
| `studentId` | number | **Requerido.** ID del estudiante |
| `from` | string | Fecha inicio (formato: `YYYY-MM-DD`) |
| `to` | string | Fecha fin (formato: `YYYY-MM-DD`) |

**Respuesta:**
```json
{
  "records": [
    { "id": 1, "date": "2026-02-10T00:00:00.000Z", "status": "PRESENT", "remarks": null }
  ],
  "summary": {
    "total": 20,
    "present": 18,
    "absent": 1,
    "late": 1,
    "halfDay": 0
  }
}
```

---

### 7. Dashboard

```
GET /dashboard
```

**Query params:**

| Param | Tipo | Descripcion |
|-------|------|-------------|
| `organizationId` | number | Filtrar por organizacion |

**Respuesta:**
```json
{
  "totalStudents": 37,
  "activeStaff": 5,
  "teacherCount": 3,
  "adminCount": 2,
  "monthlyIncome": 5000000,
  "monthlyExpense": 2000000,
  "incomeGrowth": 15.5,
  "attendanceToday": {
    "present": 30,
    "absent": 5,
    "total": 37,
    "percentage": 81.1
  },
  "studentDistribution": [
    { "name": "6°", "students": 3 },
    { "name": "Auxiliar de Enfermeria", "students": 2 }
  ],
  "pendingFees": [
    {
      "id": 1,
      "name": "Maria Garcia",
      "class": "Auxiliar de Enfermeria Jornada A",
      "amount": 150000,
      "daysOverdue": 5
    }
  ],
  "upcomingEvents": [
    {
      "id": 1,
      "title": "Reunion de padres",
      "date": "2026-02-20T00:00:00.000Z",
      "time": "14:00",
      "location": "Auditorio",
      "type": "event"
    }
  ],
  "academicSession": "2026"
}
```

---

## Campos del Estudiante (Referencia)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `admissionNo` | string | Numero de admision unico (ej: `FUN-2026-001`) |
| `name` | string | Nombre(s) |
| `lastName` | string | Apellido(s) |
| `dateOfBirth` | datetime | Fecha de nacimiento |
| `gender` | string | `Masculino`, `Femenino`, `Otro` |
| `bloodGroup` | string | Tipo de sangre: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` |
| `nationality` | string | Default: `Colombiana` |
| `email` | string | Correo del estudiante |
| `phone` | string | Telefono del estudiante |
| `tipoIdentificacion` | string | `TI`, `CC`, `CE`, `PA`, `RC`, `NUIP` |
| `numeroIdentificacion` | string | Numero del documento |
| `fechaExpedicion` | datetime | Fecha expedicion del documento |
| `lugarExpedicion` | string | Lugar de expedicion |
| `lugarNacimiento` | string | Lugar de nacimiento |
| `tipoSalud` | string | `EPS` o `SISBEN` |
| `eps` | string | Nombre de la EPS (si tipoSalud=EPS) o numero SISBEN (si tipoSalud=SISBEN) |
| `numeroContrato` | string | Numero de contrato (opcional) |
| `numeroPoliza` | string | Numero de poliza (opcional) |
| `numeroCotizacion` | string | Numero de cotizacion (opcional) |
| `certificado` | string | Certificado (opcional) |
| `responsableTipo` | string | `Padre`, `Madre`, `Acudiente` |
| `fatherName` | string | Nombre del padre |
| `fatherPhone` | string | Telefono del padre |
| `fatherEmail` | string | Email del padre |
| `fatherOccupation` | string | Ocupacion del padre |
| `motherName` | string | Nombre de la madre |
| `motherPhone` | string | Telefono de la madre |
| `acudienteNombre` | string | Nombre del acudiente |
| `acudienteTelefono` | string | Telefono del acudiente |
| `acudienteEmail` | string | Email del acudiente |
| `acudienteOcupacion` | string | Ocupacion del acudiente |
| `address` | string | Direccion |
| `classId` | number | ID de la clase/programa |
| `sectionId` | number | ID de la seccion |
| `organizationId` | number | 1=Minerva, 2=Fundisalud |
| `status` | string | `active` o `inactive` |
| `exalumno` | boolean | Si es exalumno |
| `fechaSalida` | datetime | Fecha de retiro (si aplica) |

---

## Ejemplos de Uso con curl

### Verificar conexion
```bash
curl -H "X-API-Key: TU_API_KEY" https://portal.fundisalud.edu.co/api/webhook/ping
```

### Listar estudiantes de Fundisalud
```bash
curl -H "X-API-Key: TU_API_KEY" "https://portal.fundisalud.edu.co/api/webhook/students?organizationId=2"
```

### Buscar estudiante por nombre
```bash
curl -H "X-API-Key: TU_API_KEY" "https://portal.fundisalud.edu.co/api/webhook/students?search=Maria"
```

### Ver detalle de un estudiante
```bash
curl -H "X-API-Key: TU_API_KEY" https://portal.fundisalud.edu.co/api/webhook/students/1
```

### Ver programas de Fundisalud
```bash
curl -H "X-API-Key: TU_API_KEY" "https://portal.fundisalud.edu.co/api/webhook/academic/classes?organizationId=2"
```

### Ver resumen financiero
```bash
curl -H "X-API-Key: TU_API_KEY" https://portal.fundisalud.edu.co/api/webhook/finance/summary
```

### Ver dashboard general
```bash
curl -H "X-API-Key: TU_API_KEY" https://portal.fundisalud.edu.co/api/webhook/dashboard
```

### Ver dashboard solo de Minerva
```bash
curl -H "X-API-Key: TU_API_KEY" "https://portal.fundisalud.edu.co/api/webhook/dashboard?organizationId=1"
```

### Ver cuotas pendientes
```bash
curl -H "X-API-Key: TU_API_KEY" "https://portal.fundisalud.edu.co/api/webhook/finance/fees?status=PENDING"
```

### Ver asistencia de hoy de una seccion
```bash
curl -H "X-API-Key: TU_API_KEY" "https://portal.fundisalud.edu.co/api/webhook/academic/attendance?sectionId=13&date=2026-02-11"
```

### Reporte de asistencia de un estudiante (febrero)
```bash
curl -H "X-API-Key: TU_API_KEY" "https://portal.fundisalud.edu.co/api/webhook/academic/attendance/report?studentId=1&from=2026-02-01&to=2026-02-28"
```

---

## Codigos de Respuesta

| Codigo | Significado |
|--------|-------------|
| `200` | Exito |
| `400` | Parametros faltantes o invalidos |
| `401` | API Key invalida o no proporcionada |
| `404` | Recurso no encontrado |
| `500` | Error interno del servidor |

---

## Notas

- Todos los endpoints son **solo lectura** (GET). No se puede crear, editar ni eliminar datos via API.
- Las fechas se retornan en formato ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- Los endpoints paginados retornan `total`, `page`, `limit` y `totalPages` para navegacion.
- Los montos financieros estan en **pesos colombianos (COP)**.
- El campo `maxMarks` de examenes usa escala de **1.0 a 5.0** (sistema colombiano).
