/**
 * storage.js — Capa de persistencia sobre la REST API de WordPress
 *
 * Reemplaza el localStorage (y el window.storage del artifact) con llamadas
 * autenticadas a los endpoints del plugin curso-ia-progreso.
 *
 * El nonce y la URL base los inyecta WordPress en window.CursoIAConfig
 * (ver template-curso-ia.php). El curso no necesita gestionar login: si el
 * alumno está en la página, ya está autenticado por WordPress.
 *
 * Interfaz pública (misma que el artifact y localStorage):
 *   storage.get(key)           → { key, value } | null
 *   storage.set(key, value)    → { key, value } | null
 *   storage.delete(key)        → { key, deleted } | null
 *
 * Mapeo de claves del curso → endpoints REST:
 *   "course-access"         → /access
 *   "course-progress"       → /progress
 *   "course-notes"          → /notes
 *   "course-convo-*"        → /convo/{session_id}
 */

// ============================================================================
// Configuración (inyectada por WordPress en la plantilla)
// ============================================================================

const config = window.CursoIAConfig || {
  restUrl:  '/wp-json/curso-ia/v1',  // fallback para desarrollo local
  nonce:    '',
  userId:   0,
  userName: 'Alumno',
};

// ============================================================================
// Cliente REST base
// ============================================================================

async function wpFetch(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce':   config.nonce,
    },
    credentials: 'same-origin', // envía la cookie de sesión de WordPress
  };
  if (body !== null) opts.body = JSON.stringify(body);

  const res  = await fetch(`${config.restUrl}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    // El nonce expira en ~12h. Si el alumno tiene la página abierta mucho
    // tiempo, el siguiente guardado fallará con 403. Se lo notificamos.
    if (res.status === 403) {
      console.warn('[curso-ia] Nonce expirado. El alumno debe recargar la página.');
    }
    throw new Error(data?.message || `HTTP ${res.status}`);
  }
  return data;
}

// ============================================================================
// Lógica de mapeo: clave del curso → endpoint + payload
// ============================================================================

// Parsea la clave del curso y devuelve {endpoint, field?} para saber
// qué endpoint tocar y, en casos de objetos parciales, qué campo actualizar.
function resolveKey(key) {
  if (key === 'course-access')   return { type: 'access' };
  if (key === 'course-progress') return { type: 'progress' };
  if (key === 'course-notes')    return { type: 'notes' };
  if (key.startsWith('course-convo-')) {
    const sessionId = key.replace('course-convo-', '');
    return { type: 'convo', sessionId };
  }
  // Clave desconocida: no la almacenamos en el servidor.
  console.warn(`[curso-ia] Clave no reconocida, ignorada: ${key}`);
  return null;
}

// ============================================================================
// API pública: get / set / delete
// Devuelven la misma forma que el window.storage del artifact para que el
// componente React no necesite cambios en sus 11 call sites.
// ============================================================================

const storage = {

  async get(key) {
    const r = resolveKey(key);
    if (!r) return null;
    try {
      let data;
      if (r.type === 'access') {
        const res = await wpFetch('/access');
        // Normaliza a la forma {value} que espera el componente.
        data = res.granted ? 'granted' : null;
        return data ? { key, value: data } : null;
      }
      if (r.type === 'progress') {
        const res = await wpFetch('/progress');
        if (!res.data || Object.keys(res.data).length === 0) return null;
        return { key, value: JSON.stringify(res.data) };
      }
      if (r.type === 'notes') {
        const res = await wpFetch('/notes');
        if (!res.data || Object.keys(res.data).length === 0) return null;
        return { key, value: JSON.stringify(res.data) };
      }
      if (r.type === 'convo') {
        const res = await wpFetch(`/convo/${r.sessionId}`);
        if (!res.data) return null;
        return { key, value: JSON.stringify(res.data) };
      }
    } catch (err) {
      console.error(`[curso-ia] storage.get(${key}):`, err.message);
      return null;
    }
  },

  async set(key, value) {
    const r = resolveKey(key);
    if (!r) return null;
    try {
      if (r.type === 'access') {
        await wpFetch('/access', 'POST', { granted: value === 'granted' });
        return { key, value };
      }
      if (r.type === 'progress') {
        const data = JSON.parse(value);
        await wpFetch('/progress', 'POST', { data });
        return { key, value };
      }
      if (r.type === 'notes') {
        const data = JSON.parse(value);
        await wpFetch('/notes', 'POST', { data });
        return { key, value };
      }
      if (r.type === 'convo') {
        const data = JSON.parse(value);
        await wpFetch(`/convo/${r.sessionId}`, 'POST', { data });
        return { key, value };
      }
    } catch (err) {
      console.error(`[curso-ia] storage.set(${key}):`, err.message);
      return null;
    }
  },

  async delete(key) {
    const r = resolveKey(key);
    if (!r) return null;
    try {
      if (r.type === 'progress') {
        await wpFetch('/progress', 'DELETE');
        return { key, deleted: true };
      }
      if (r.type === 'notes') {
        await wpFetch('/notes', 'DELETE');
        return { key, deleted: true };
      }
      if (r.type === 'convo') {
        await wpFetch(`/convo/${r.sessionId}`, 'DELETE');
        return { key, deleted: true };
      }
      if (r.type === 'access') {
        await wpFetch('/access', 'POST', { granted: false });
        return { key, deleted: true };
      }
    } catch (err) {
      console.error(`[curso-ia] storage.delete(${key}):`, err.message);
      return null;
    }
  },

  // Reset completo del alumno: un único endpoint borra todo en el servidor.
  async resetAll() {
    try {
      await wpFetch('/reset', 'POST');
      return true;
    } catch (err) {
      console.error('[curso-ia] storage.resetAll():', err.message);
      return false;
    }
  },

  // Expone el nombre del alumno (inyectado por WordPress) para usarlo en
  // el UI o en el certificado si se quiere personalizar.
  getUserName() {
    return config.userName || 'Alumno';
  },

};

// ============================================================================
// HEARTBEAT — Refresco automático del nonce en el cliente
// ============================================================================
// El Heartbeat API de WordPress usa jQuery para enviar pulsos periódicos al
// servidor. Nos enganchamos a esos pulsos para:
//   1. Incluir { curso_ia_refresh_nonce: true } en cada envío.
//   2. Leer el nonce fresco de la respuesta y actualizar config.nonce.
//
// Si jQuery o el Heartbeat no están disponibles (entorno de desarrollo sin WP),
// se ignora silenciosamente — no rompe nada.
// ============================================================================

function initHeartbeat() {
  // jQuery lo carga WordPress. Si no está disponible, el heartbeat no existe.
  const $ = window.jQuery;
  if (!$ || !$.event) return;

  // 1. Añadir nuestro campo a cada pulso que el Heartbeat envía al servidor.
  $(document).on('heartbeat-send', (_e, data) => {
    data.curso_ia_refresh_nonce = true;
  });

  // 2. Leer el nonce fresco cuando el servidor responde.
  $(document).on('heartbeat-tick', (_e, data) => {
    if (data.curso_ia_nonce) {
      config.nonce = data.curso_ia_nonce;
      // Solo en desarrollo para confirmar que el ciclo funciona:
      // console.debug('[curso-ia] Nonce refrescado vía Heartbeat:', config.nonce);
    }
  });
}

// Espera a que el DOM esté listo (jQuery puede cargarse después del módulo).
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeartbeat);
} else {
  // Si el DOM ya está listo (módulo cargado en defer/async), ejecuta ya.
  initHeartbeat();
}

export default storage;
