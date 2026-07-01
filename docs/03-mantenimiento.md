# 03 — Guía de mantenimiento

Cómo hacer los cambios más frecuentes sin romper nada.

---

## Flujo de trabajo general

```
1. Cambia el código (artifact en Claude o los archivos del repo)
2. Si es un cambio de UI/lógica: npm run build → sube dist/ a WordPress
3. Si es un cambio del plugin PHP: sube el .php actualizado a /wp-content/plugins/
4. Si es un cambio del proxy: git push → Vercel redeploya automáticamente
5. Haz commit del cambio en Git con un mensaje descriptivo
```

**Regla de oro:** el artifact de Claude (`curso-ia-ingenieria.jsx`) y la versión
de producción (`curso-app/src/CursoIA.jsx`) son el mismo componente con dos capas
de persistencia distintas. Cuando cambies uno, aplica el mismo cambio en el otro.

---

## Cambiar el contenido o system prompt de una semana

Abre `curso-app/src/CursoIA.jsx` y localiza el array `WEEKS`.
Cada semana tiene esta estructura:

```js
{
  id: 1,
  label: "Semana 1",
  title: "Tu primera aplicación",
  layer: "INTERFAZ",
  color: "#4F8EF7",
  tag: "Vibe Coding",
  summary: "Descripción breve...",
  objectives: [
    "Objetivo 1",
    "Objetivo 2",
  ],
  systemPrompt: `Eres el instructor técnico de la Semana 1...`
}
```

Edita el campo que necesites. El `systemPrompt` es lo más habitual — es lo que
define cómo se comporta el instructor de esa semana.

Después: `npm run build` → sube `dist/` → listo.

Aplica el mismo cambio en `curso-ia-ingenieria.jsx` para que el artifact en
Claude esté sincronizado.

---

## Añadir una semana nueva

1. Añade un objeto nuevo al array `WEEKS` en `CursoIA.jsx` con el `id` siguiente
2. Actualiza `TOTAL_ITEMS` si añades módulos (no semanas — las semanas se cuentan
   automáticamente con `WEEKS.length`)
3. Revisa que `isWeekUnlocked` sigue siendo correcto (depende de `weekId - 1`)
4. Actualiza `DELIVERABLE.systemPrompt` si el entregable debe evaluar la semana nueva
5. `npm run build` → sube `dist/`

---

## Cambiar el tono o exigencia del evaluador

En `CursoIA.jsx` localiza `EVAL_PROTOCOL` (justo después del array `WEEKS`).
Ahí está la instrucción que comparten todos los instructores sobre cómo evaluar.

Para cambiar la exigencia de una semana concreta sin tocar las demás, añade
una instrucción al final del `systemPrompt` de esa semana específicamente.

---

## Cambiar los códigos de acceso

Localiza en `CursoIA.jsx`:

```js
const VALID_CODES = ["IAENG-2026", "ALUMNO-VIP", "ACCESO-CURSO"];
```

Cámbia el array por los códigos que quieras entregar a tus alumnos.
Recuerda: esto es una barrera cosmética. El acceso real lo controla WordPress.

---

## Actualizar el build en WordPress

Cada vez que cambies el componente React o `storage.js`:

```bash
cd curso-app
npm run build
```

Sube el contenido de `dist/` por FTP a `/wp-content/uploads/curso-ia/`,
sobreescribiendo los archivos anteriores.

**Importante:** los archivos JS tienen hash en el nombre (ej. `index-BL6aOox1.js`).
Cada build genera un hash diferente. La plantilla PHP lee el `index.html` del
build y extrae las referencias automáticamente, así que no necesitas tocar nada
en WordPress — solo sobreescribir la carpeta `dist/`.

---

## Actualizar el proxy

El proxy (`curso-app/api/chat.js`) se actualiza con un simple `git push`.
Vercel redeploya automáticamente en segundos.

Si cambias el modelo de Claude:
```js
// En api/chat.js, línea del model:
model: model || "claude-sonnet-4-6",  // ← cámbialo aquí
```

---

## Actualizar el plugin de WordPress

Si modificas `wordpress/curso-ia-progreso/curso-ia-progreso.php`:

1. Sube el archivo actualizado por FTP a
   `/wp-content/plugins/curso-ia-progreso/curso-ia-progreso.php`
2. No necesitas desactivar y reactivar el plugin salvo que cambies los nombres
   de las constantes o los hooks

---

## Añadir un nuevo campo al expediente del alumno

El expediente (notas) es un objeto `{ session_id: string }` en user_meta.
Para añadir un campo nuevo:

1. En `storage.js` el endpoint `/notes` ya acepta cualquier objeto — no necesita
   cambios salvo que quieras un endpoint dedicado
2. En `CursoIA.jsx` usa `setNote(sessionId, valor)` donde lo necesites
3. En el plugin PHP, si añades un endpoint nuevo, sigue el patrón de los existentes

---

## Ver el progreso de un alumno desde WordPress

En el panel de WordPress:
1. Usuarios → selecciona el alumno
2. Baja hasta "User Meta" (con el plugin "User Meta" o similar, o directamente
   en la base de datos)

Las claves son:
- `_curso_ia_progress` → `{"week-1":true,"week-2":true,...}`
- `_curso_ia_notes`    → `{"week-1":"[fecha · APROBADO]\nResumen...","week-2":...}`
- `_curso_ia_convos`   → conversaciones por sesión (puede ser grande)
- `_curso_ia_access`   → `1` si el código de acceso fue validado

---

## Sincronizar artifact de Claude ↔ producción

El artifact (`curso-ia-ingenieria.jsx`) usa `window.storage` del entorno de
Claude. El componente de producción (`curso-app/src/CursoIA.jsx`) usa `storage.js`.

Las diferencias entre los dos archivos son exactamente estas líneas:

**Artifact (claude):**
```js
import { useState, useRef, useEffect } from "react";
// (sin import de storage — window.storage está disponible globalmente)
const API_PROXY_URL no existe — llama directo a api.anthropic.com
```

**Producción:**
```js
import { useState, useRef, useEffect } from "react";
import storage from "./storage.js";
const API_PROXY_URL = "/api/chat";  // o la URL de Vercel
```

Cuando iteres en Claude y quieras llevar los cambios a producción:
1. Copia el bloque del artifact que cambiaste
2. Pégalo en `curso-app/src/CursoIA.jsx` en el mismo lugar
3. Verifica que el import de `storage` sigue en la primera línea
4. `npm run build` → sube `dist/`
