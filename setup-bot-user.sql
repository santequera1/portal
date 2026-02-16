-- Script para crear usuario del Bot
-- Ejecutar este script en el VPS después de crear el usuario mediante el API de auth/register

-- 1. Primero, crea el usuario via POST /api/auth/register con este body:
/*
{
  "name": "Bot Fundisalud",
  "email": "bot@fundisalud.edu.co",
  "password": "TU_PASSWORD_SUPER_SEGURO_AQUI",
  "role": "ADMIN",
  "organizationId": 1
}
*/

-- 2. Luego, obtén el token haciendo login via POST /api/auth/login:
/*
{
  "email": "bot@fundisalud.edu.co",
  "password": "TU_PASSWORD_SUPER_SEGURO_AQUI"
}
*/

-- 3. Guarda el token en tu bot y úsalo en todos los requests con el header:
-- Authorization: Bearer <TOKEN>

-- IMPORTANTE: El token expira después de cierto tiempo, así que tu bot debe:
-- 1. Intentar hacer la petición con el token actual
-- 2. Si recibe 401 Unauthorized, hacer login de nuevo para obtener un nuevo token
-- 3. Reintentar la petición con el nuevo token

-- Ejemplo de manejo de autenticación en el bot:

/*
const TOKEN_FILE = './bot-token.json';

async function getToken() {
  // Intentar leer token guardado
  try {
    const data = fs.readFileSync(TOKEN_FILE, 'utf8');
    const { token, expiresAt } = JSON.parse(data);

    // Si el token aún es válido, usarlo
    if (new Date(expiresAt) > new Date()) {
      return token;
    }
  } catch (error) {
    // Token no existe o no es válido
  }

  // Hacer login para obtener nuevo token
  const response = await axios.post('https://portal.fundisalud.edu.co/api/auth/login', {
    email: 'bot@fundisalud.edu.co',
    password: process.env.BOT_PASSWORD
  });

  const token = response.data.token;

  // Guardar token con fecha de expiración (por ejemplo, 7 días)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token, expiresAt }));

  return token;
}

async function makeAuthenticatedRequest(method, url, data) {
  try {
    const token = await getToken();
    return await axios({
      method,
      url,
      data,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expiró, limpiar cache y reintentar
      fs.unlinkSync(TOKEN_FILE);
      const token = await getToken();
      return await axios({
        method,
        url,
        data,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
    throw error;
  }
}
*/
