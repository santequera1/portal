# 🤖 Integración del Bot con Sistema Minerva

Este documento contiene toda la información necesaria para integrar tu bot con el sistema de gestión escolar Minerva.

## 📋 Contenido

1. [Archivos Incluidos](#archivos-incluidos)
2. [Configuración Inicial](#configuración-inicial)
3. [Endpoints Disponibles](#endpoints-disponibles)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Mejores Prácticas](#mejores-prácticas)

---

## 📁 Archivos Incluidos

- **`BOT_API_DOCS.md`**: Documentación completa de todos los endpoints del API
- **`bot-example.js`**: Código de ejemplo en JavaScript/Node.js listo para usar
- **`setup-bot-user.sql`**: Instrucciones para configurar el usuario del bot

---

## 🚀 Configuración Inicial

### Paso 1: Crear Usuario del Bot

Haz una petición POST a la API para registrar el usuario del bot:

```bash
curl -X POST https://portal.fundisalud.edu.co/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bot Fundisalud",
    "email": "bot@fundisalud.edu.co",
    "password": "TU_PASSWORD_SUPER_SEGURO",
    "role": "ADMIN",
    "organizationId": 1
  }'
```

### Paso 2: Obtener Token de Acceso

```bash
curl -X POST https://portal.fundisalud.edu.co/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bot@fundisalud.edu.co",
    "password": "TU_PASSWORD_SUPER_SEGURO"
  }'
```

Respuesta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Bot Fundisalud",
    "email": "bot@fundisalud.edu.co",
    "role": "ADMIN"
  }
}
```

### Paso 3: Usar el Token en las Peticiones

Incluye el token en el header `Authorization` de todas tus peticiones:

```javascript
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'Content-Type': 'application/json'
}
```

---

## 🔌 Endpoints Disponibles

### Estudiantes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/students` | Listar estudiantes |
| GET | `/api/students/:id` | Obtener un estudiante |
| POST | `/api/students` | Crear estudiante |
| PUT | `/api/students/:id` | Actualizar estudiante |
| DELETE | `/api/students/:id` | Eliminar estudiante |

### Profesores/Staff

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/staff` | Listar profesores |
| GET | `/api/staff/:id` | Obtener un profesor |
| POST | `/api/staff` | Crear profesor |
| PUT | `/api/staff/:id` | Actualizar profesor |
| DELETE | `/api/staff/:id` | Eliminar profesor |

### Datos Auxiliares

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/organizations` | Listar organizaciones |
| GET | `/api/classes` | Listar clases/programas |
| GET | `/api/sections` | Listar secciones |
| GET | `/api/search?q=nombre` | Búsqueda global |

Ver **`BOT_API_DOCS.md`** para documentación completa de cada endpoint.

---

## 💻 Ejemplos de Uso

### Usando JavaScript/Node.js

```javascript
const botAPI = require('./bot-example.js');

// Buscar un estudiante
const estudiantes = await botAPI.buscarEstudiante('Juan Pérez');

// Crear un estudiante
const nuevoEstudiante = await botAPI.crearEstudiante({
  name: 'María García',
  email: 'maria@example.com',
  phone: '3001234567',
  classId: 1,
  sectionId: 1,
  organizationId: 1
});

// Actualizar un estudiante
await botAPI.actualizarEstudiante(nuevoEstudiante.id, {
  phone: '3009999999'
});

// Eliminar un estudiante
await botAPI.eliminarEstudiante(nuevoEstudiante.id);
```

### Usando Python

```python
import requests

API_URL = 'https://portal.fundisalud.edu.co/api'
TOKEN = 'tu_token_aqui'

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

# Buscar estudiante
response = requests.get(f'{API_URL}/students?search=Juan', headers=headers)
estudiantes = response.json()

# Crear estudiante
nuevo_estudiante = {
    'name': 'María García',
    'email': 'maria@example.com',
    'classId': 1,
    'sectionId': 1,
    'organizationId': 1
}
response = requests.post(f'{API_URL}/students', json=nuevo_estudiante, headers=headers)
estudiante = response.json()

# Actualizar estudiante
actualizacion = {'phone': '3009999999'}
response = requests.put(f'{API_URL}/students/{estudiante["id"]}', json=actualizacion, headers=headers)

# Eliminar estudiante
response = requests.delete(f'{API_URL}/students/{estudiante["id"]}', headers=headers)
```

---

## ✅ Mejores Prácticas

### 1. Gestión del Token

- ✅ Guarda el token en caché para evitar hacer login en cada petición
- ✅ Maneja la expiración del token (401 Unauthorized) y renueva automáticamente
- ✅ NO compartas el token en código público

```javascript
// Ejemplo de manejo de token (ver bot-example.js)
async function makeRequest(method, endpoint, data) {
  try {
    const token = await getToken(); // Usa caché si está disponible
    // ... hacer petición
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expirado, renovar y reintentar
    }
  }
}
```

### 2. Manejo de Errores

- ✅ Siempre valida los datos antes de enviarlos
- ✅ Maneja errores 400, 401, 403, 404, 500 apropiadamente
- ✅ Proporciona mensajes de error claros al usuario del bot

```javascript
try {
  const estudiante = await crearEstudiante(datos);
  return `✅ Estudiante ${estudiante.name} creado exitosamente`;
} catch (error) {
  if (error.response?.status === 400) {
    return `❌ Datos inválidos: ${error.response.data.error}`;
  }
  return `❌ Error al crear estudiante. Intenta de nuevo.`;
}
```

### 3. Validación de Datos

Antes de crear un estudiante, valida que tengas los datos requeridos:

```javascript
function validarDatosEstudiante(datos) {
  if (!datos.name) {
    throw new Error('El nombre es requerido');
  }
  if (!datos.classId) {
    throw new Error('La clase es requerida');
  }
  if (!datos.sectionId) {
    throw new Error('La sección es requerida');
  }
  return true;
}
```

### 4. IDs Necesarios

Para crear estudiantes necesitas:
- `classId`: ID de la clase/programa
- `sectionId`: ID de la sección/grupo
- `organizationId` (opcional): ID de la organización

Obtén estos IDs usando los endpoints auxiliares:

```javascript
// Obtener clases disponibles
const clases = await obtenerClases(1); // organizationId = 1

// Obtener secciones de una clase
const secciones = await obtenerSecciones(clases[0].id);
```

### 5. Búsqueda de Usuarios

Para buscar un usuario existente antes de crearlo:

```javascript
// Buscar por nombre
const estudiantes = await buscarEstudiante('Juan Pérez');

if (estudiantes.length > 0) {
  return `El estudiante ya existe: ${estudiantes[0].admissionNo}`;
}

// Crear nuevo estudiante
const nuevo = await crearEstudiante(datos);
```

### 6. Seguridad

- 🔒 Usa HTTPS siempre
- 🔒 Guarda las credenciales en variables de entorno
- 🔒 No registres el token en logs
- 🔒 Limita los permisos del usuario del bot

```javascript
// ✅ Bueno
const password = process.env.BOT_PASSWORD;

// ❌ Malo
const password = 'mi_password_en_codigo';
```

---

## 📊 Campos Requeridos

### Para Crear Estudiante

**Requeridos:**
- `name` (string)
- `classId` (number)
- `sectionId` (number)

**Opcionales:**
- `email`, `phone`, `address`
- `dateOfBirth` (formato: YYYY-MM-DD)
- `gender` ("Masculino" o "Femenino")
- `bloodGroup`
- `organizationId` (number)
- `tipoIdentificacion`, `numeroIdentificacion`
- `fatherName`, `fatherPhone`
- `motherName`, `motherPhone`
- `acudienteNombre`, `acudienteTelefono`

### Para Crear Profesor

**Requeridos:**
- `name` (string)
- `email` (string)
- `designation` (string)

**Opcionales:**
- `phone`, `address`
- `qualification` (título/estudios)
- `experience` (años de experiencia)
- `dateOfJoining` (formato: YYYY-MM-DD)
- `organizationIds` (array de números)

---

## 🆘 Solución de Problemas

### Error 401 - No Autorizado

**Problema:** El token expiró o es inválido

**Solución:**
```javascript
// Limpiar caché de token y obtener uno nuevo
fs.unlinkSync('./bot-token.json');
const nuevoToken = await getToken();
```

### Error 400 - Datos Inválidos

**Problema:** Faltan campos requeridos o datos incorrectos

**Solución:**
- Verifica que `classId` y `sectionId` existan en la base de datos
- Valida el formato de las fechas (YYYY-MM-DD)
- Asegúrate de enviar todos los campos requeridos

### Error 404 - No Encontrado

**Problema:** El ID del estudiante/profesor no existe

**Solución:**
- Busca primero por nombre para obtener el ID correcto
- Verifica que el usuario no haya sido eliminado

---

## 📞 Contacto

Para soporte técnico o preguntas sobre la API, contacta al equipo de desarrollo.

---

## 🔄 Actualizaciones

**Última actualización:** 16/02/2026

**Versión de la API:** 1.0

**Cambios recientes:**
- ✅ Soporte para transacciones de $0 (becas/subsidios)
- ✅ Filtros por organización en finanzas
- ✅ Mejoras en planes de pago

---

## 📝 Licencia

Este sistema es propietario de Fundisalud. Uso exclusivo para bots autorizados.
