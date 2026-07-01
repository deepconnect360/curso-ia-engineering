# 01 — Arquitectura

## Visión general

```
ALUMNO (navegador)
    │
    │  Abre la página del curso (está logueado en WordPress)
    ▼
WORDPRESS (tu dominio)
    │  La plantilla template-curso-ia.php:
    │  • Comprueba que el alumno está logueado y tiene acceso de pago
    │  • Inyecta window.CursoIAConfig { nonce, restUrl, userId, userName }
    │  • Carga el build del curso (HTML/CSS/JS estático)
    │
    │  El mini-plugin curso-ia-progreso.php expone:
    │  /wp-json/curso-ia/v1/progress   ← semanas aprobadas
    │  /wp-json/curso-ia/v1/notes      ← expediente por sesión
    │  /wp-json/curso-ia/v1/convo/{id} ← conversación guardada
    │  /wp-json/curso-ia/v1/access     ← código de acceso validado
    │  /wp-json/curso-ia/v1/reset      ← reset completo
    │
    ▼
REACT (curso-app/src/CursoIA.jsx)  ← corre en el navegador del alumno
    │
    ├── storage.js ──────────────► REST API de WordPress (progreso del alumno)
    │                               Autenticado con nonce de sesión WP.
    │                               Refresco automático vía Heartbeat API.
    │
    └── fetch(API_PROXY_URL) ────► VERCEL (curso-app/api/chat.js)
                                        │  Añade ANTHROPIC_API_KEY del servidor
                                        ▼
                                   ANTHROPIC API
                                   claude-sonnet-4-6
                                   (instructor, evaluador, auditor)
```

## Responsabilidades por capa

### WordPress
- **Muro de pago**: MemberPress / Paid Memberships Pro bloquea la página del
  curso a quien no haya pagado. Este es el único control de acceso real y seguro.
- **Autenticación**: el nonce de sesión autentica las llamadas REST. Caduca en
  ~12h y se refresca automáticamente vía Heartbeat cada 120s.
- **Persistencia**: el progreso de cada alumno vive en `user_meta` de WordPress,
  atado a su cuenta. Multi-dispositivo. El alumno puede cambiar de equipo sin
  perder nada.

### Vercel (proxy)
- **Seguridad de la API key**: la key de Anthropic vive en variables de entorno
  del servidor de Vercel. Nunca llega al navegador del alumno.
- **Límite de coste**: el proxy restringe `max_tokens` a 1500 como salvaguarda.
- **CORS**: solo acepta peticiones del dominio configurado en `ALLOWED_ORIGIN`.

### React (curso-app)
- **Lógica del curso**: semanas, evaluaciones, desbloqueo secuencial, expediente,
  historial de conversaciones, certificado.
- **Evaluación automática**: el instructor emite `[EVALUACIÓN: APROBADO/PENDIENTE]`
  y `[RESUMEN: ...]` en formato estructurado. El componente los parsea y actúa.
- **Sin estado propio**: todo el estado relevante (progreso, notas, conversaciones)
  se persiste en WordPress. Si el alumno recarga, lo recupera todo.

## Flujo de una sesión de evaluación

```
1. Alumno abre la Semana N
   → storage.get("course-convo-week-N")
   → WordPress devuelve la conversación guardada (si existe)

2. Alumno chatea con el instructor
   → fetch(API_PROXY_URL) → Vercel → Anthropic
   → Respuesta parseada en busca de [EVALUACIÓN:] y [RESUMEN:]

3. Instructor emite veredicto
   → [EVALUACIÓN: APROBADO] detectado
   → storage.set("course-progress", {..., "week-N": true})
   → WordPress guarda en user_meta del alumno
   → Semana N+1 se desbloquea en el UI

4. Resumen guardado en expediente
   → [RESUMEN: ...] detectado
   → storage.set("course-notes", {..., "week-N": "entrada fechada..."})
   → WordPress guarda en user_meta del alumno

5. Conversación persistida
   → storage.set("course-convo-week-N", {messages, history})
   → WordPress guarda en user_meta del alumno
```

## Coste estimado por alumno

| Componente     | Coste       | Notas                                      |
|----------------|-------------|---------------------------------------------|
| Vercel proxy   | $0          | Plan Hobby cubre holgadamente un curso      |
| WordPress/hosting | variable | Depende de tu hosting                      |
| Anthropic API  | ~$0.01–0.05 por sesión | Depende de la longitud. 10 semanas ≈ $0.50–2 por alumno |

El coste de Anthropic es el único que escala con el número de alumnos.
Ajusta `max_tokens` en `api/chat.js` si necesitas controlarlo.
