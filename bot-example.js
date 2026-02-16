/**
 * Ejemplo de integración del Bot con el sistema Minerva
 *
 * Este archivo muestra cómo implementar las funciones principales
 * que tu bot necesitará para interactuar con el sistema
 */

const axios = require('axios');
const fs = require('fs');

// Configuración
const API_BASE_URL = 'https://portal.fundisalud.edu.co/api';
const BOT_EMAIL = 'bot@fundisalud.edu.co';
const BOT_PASSWORD = process.env.BOT_PASSWORD || 'TU_PASSWORD_AQUI';
const TOKEN_FILE = './bot-token.json';

// ============================================
// GESTIÓN DE AUTENTICACIÓN
// ============================================

/**
 * Obtiene un token válido (usa caché si está disponible)
 */
async function getToken() {
  // Intentar leer token guardado
  try {
    const data = fs.readFileSync(TOKEN_FILE, 'utf8');
    const { token, expiresAt } = JSON.parse(data);

    // Si el token aún es válido, usarlo
    if (new Date(expiresAt) > new Date()) {
      console.log('✓ Usando token en caché');
      return token;
    }
  } catch (error) {
    // Token no existe o no es válido
  }

  // Hacer login para obtener nuevo token
  console.log('⟳ Obteniendo nuevo token...');
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    email: BOT_EMAIL,
    password: BOT_PASSWORD
  });

  const token = response.data.token;

  // Guardar token con fecha de expiración (7 días)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token, expiresAt }));
  console.log('✓ Token obtenido y guardado');

  return token;
}

/**
 * Hace una petición autenticada al API
 */
async function makeRequest(method, endpoint, data = null) {
  try {
    const token = await getToken();
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    // Si el token expiró, limpiar caché y reintentar
    if (error.response?.status === 401) {
      console.log('⚠ Token expirado, renovando...');
      if (fs.existsSync(TOKEN_FILE)) {
        fs.unlinkSync(TOKEN_FILE);
      }

      // Reintentar la petición
      const token = await getToken();
      const config = {
        method,
        url: `${API_BASE_URL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    }

    // Otro error
    throw error;
  }
}

// ============================================
// FUNCIONES DE ESTUDIANTES
// ============================================

/**
 * Buscar estudiantes por nombre
 */
async function buscarEstudiante(nombre) {
  try {
    console.log(`🔍 Buscando estudiante: ${nombre}`);
    const result = await makeRequest('GET', `/students?search=${encodeURIComponent(nombre)}`);
    console.log(`✓ Encontrados ${result.total} estudiantes`);
    return result.students;
  } catch (error) {
    console.error('✗ Error al buscar estudiante:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtener un estudiante por ID
 */
async function obtenerEstudiante(id) {
  try {
    console.log(`📖 Obteniendo estudiante ID: ${id}`);
    const student = await makeRequest('GET', `/students/${id}`);
    console.log(`✓ Estudiante encontrado: ${student.name}`);
    return student;
  } catch (error) {
    console.error('✗ Error al obtener estudiante:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Crear un nuevo estudiante
 */
async function crearEstudiante(datos) {
  try {
    console.log(`➕ Creando estudiante: ${datos.name}`);

    // Validar datos requeridos
    if (!datos.name || !datos.classId || !datos.sectionId) {
      throw new Error('Faltan datos requeridos: name, classId, sectionId');
    }

    const student = await makeRequest('POST', '/students', datos);
    console.log(`✓ Estudiante creado con ID: ${student.id}, Admisión No: ${student.admissionNo}`);
    return student;
  } catch (error) {
    console.error('✗ Error al crear estudiante:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Actualizar un estudiante
 */
async function actualizarEstudiante(id, datos) {
  try {
    console.log(`✏️ Actualizando estudiante ID: ${id}`);
    const student = await makeRequest('PUT', `/students/${id}`, datos);
    console.log(`✓ Estudiante actualizado: ${student.name}`);
    return student;
  } catch (error) {
    console.error('✗ Error al actualizar estudiante:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Eliminar un estudiante
 */
async function eliminarEstudiante(id) {
  try {
    console.log(`🗑️ Eliminando estudiante ID: ${id}`);
    const result = await makeRequest('DELETE', `/students/${id}`);
    console.log(`✓ ${result.message}`);
    return result;
  } catch (error) {
    console.error('✗ Error al eliminar estudiante:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// FUNCIONES DE PROFESORES/STAFF
// ============================================

/**
 * Buscar staff por nombre
 */
async function buscarProfesor(nombre) {
  try {
    console.log(`🔍 Buscando profesor: ${nombre}`);
    const result = await makeRequest('GET', `/staff?search=${encodeURIComponent(nombre)}`);
    console.log(`✓ Encontrados ${result.total} profesores`);
    return result.staff;
  } catch (error) {
    console.error('✗ Error al buscar profesor:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtener un profesor por ID
 */
async function obtenerProfesor(id) {
  try {
    console.log(`📖 Obteniendo profesor ID: ${id}`);
    const staff = await makeRequest('GET', `/staff/${id}`);
    console.log(`✓ Profesor encontrado: ${staff.name}`);
    return staff;
  } catch (error) {
    console.error('✗ Error al obtener profesor:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Crear un nuevo profesor
 */
async function crearProfesor(datos) {
  try {
    console.log(`➕ Creando profesor: ${datos.name}`);

    // Validar datos requeridos
    if (!datos.name || !datos.email || !datos.designation) {
      throw new Error('Faltan datos requeridos: name, email, designation');
    }

    const staff = await makeRequest('POST', '/staff', datos);
    console.log(`✓ Profesor creado con ID: ${staff.id}`);
    return staff;
  } catch (error) {
    console.error('✗ Error al crear profesor:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Actualizar un profesor
 */
async function actualizarProfesor(id, datos) {
  try {
    console.log(`✏️ Actualizando profesor ID: ${id}`);
    const staff = await makeRequest('PUT', `/staff/${id}`, datos);
    console.log(`✓ Profesor actualizado: ${staff.name}`);
    return staff;
  } catch (error) {
    console.error('✗ Error al actualizar profesor:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Eliminar un profesor
 */
async function eliminarProfesor(id) {
  try {
    console.log(`🗑️ Eliminando profesor ID: ${id}`);
    const result = await makeRequest('DELETE', `/staff/${id}`);
    console.log(`✓ ${result.message}`);
    return result;
  } catch (error) {
    console.error('✗ Error al eliminar profesor:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Obtener lista de organizaciones
 */
async function obtenerOrganizaciones() {
  try {
    console.log('🏢 Obteniendo organizaciones...');
    const orgs = await makeRequest('GET', '/organizations');
    console.log(`✓ Encontradas ${orgs.length} organizaciones`);
    return orgs;
  } catch (error) {
    console.error('✗ Error al obtener organizaciones:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtener lista de clases/programas
 */
async function obtenerClases(organizationId = null) {
  try {
    const endpoint = organizationId ? `/classes?organizationId=${organizationId}` : '/classes';
    console.log('📚 Obteniendo clases...');
    const classes = await makeRequest('GET', endpoint);
    console.log(`✓ Encontradas ${classes.length} clases`);
    return classes;
  } catch (error) {
    console.error('✗ Error al obtener clases:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtener lista de secciones
 */
async function obtenerSecciones(classId = null) {
  try {
    const endpoint = classId ? `/sections?classId=${classId}` : '/sections';
    console.log('📑 Obteniendo secciones...');
    const sections = await makeRequest('GET', endpoint);
    console.log(`✓ Encontradas ${sections.length} secciones`);
    return sections;
  } catch (error) {
    console.error('✗ Error al obtener secciones:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// EJEMPLOS DE USO
// ============================================

async function ejemplos() {
  try {
    console.log('\n========================================');
    console.log('EJEMPLOS DE USO DEL BOT');
    console.log('========================================\n');

    // Ejemplo 1: Buscar estudiante
    console.log('\n--- Ejemplo 1: Buscar estudiante ---');
    const estudiantes = await buscarEstudiante('Juan');

    // Ejemplo 2: Crear estudiante
    console.log('\n--- Ejemplo 2: Crear estudiante ---');
    const nuevoEstudiante = await crearEstudiante({
      name: 'Test Bot Usuario',
      email: 'testbot@example.com',
      phone: '3001234567',
      classId: 1,
      sectionId: 1,
      organizationId: 1,
      tipoIdentificacion: 'CC',
      numeroIdentificacion: '1234567890'
    });

    // Ejemplo 3: Actualizar estudiante
    console.log('\n--- Ejemplo 3: Actualizar estudiante ---');
    const estudianteActualizado = await actualizarEstudiante(nuevoEstudiante.id, {
      phone: '3009999999'
    });

    // Ejemplo 4: Obtener datos auxiliares
    console.log('\n--- Ejemplo 4: Obtener datos auxiliares ---');
    const organizaciones = await obtenerOrganizaciones();
    const clases = await obtenerClases(1);
    const secciones = await obtenerSecciones(1);

    // Ejemplo 5: Eliminar estudiante de prueba
    console.log('\n--- Ejemplo 5: Eliminar estudiante de prueba ---');
    await eliminarEstudiante(nuevoEstudiante.id);

    console.log('\n✓ Todos los ejemplos ejecutados exitosamente');
  } catch (error) {
    console.error('\n✗ Error en ejemplos:', error.message);
  }
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

module.exports = {
  // Autenticación
  getToken,
  makeRequest,

  // Estudiantes
  buscarEstudiante,
  obtenerEstudiante,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,

  // Profesores
  buscarProfesor,
  obtenerProfesor,
  crearProfesor,
  actualizarProfesor,
  eliminarProfesor,

  // Auxiliares
  obtenerOrganizaciones,
  obtenerClases,
  obtenerSecciones
};

// Si se ejecuta directamente, correr ejemplos
if (require.main === module) {
  ejemplos();
}
