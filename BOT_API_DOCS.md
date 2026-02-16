# API Documentation para Bot

Esta documentación describe los endpoints disponibles para que el bot pueda interactuar con el sistema de gestión escolar.

## Autenticación

Todas las peticiones deben incluir el header de autenticación:

```
Authorization: Bearer <TOKEN>
```

### Obtener Token de Acceso

**POST** `/api/auth/login`

```json
{
  "email": "bot@fundisalud.edu.co",
  "password": "tu_password_seguro"
}
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Bot Usuario",
    "email": "bot@fundisalud.edu.co",
    "role": "ADMIN"
  }
}
```

---

## 📚 ENDPOINTS DE ESTUDIANTES

### 1. Listar Estudiantes

**GET** `/api/students`

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Resultados por página (default: 20)
- `search` (opcional): Buscar por nombre o número de admisión
- `organizationId` (opcional): Filtrar por organización
- `classId` (opcional): Filtrar por clase
- `status` (opcional): Filtrar por estado (active, inactive, graduated)

**Ejemplo:**
```bash
GET /api/students?search=Juan&organizationId=1
```

**Respuesta:**
```json
{
  "students": [
    {
      "id": 1,
      "admissionNo": "2024-001",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "phone": "3001234567",
      "status": "active",
      "class": {
        "id": 1,
        "name": "Maquinaria Pesada"
      },
      "section": {
        "id": 1,
        "name": "Grupo A"
      },
      "organization": {
        "id": 1,
        "name": "Fundisalud"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### 2. Obtener un Estudiante

**GET** `/api/students/:id`

**Ejemplo:**
```bash
GET /api/students/1
```

**Respuesta:**
```json
{
  "id": 1,
  "admissionNo": "2024-001",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "3001234567",
  "address": "Calle 123",
  "dateOfBirth": "2000-01-15T00:00:00.000Z",
  "gender": "Masculino",
  "bloodGroup": "O+",
  "status": "active",
  "enrollmentDate": "2024-01-10T00:00:00.000Z",
  "balance": 0,
  "classId": 1,
  "sectionId": 1,
  "organizationId": 1,
  "class": {
    "id": 1,
    "name": "Maquinaria Pesada"
  },
  "section": {
    "id": 1,
    "name": "Grupo A"
  },
  "organization": {
    "id": 1,
    "name": "Fundisalud"
  }
}
```

---

### 3. Crear Estudiante

**POST** `/api/students`

**Body (JSON):**
```json
{
  "name": "María García",
  "email": "maria@example.com",
  "phone": "3009876543",
  "address": "Calle 456",
  "dateOfBirth": "1999-05-20",
  "gender": "Femenino",
  "bloodGroup": "A+",
  "classId": 1,
  "sectionId": 1,
  "organizationId": 1,
  "enrollmentDate": "2024-02-16",
  "status": "active",
  "fatherName": "Pedro García",
  "fatherPhone": "3001111111",
  "motherName": "Ana García",
  "motherPhone": "3002222222",
  "tipoIdentificacion": "CC",
  "numeroIdentificacion": "1234567890"
}
```

**Campos Requeridos:**
- `name` (string)
- `classId` (number)
- `sectionId` (number)

**Campos Opcionales:**
- `email` (string)
- `phone` (string)
- `address` (string)
- `dateOfBirth` (string formato YYYY-MM-DD)
- `gender` (string: "Masculino" o "Femenino")
- `bloodGroup` (string)
- `organizationId` (number)
- `sedeId` (number)
- `enrollmentDate` (string formato YYYY-MM-DD)
- `status` (string: "active", "inactive", "graduated")
- `fatherName`, `fatherPhone`, `motherName`, `motherPhone` (strings)
- `acudienteNombre`, `acudienteTelefono`, `acudienteEmail` (strings)
- `tipoIdentificacion` (string: "CC", "TI", "CE", etc.)
- `numeroIdentificacion` (string)

**Respuesta Exitosa (201):**
```json
{
  "id": 2,
  "admissionNo": "2024-002",
  "name": "María García",
  "email": "maria@example.com",
  "status": "active",
  "classId": 1,
  "sectionId": 1,
  "organizationId": 1
}
```

**Respuestas de Error:**
- `400`: Datos inválidos (classId y sectionId son requeridos)
- `400`: Referencia inválida (la clase/sección/organización no existe)
- `500`: Error del servidor

---

### 4. Actualizar Estudiante

**PUT** `/api/students/:id`

**Body (JSON):** (Todos los campos son opcionales)
```json
{
  "name": "María García López",
  "email": "maria.lopez@example.com",
  "phone": "3009999999",
  "status": "active"
}
```

**Respuesta:**
```json
{
  "id": 2,
  "name": "María García López",
  "email": "maria.lopez@example.com",
  "phone": "3009999999",
  "status": "active"
}
```

---

### 5. Eliminar Estudiante

**DELETE** `/api/students/:id`

**Ejemplo:**
```bash
DELETE /api/students/2
```

**Respuesta:**
```json
{
  "message": "Estudiante eliminado"
}
```

---

## 👥 ENDPOINTS DE PROFESORES/STAFF

### 1. Listar Staff

**GET** `/api/staff`

**Query Parameters:**
- `page` (opcional): Número de página
- `limit` (opcional): Resultados por página
- `search` (opcional): Buscar por nombre
- `designation` (opcional): Filtrar por cargo

**Respuesta:**
```json
{
  "staff": [
    {
      "id": 1,
      "name": "Carlos Rodríguez",
      "email": "carlos@fundisalud.edu.co",
      "phone": "3005555555",
      "designation": "Profesor",
      "qualification": "Ingeniero Mecánico",
      "status": "active"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### 2. Obtener un Staff Member

**GET** `/api/staff/:id`

**Respuesta:**
```json
{
  "id": 1,
  "name": "Carlos Rodríguez",
  "email": "carlos@fundisalud.edu.co",
  "phone": "3005555555",
  "designation": "Profesor",
  "qualification": "Ingeniero Mecánico",
  "experience": "5 años",
  "status": "active",
  "dateOfJoining": "2020-01-15T00:00:00.000Z",
  "address": "Calle 789",
  "staffOrgs": [
    {
      "organizationId": 1,
      "organization": {
        "id": 1,
        "name": "Fundisalud"
      }
    }
  ]
}
```

---

### 3. Crear Staff/Profesor

**POST** `/api/staff`

**Body (JSON):**
```json
{
  "name": "Ana Martínez",
  "email": "ana@fundisalud.edu.co",
  "phone": "3007777777",
  "designation": "Profesor",
  "qualification": "Licenciada en Educación",
  "experience": "3 años",
  "dateOfJoining": "2024-02-16",
  "address": "Calle 321",
  "status": "active",
  "organizationIds": [1]
}
```

**Campos Requeridos:**
- `name` (string)
- `email` (string)
- `designation` (string)

**Campos Opcionales:**
- `phone` (string)
- `qualification` (string)
- `experience` (string)
- `dateOfJoining` (string formato YYYY-MM-DD)
- `address` (string)
- `status` (string: "active" o "inactive")
- `organizationIds` (array de números)

**Respuesta:**
```json
{
  "id": 2,
  "name": "Ana Martínez",
  "email": "ana@fundisalud.edu.co",
  "designation": "Profesor",
  "status": "active"
}
```

---

### 4. Actualizar Staff/Profesor

**PUT** `/api/staff/:id`

**Body (JSON):** (Todos opcionales)
```json
{
  "name": "Ana Martínez López",
  "phone": "3008888888",
  "designation": "Coordinador"
}
```

**Respuesta:**
```json
{
  "id": 2,
  "name": "Ana Martínez López",
  "phone": "3008888888",
  "designation": "Coordinador"
}
```

---

### 5. Eliminar Staff/Profesor

**DELETE** `/api/staff/:id`

**Respuesta:**
```json
{
  "message": "Staff member eliminado"
}
```

---

## 🔍 BÚSQUEDA GLOBAL

### Buscar Estudiantes, Profesores o Staff

**GET** `/api/search?q=nombre`

**Respuesta:**
```json
{
  "students": [...],
  "staff": [...]
}
```

---

## 💰 GESTIÓN DE PAGOS Y CUOTAS

### Agregar Saldo a Estudiante

**POST** `/api/students/:id/balance`

```json
{
  "amount": 50000,
  "description": "Abono recibido por WhatsApp"
}
```

---

## 🏢 DATOS DE REFERENCIA

### Obtener Organizaciones

**GET** `/api/organizations`

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "Fundisalud",
    "code": "FUNDI"
  },
  {
    "id": 2,
    "name": "Minerva",
    "code": "MINERVA"
  }
]
```

---

### Obtener Clases/Programas

**GET** `/api/classes?organizationId=1`

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "Maquinaria Pesada",
    "organizationId": 1
  },
  {
    "id": 2,
    "name": "Enfermería",
    "organizationId": 1
  }
]
```

---

### Obtener Secciones

**GET** `/api/sections?classId=1`

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "Grupo A",
    "classId": 1
  },
  {
    "id": 2,
    "name": "Grupo B",
    "classId": 1
  }
]
```

---

## 📊 CÓDIGOS DE ERROR

| Código | Descripción |
|--------|-------------|
| 200 | Éxito |
| 201 | Creado exitosamente |
| 400 | Datos inválidos o faltantes |
| 401 | No autenticado |
| 403 | Sin permisos |
| 404 | No encontrado |
| 500 | Error del servidor |

---

## 🤖 EJEMPLOS DE USO PARA BOT

### Ejemplo 1: Crear un Estudiante

```javascript
const axios = require('axios');

async function crearEstudiante() {
  try {
    const response = await axios.post('https://portal.fundisalud.edu.co/api/students', {
      name: "Pedro López",
      email: "pedro@example.com",
      phone: "3001234567",
      classId: 1,
      sectionId: 1,
      organizationId: 1,
      tipoIdentificacion: "CC",
      numeroIdentificacion: "9876543210"
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Estudiante creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

### Ejemplo 2: Buscar un Estudiante por Nombre

```javascript
async function buscarEstudiante(nombre) {
  try {
    const response = await axios.get(`https://portal.fundisalud.edu.co/api/students?search=${nombre}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    return response.data.students;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

### Ejemplo 3: Actualizar un Estudiante

```javascript
async function actualizarEstudiante(id, datos) {
  try {
    const response = await axios.put(`https://portal.fundisalud.edu.co/api/students/${id}`, datos, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Estudiante actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

### Ejemplo 4: Eliminar un Estudiante

```javascript
async function eliminarEstudiante(id) {
  try {
    const response = await axios.delete(`https://portal.fundisalud.edu.co/api/students/${id}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    console.log('Estudiante eliminado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

---

## 🔐 SEGURIDAD

1. **Nunca compartas el token** en código público o repositorios
2. **Usa HTTPS** siempre (https://portal.fundisalud.edu.co)
3. **Rota el token** periódicamente
4. **Valida los datos** antes de enviarlos al API
5. **Maneja los errores** apropiadamente

---

## 📝 NOTAS IMPORTANTES

1. **Número de Admisión**: Se genera automáticamente al crear un estudiante
2. **Fechas**: Usar formato ISO (YYYY-MM-DD)
3. **IDs Requeridos**: classId y sectionId son obligatorios al crear estudiantes
4. **Status**: Los valores válidos son "active", "inactive", "graduated"
5. **Organización**: Si no se especifica organizationId, se usará la primera disponible

---

## 📞 SOPORTE

Para reportar problemas o solicitar nuevas funcionalidades, contacta al equipo de desarrollo.
