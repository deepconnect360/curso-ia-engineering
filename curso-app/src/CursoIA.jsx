import { useState, useRef, useEffect } from "react";
import storage from "./storage.js";

// ============================================================================
// CONFIGURACIÓN DE PRODUCCIÓN
// ============================================================================
// Endpoint del proxy Vercel que añade la API key en el servidor.
// Mismo dominio si el build vive en Vercel; URL completa si está en WordPress.
const API_PROXY_URL = "/api/chat";

const WEEKS = [
  {
    id: 1,
    label: "Semana 1",
    title: "Tu primera aplicación",
    layer: "INTERFAZ",
    color: "#4F8EF7",
    tag: "Vibe Coding",
    locked: false,
    summary: "Arrancas hablando con un agente y construyes tu primer proyecto. Entendemos qué tan potentes son estas herramientas y sus límites reales.",
    objectives: [
      "Crear tu primer proyecto con un agente de IA",
      "Entender el ciclo prompt → output → iteración",
      "Identificar los límites actuales de los modelos",
      "Abrir el capó: qué hay dentro de un LLM"
    ],
    systemPrompt: `Eres el instructor técnico de la Semana 1 del curso de IA aplicada: "Tu primera aplicación".

Tu misión: guiar al alumno para que construya su primer prototipo usando Vibe Coding — es decir, describir lo que quiere y dejar que la IA lo construya, sin preocuparse aún por la arquitectura.

Temas que dominas en esta semana:
- Qué es un agente de IA y cómo interactuar con él eficazmente
- El ciclo: prompt → output → evaluación → iteración
- Límites reales de los modelos actuales (alucinaciones, contexto, razonamiento)
- Anatomía básica de un LLM: tokens, embeddings, temperatura, contexto
- Cómo crear un proyecto en Claude y usarlo como base de trabajo

Estilo de enseñanza:
- Directo y práctico. Nada de teoría innecesaria.
- Haz preguntas para entender qué quiere construir el alumno.
- Propone el siguiente paso concreto, siempre.
- Si el alumno se atasca, da un ejemplo específico, no genérico.
- Cuando algo funcione, explica brevemente POR QUÉ funcionó.

Empieza saludando al alumno y preguntando: ¿qué quieres construir esta semana? Una idea, un proyecto, lo que sea. Nosotros lo hacemos realidad.`
  },
  {
    id: 2,
    label: "Semana 2",
    title: "Coge el control",
    layer: "LÓGICA",
    color: "#7C6AF5",
    tag: "Ingeniería",
    locked: false,
    summary: "Dejamos el Vibe Coding atrás. Pensamos como ingenieros: reglas, casos de uso, historias de usuario, roles y límites. Repositorios y herramientas profesionales.",
    objectives: [
      "Definir reglas y constraints para tu agente",
      "Escribir historias de usuario técnicas",
      "Usar repositorios Git con IA",
      "Estructurar un proyecto con roles y objetivos claros"
    ],
    systemPrompt: `Eres el instructor técnico de la Semana 2: "Coge el control".

Esta semana el alumno deja el Vibe Coding y empieza a pensar como ingeniero. El cambio de mentalidad es el núcleo.

Temas que dominas:
- Cómo definir reglas explícitas para un sistema de IA (system prompts, constraints, guardrails)
- Historias de usuario y casos de uso: formato "Como [rol], quiero [acción] para [objetivo]"
- Git básico integrado con flujo de IA: commits atómicos, ramas, PRs
- Definición de roles en un sistema: qué hace la IA, qué hace el humano, qué hace el código
- Cómo pasar de "pídele lo que quieras" a "define exactamente qué debe y no debe hacer"

Estilo de enseñanza:
- Exige precisión. Si el alumno es vago, pídele que sea más específico.
- Usa ejemplos concretos del proyecto del alumno (pregunta cuál es si no lo sabes).
- Enseña el "por qué" de cada práctica de ingeniería, no solo el "qué".
- Conecta siempre con la semana anterior: ¿cómo mejoraría lo que construiste?

Empieza preguntando en qué proyecto está trabajando y qué problema tuvo la semana pasada que se hubiera evitado con más estructura.`
  },
  {
    id: 3,
    label: "Semana 3",
    title: "Aprende a pillarla",
    layer: "CALIDAD",
    color: "#E85D75",
    tag: "Auditoría",
    locked: false,
    summary: "Auditas lo que produce la IA: detectas fallos, alucinaciones, atajos y deuda técnica. Montas pruebas. Introduces embeddings y búsqueda semántica.",
    objectives: [
      "Detectar alucinaciones y atajos del modelo",
      "Diseñar casos de prueba para outputs de IA",
      "Identificar y gestionar deuda técnica generada por IA",
      "Primeros pasos con embeddings y búsqueda semántica"
    ],
    systemPrompt: `Eres el instructor técnico de la Semana 3: "Aprende a pillarla".

Esta semana el alumno aprende a auditar y no aceptar nada a ciegas.

Temas que dominas:
- Tipos de errores de IA: alucinaciones factuales, atajos lógicos, código que compila pero falla, deuda técnica silenciosa
- Cómo diseñar un test suite para outputs de IA (casos felices, casos límite, casos de fallo)
- Métricas de evaluación: precisión, cobertura, consistencia, adherencia a specs
- Embeddings: qué son, cómo funcionan, cuándo usarlos
- Búsqueda semántica básica: similarity search, cosine distance, chunk size
- RAG básico: retrieval-augmented generation sin magia negra

Estilo de enseñanza:
- Sé escéptico constructivo. Enseña al alumno a dudar de los outputs con criterio.
- Da ejemplos de outputs reales donde la IA "parece correcta" pero está mal.
- Para embeddings y semántica: usa analogías concretas antes de la matemática.
- Conecta con el proyecto del alumno: ¿dónde podrías añadir búsqueda semántica?

Empieza preguntando: ¿alguna vez la IA te ha entregado algo que parecía correcto pero estaba mal? Cuéntame qué pasó.`
  },
  {
    id: 4,
    label: "Semana 4",
    title: "Dirígela como ingeniero I",
    layer: "ARQUITECTURA",
    color: "#F5A623",
    tag: "Arquitectura",
    locked: false,
    summary: "Conceptos técnicos de una aplicación profesional: arquitecturas estándar, tecnologías web y bases de datos. Frontend, backend, API y datos.",
    objectives: [
      "Entender arquitecturas web modernas (MVC, REST, SPA)",
      "Frontend vs Backend: dónde vive qué",
      "APIs: diseño, contratos, versioning",
      "Bases de datos: relacionales vs no relacionales"
    ],
    systemPrompt: `Eres el instructor técnico de la Semana 4: "Dirígela como ingeniero I — Arquitectura".

Esta semana el alumno entiende los fundamentos técnicos que hay detrás de una aplicación profesional.

Temas que dominas:
- Arquitecturas web: MVC, REST, SPA, SSR, microservicios (cuándo usar cada uno)
- Frontend: HTML/CSS/JS, frameworks (React, Vue), qué problema resuelven
- Backend: servidores, rutas, middleware, lógica de negocio
- APIs: qué es un contrato de API, REST vs GraphQL, versioning, documentación con OpenAPI
- Bases de datos: SQL (PostgreSQL, SQLite) vs NoSQL (MongoDB, Redis), cuándo usar cada uno
- Cómo la IA encaja en cada capa: dónde poner las llamadas al modelo, cómo gestionar latencia

Estilo de enseñanza:
- Usa diagramas en texto ASCII cuando sea necesario para explicar arquitecturas.
- Pregunta siempre: ¿en tu proyecto, dónde crees que vive este componente?
- No asumas conocimiento previo de ninguna tecnología específica.
- Conecta cada concepto con una decisión de arquitectura concreta.

Empieza con: Dibujemos juntos la arquitectura de tu proyecto actual. Dime qué has construido hasta ahora.`
  },
  {
    id: 5,
    label: "Semana 5",
    title: "Dirígela como ingeniero II",
    layer: "CALIDAD+",
    color: "#F5A623",
    tag: "Tests & Docs",
    locked: false,
    summary: "Tests, especificaciones, documentación y criterios de aceptación. Tu proyecto pasa de funcionar a ser sólido y mantenible.",
    objectives: [
      "Escribir especificaciones técnicas antes de codear",
      "Tests unitarios, de integración y e2e",
      "Documentación que realmente se usa",
      "Criterios de aceptación medibles"
    ],
    systemPrompt: `Eres el instructor técnico de la Semana 5: "Dirígela como ingeniero II — Tests y Documentación".

Esta semana el alumno hace que su proyecto sea mantenible y profesional.

Temas que dominas:
- Especificaciones técnicas: cómo escribirlas antes de codear (evita el "lo construimos y ya veremos")
- Testing: unitarios (Jest, pytest), integración, end-to-end (Playwright, Cypress)
- TDD básico: por qué escribir el test antes hace mejores decisiones
- Documentación técnica: README efectivo, ADRs (Architecture Decision Records), docstrings
- Criterios de aceptación: formato Given/When/Then, cómo ligarlos a tests
- Cómo usar IA para generar tests a partir de specs (y por qué hay que revisarlos)

Estilo de enseñanza:
- Sé pragmático: no todo necesita 100% de cobertura. Enseña a priorizar.
- Usa el proyecto del alumno para escribir ejemplos reales de tests y specs.
- Conecta con la Semana 3: los tests son la formalización de "pillarla".
- Haz escribir al alumno: que genere al menos una spec completa en la sesión.

Empieza preguntando: ¿tienes tests en tu proyecto? Si no, ¿qué parte te da más miedo que falle?`
  },
  {
    id: 6,
    label: "Semana 6",
    title: "Automatización y agentes I",
    layer: "INTEGRACIÓN",
    color: "#2DD4A0",
    tag: "APIs & Webhooks",
    locked: false,
    summary: "Conectas APIs, webhooks y bases de datos vectoriales. La IA empieza a trabajar sola en casos reales de tu proyecto.",
    objectives: [
      "Integrar APIs externas desde tu aplicación",
      "Webhooks: eventos y triggers automáticos",
      "Bases de datos vectoriales: Pinecone, Chroma, pgvector",
      "Primeros flujos autónomos con IA"
    ],
    systemPrompt: `Eres el instructor técnico de la Semana 6: "Automatización y agentes I".

Esta semana la IA empieza a trabajar sola. El alumno conecta sistemas y monta los primeros flujos autónomos.

Temas que dominas:
- Integración de APIs externas: autenticación (API keys, OAuth), rate limits, manejo de errores, reintentos
- Webhooks: qué son, cómo recibirlos, cómo procesarlos, idempotencia
- Bases de datos vectoriales: qué problema resuelven, opciones (Pinecone, Chroma, Weaviate, pgvector), inserción y consulta
- Diseño de un agente básico: loop de razonamiento, herramientas disponibles, criterios de parada
- Herramientas de automatización: n8n, Zapier, Make — cuándo usar plataformas vs código propio

Estilo de enseñanza:
- Siempre empieza con el caso de uso, luego la tecnología. No al revés.
- Haz construir algo concreto: "esta semana vas a automatizar X en tu proyecto".
- Advierte sobre los riesgos reales: loops infinitos, costos de API, datos corruptos.
- Muestra el código real de una integración simple antes de pasar a conceptos.

Empieza con: ¿Qué tarea repetitiva en tu proyecto te gustaría que la IA hiciera sola?`
  },
  {
    id: 7,
    label: "Semana 7",
    title: "Automatización y agentes II",
    layer: "AGENTES",
    color: "#2DD4A0",
    tag: "Flujos & Safety",
    locked: false,
    summary: "Montas rutinas y flujos que actúan solos. Aprendes a aislarlos para evitar desastres y a verificar que cumplen lo que tienen que hacer.",
    objectives: [
      "Diseñar flujos agénticos multi-paso",
      "Aislamiento y sandboxing de agentes",
      "Verificación y validación de acciones autónomas",
      "Gestión de errores en sistemas agénticos"
    ],
    systemPrompt: `Eres el instructor técnico de la Semana 7: "Automatización y agentes II — Flujos y Seguridad".

Esta semana el alumno escala sus agentes y aprende a no armar un desastre.

Temas que dominas:
- Diseño de flujos multi-paso: encadenamiento de prompts, paso de contexto entre pasos, estado compartido
- Aislamiento: por qué un agente no debe tener acceso a todo, principio de mínimo privilegio
- Sandboxing: entornos de prueba, datos de test vs producción, reverting acciones
- Patrones de verificación: human-in-the-loop, confirmación antes de acciones destructivas, logs de auditoría
- Gestión de errores en sistemas agénticos: timeouts, fallbacks, notificaciones, dead letter queues
- Evaluación de agentes: ¿cómo sabes que está haciendo lo correcto?

Estilo de enseñanza:
- Sé paranoico sobre seguridad. Enseña los escenarios de fallo, no solo los de éxito.
- Usa historias de terror reales (o plausibles) de agentes que se fueron de las manos.
- Para cada capacidad nueva, pregunta: ¿qué podría salir mal aquí?
- Conecta con el proyecto: ¿qué parte de tu flujo agéntico te preocupa más?

Empieza con: Cuéntame el flujo agéntico que construiste la semana pasada. Lo auditamos juntos.`
  },
  {
    id: 8,
    label: "Semana 8",
    title: "Llévala a producción",
    layer: "INFRA",
    color: "#FF6B35",
    tag: "Deploy",
    locked: false,
    summary: "Sacas el proyecto de la demo: despliegue, datos, logs, backups, monitorización y control de errores para que aguante con usuarios reales.",
    objectives: [
      "Despliegue en servidor: opciones y trade-offs",
      "Variables de entorno y secretos",
      "Logging, monitoring y alertas",
      "Backups, rollbacks y control de errores en producción"
    ],
    systemPrompt: `Eres el instructor técnico de la Semana 8: "Llévala a producción".

Esta semana el proyecto deja de ser una demo y se convierte en algo real.

Temas que dominas:
- Opciones de despliegue: VPS (Hetzner, DigitalOcean), PaaS (Railway, Render, Fly.io), serverless (Vercel, AWS Lambda)
- Variables de entorno y gestión de secretos: .env, Secret Manager, nunca en el repo
- Containerización básica: Docker, por qué importa, cómo dockerizar una app simple
- Logging: qué loggear, niveles (debug/info/warn/error), herramientas (Datadog, Grafana, simple stdout)
- Monitoring y alertas: uptime checks, error rates, latencia, cuándo despertar al ingeniero
- Backups: estrategia 3-2-1, backups de base de datos, testing de restore
- CI/CD básico: GitHub Actions para deploy automático
- Gestión de errores en producción: Sentry, error boundaries, graceful degradation

Estilo de enseñanza:
- Sé realista sobre costos. Da opciones gratuitas o baratas para proyectos pequeños.
- Haz que el alumno tome decisiones reales: ¿dónde vas a desplegar tu proyecto?
- El "funciona en mi máquina" no es suficiente. Esa es la mentalidad a cambiar.
- Conecta todo con el proyecto real del alumno.

Empieza con: ¿Tu proyecto funciona solo en tu máquina, o alguien más puede usarlo? Vamos a cambiarlo hoy.`
  },
  {
    id: 9,
    label: "Semana 9",
    title: "IA local y privada I",
    layer: "PRIVACIDAD",
    color: "#9B59B6",
    tag: "Local Models",
    locked: false,
    summary: "Modelos open-weight: cómo funcionan, cómo se configuran, qué hardware necesitan. Aislamos datos confidenciales y sensibles.",
    objectives: [
      "Ecosistema de modelos open-weight (Llama, Mistral, Qwen)",
      "Ollama, LM Studio: inferencia local",
      "Requisitos de hardware: GPU, VRAM, quantización",
      "Datos sensibles: qué enviar a la nube y qué no"
    ],
    systemPrompt: `Eres el instructor técnico de la Semana 9: "IA local y privada I".

Esta semana el alumno aprende a correr modelos sin depender de APIs externas.

Temas que dominas:
- Ecosistema open-weight: Llama 3, Mistral, Qwen, Phi, Gemma — capacidades y trade-offs
- Herramientas de inferencia local: Ollama (más fácil), LM Studio (más visual), vLLM (producción)
- Hardware: CPU vs GPU, VRAM necesaria por modelo, quantización (Q4, Q8, F16), qué puedes correr en tu máquina
- Privacidad de datos: taxonomía de sensibilidad, qué tipos de datos NUNCA deben salir de tu red
- GDPR y compliance básico: qué implica usar APIs externas con datos de usuarios
- Comparación local vs cloud: latencia, costo, privacidad, capacidades

Estilo de enseñanza:
- Sé honesto sobre las limitaciones: los modelos locales no son GPT-4. Explica el trade-off real.
- Haz que el alumno identifique datos sensibles en su proyecto específico.
- Da comandos concretos de Ollama para que pueda experimentar hoy mismo.
- Conecta con las semanas anteriores: ¿qué partes de tu sistema agéntico podrían ser locales?

Empieza con: ¿Tienes datos en tu proyecto que no deberían salir de tu máquina o de tu empresa? Vamos a identificarlos.`
  },
  {
    id: 10,
    label: "Semana 10",
    title: "IA local y privada II",
    layer: "SEGURIDAD",
    color: "#C0392B",
    tag: "Optimización & Hardening",
    locked: false,
    summary: "Optimizas contexto y costos. Proteges tu aplicación contra los vectores de ataque más comunes en sistemas de IA.",
    objectives: [
      "Optimización de contexto y reducción de costos",
      "Selección y benchmarking de modelos",
      "Prompt injection y jailbreaks: cómo protegerse",
      "Vectores de ataque en sistemas RAG y agénticos"
    ],
    systemPrompt: `Eres el instructor técnico de la Semana 10: "IA local y privada II — Optimización y Seguridad".

Esta es la semana final. El alumno sale con un sistema sólido, eficiente y seguro.

Temas que dominas:
- Optimización de costos: context caching, batch requests, model routing (usar el modelo pequeño cuando basta)
- Benchmarking de modelos: cómo evaluar para tu caso de uso específico, no los benchmarks genéricos
- Prompt injection: qué es, tipos (directa, indirecta), cómo funciona el ataque, cómo mitigarlo
- Jailbreaks: por qué existen, qué revelan sobre la arquitectura, cómo defender
- Ataques en sistemas RAG: data poisoning, exfiltración via embeddings, indirect injection
- Ataques en sistemas agénticos: tool abuse, escalada de privilegios, loops de recursos
- Defense in depth: sanitización de inputs, validación de outputs, monitoreo de anomalías
- Checklist de seguridad para un sistema de IA en producción

Estilo de enseñanza:
- Usa ejemplos de ataques reales (o muy plausibles). La teoría no asusta, los ejemplos sí.
- Haz que el alumno ataque su propio sistema: encuentra las vulnerabilidades antes que otros.
- Cierra el curso con una revisión del proyecto completo: ¿qué cambiarías sabiendo todo esto?
- Celebra el progreso: de Vibe Coding a sistema seguro en producción.

Empieza con: Llegaste a la última semana. Tu proyecto ha recorrido un camino largo. Hoy lo blindamos. ¿Qué parte te parece más vulnerable?`
  }
];

// Protocolo de evaluación: el instructor decide cuándo el alumno domina la semana.
// La app detecta la señal estructurada para desbloquear la siguiente semana.
const EVAL_PROTOCOL = `

---
PROTOCOLO DE EVALUACIÓN (obligatorio, aplica durante toda la sesión):

Tu rol no es solo enseñar: es CERTIFICAR que el alumno domina los objetivos antes de avanzar. El curso es estrictamente secuencial — la siguiente semana se desbloquea solo cuando tú apruebas a este alumno.

Cómo evaluar:
1. A lo largo de la sesión, haz preguntas de comprobación reales. No basta con que el alumno asienta: pídele que explique, aplique o justifique cada concepto clave de la semana.
2. Sé justo pero exigente. Aprobar sin dominio le hace daño al alumno en las semanas siguientes, que dependen de esta.
3. El alumno tiene reintentos ilimitados. No hay penalización por no aprobar a la primera.

Cuando emitir el veredicto:
- Emite el veredicto SOLO cuando tengas evidencia suficiente (varias respuestas del alumno), nunca en tu primer mensaje ni sin haber hecho preguntas.
- Si el alumno NO domina aún los objetivos, NO emitas APROBADO. En su lugar, dale feedback concreto de QUÉ reforzar y sigue trabajando con él, o invítalo a volver cuando lo practique.

Formato del veredicto (debe ir EXACTAMENTE así, en su propia línea, al final de tu mensaje):
- Si el alumno domina los objetivos de la semana:
[EVALUACIÓN: APROBADO] seguido de una frase breve de qué demostró dominar.
- Si todavía no:
[EVALUACIÓN: PENDIENTE] seguido de una frase concreta de qué le falta reforzar.

Usa estas etiquetas con cuidado: [EVALUACIÓN: APROBADO] desbloquea contenido real. No lo emitas por amabilidad, solo por dominio demostrado. Mientras dudes, usa PENDIENTE y sigue enseñando.

RESUMEN DE SESIÓN (obligatorio junto a cada veredicto):
Siempre que emitas un veredicto (APROBADO o PENDIENTE), añade también, en su propia línea al final, un resumen breve de la sesión que quedará registrado en el expediente del alumno. Formato exacto:
[RESUMEN: qué trabajó el alumno · qué demostró dominar · qué reforzar o documentar de cara a las siguientes semanas]
Escríbelo en tercera persona, objetivo y conciso (2-4 frases, una sola línea). Es un registro técnico, no un mensaje para el alumno. Ejemplo:
[RESUMEN: El alumno construyó un prototipo con un agente y entendió el ciclo prompt-output-iteración. Domina la idea de límites del modelo. Conviene reforzar la noción de contexto y tokens antes de la Semana 2.]`;

// Aplicar el protocolo a todas las semanas
WEEKS.forEach(w => { w.systemPrompt = w.systemPrompt + EVAL_PROTOCOL; });

// El entregable también se certifica (es la culminación del curso)
const DELIVERABLE_EVAL = `

---
PROTOCOLO DE EVALUACIÓN (obligatorio):

Eres el auditor final. Tu aprobación certifica que el proyecto del alumno está listo: en producción, seguro y mantenible. Audita capa por capa con preguntas reales antes de aprobar.

Cuando el proyecto pase tu auditoría completa, cierra con:
[EVALUACIÓN: APROBADO] seguido de un resumen de qué quedó sólido.
Si aún hay capas sin resolver:
[EVALUACIÓN: PENDIENTE] seguido del checklist concreto de lo que falta.

No apruebes por amabilidad. Un sistema mal auditado falla con usuarios reales.

RESUMEN DE AUDITORÍA (obligatorio junto a cada veredicto):
Siempre que emitas un veredicto, añade en su propia línea al final un resumen del estado del proyecto que quedará en el expediente. Formato exacto:
[RESUMEN: estado del proyecto por capas · qué quedó sólido · qué falta o conviene documentar antes de producción]
En tercera persona, objetivo, 2-4 frases en una sola línea.`;

// El módulo extra también evalúa, pero NO bloquea nada: es libre y autodidacta.
// La aprobación solo certifica que el alumno domina los fundamentos de programación.
const EXTRA_EVAL = `

---
PROTOCOLO DE EVALUACIÓN (orientativo, este módulo es libre y no bloquea otros contenidos):

Tu rol incluye certificar cuándo el alumno domina los fundamentos de programación (Python y/o JavaScript) suficientes para escribir, no solo auditar. Esto es una señal de progreso para el alumno, no un requisito para acceder a nada.

Cómo evaluar:
- A lo largo de las sesiones, pide al alumno que escriba código real, lo explique y lo depure. No basta con que reconozca conceptos: debe poder aplicarlos.
- Evalúa criterio, no memorización: ¿sabe decidir entre Python y JS según el caso? ¿entiende por qué su código funciona? ¿sabe revisar lo que genera una IA?
- Reintentos ilimitados, sin penalización.

Cuándo emitir el veredicto:
- Solo cuando tengas evidencia real (el alumno ha escrito y razonado código), nunca en el primer mensaje.
- Si aún no domina los fundamentos, da feedback concreto de qué practicar y sigue enseñando.

Formato del veredicto (en su propia línea, al final de tu mensaje):
- Si domina los fundamentos para escribir con criterio:
[EVALUACIÓN: APROBADO] seguido de una frase de qué demostró dominar.
- Si todavía no:
[EVALUACIÓN: PENDIENTE] seguido de qué reforzar.

Recuerda: aprobar aquí no desbloquea ni bloquea nada — solo certifica el dominio del alumno. Aun así, úsalo con honestidad: solo APROBADO cuando el alumno demuestre que sabe escribir y razonar su propio código.

RESUMEN DE SESIÓN (obligatorio junto a cada veredicto):
Siempre que emitas un veredicto, añade en su propia línea al final un resumen que quedará en el expediente del alumno. Formato exacto:
[RESUMEN: qué practicó · qué lenguajes/conceptos domina · qué reforzar]
En tercera persona, objetivo, 2-4 frases en una sola línea.`;

const LAYER_COLORS = {
  "INTERFAZ": "#4F8EF7",
  "LÓGICA": "#7C6AF5",
  "CALIDAD": "#E85D75",
  "ARQUITECTURA": "#F5A623",
  "CALIDAD+": "#F5A623",
  "INTEGRACIÓN": "#2DD4A0",
  "AGENTES": "#2DD4A0",
  "INFRA": "#FF6B35",
  "PRIVACIDAD": "#9B59B6",
  "SEGURIDAD": "#C0392B"
};

// Stack de tecnologías agrupado por categoría
const TECH_STACK = [
  {
    category: "Editores & Agentes",
    color: "#4F8EF7",
    items: [
      { name: "VSCode", note: "Editor base" },
      { name: "Opencode", note: "Agente de código en terminal" },
      { name: "Claude", note: "Modelo principal de razonamiento" },
      { name: "ChatGPT", note: "Modelo de contraste" },
      { name: "DeepSeek", note: "Modelo de razonamiento/coste" }
    ]
  },
  {
    category: "Modelos locales & Inferencia",
    color: "#9B59B6",
    items: [
      { name: "Qwen", note: "Modelo open-weight" },
      { name: "Hermes", note: "Modelo open-weight tool-use" },
      { name: "vLLM", note: "Servidor de inferencia" },
      { name: "NVIDIA", note: "GPU / CUDA para inferencia" }
    ]
  },
  {
    category: "Datos & Memoria",
    color: "#2DD4A0",
    items: [
      { name: "Qdrant", note: "Base de datos vectorial" },
      { name: "Postgres", note: "Base de datos relacional" },
      { name: "SQLite", note: "Base de datos embebida" }
    ]
  },
  {
    category: "Agentes web & Búsqueda",
    color: "#F5A623",
    items: [
      { name: "OpenClaw", note: "Agente de navegación / scraping" },
      { name: "SearXNG", note: "Metabuscador auto-alojado y privado" }
    ]
  },
  {
    category: "Infraestructura & Herramientas",
    color: "#FF6B35",
    items: [
      { name: "Git", note: "Control de versiones" },
      { name: "Bash", note: "Automatización en terminal" },
      { name: "Docker", note: "Containerización y despliegue" }
    ]
  }
];

// Entregable final
const DELIVERABLE = {
  label: "Entregable",
  title: "Proyecto Final Auditado",
  color: "#E85D75",
  layer: "AUDITORÍA",
  heroTitle: "Un proyecto auditado por nosotros",
  intro: "Sales con un sistema de IA real, construido por ti y auditado por el experto. No una demo bonita: un proyecto que funciona de verdad, con criterio técnico detrás de cada decisión.",
  pillars: [
    {
      title: "Construido por ti",
      color: "#4F8EF7",
      text: "El proyecto es tuyo de principio a fin. Tú decides qué construyes, tú lo levantas, tú lo llevas a producción."
    },
    {
      title: "Auditado por el experto",
      color: "#E85D75",
      text: "Revisamos tu arquitectura, tus decisiones, tus pruebas y tu seguridad. Detectamos lo que falla antes de que falle con usuarios reales."
    },
    {
      title: "En producción, no en demo",
      color: "#FF6B35",
      text: "Despliegue real, datos reales, logs, backups, monitorización y control de errores. Un sistema que aguanta cuando lo usa gente de verdad."
    },
    {
      title: "Seguro y privado",
      color: "#C0392B",
      text: "Datos sensibles aislados, costes optimizados y la aplicación blindada contra los vectores de ataque más comunes."
    }
  ],
  systemPrompt: `Eres el auditor técnico senior del curso de IA aplicada. El alumno ha llegado al final y quiere preparar su ENTREGABLE FINAL: un proyecto de IA real, construido por él y auditado por ti.

Tu misión: ayudar al alumno a planificar, refinar y auditar su proyecto final para que sea un sistema sólido, en producción, seguro y mantenible — no una demo.

Tecnologías del stack del curso que conoces y puedes recomendar según el caso:
- Editores/agentes: VSCode, Opencode, Claude, ChatGPT, DeepSeek
- Modelos locales/inferencia: Qwen, Hermes, vLLM, NVIDIA/CUDA
- Datos: Qdrant (vectorial), Postgres, SQLite
- Agentes web/búsqueda: OpenClaw, SearXNG
- Infra: Git, Bash, Docker

Marco de auditoría que aplicas (revísalo punto por punto con el alumno):
1. Arquitectura — ¿Las piezas (frontend, backend, API, datos, IA) encajan bien? ¿Hay acoplamientos peligrosos?
2. Calidad — ¿Hay specs, tests y criterios de aceptación? ¿Cómo se detectan alucinaciones y deuda técnica?
3. Agentes — Si hay flujos autónomos: ¿están aislados? ¿hay human-in-the-loop donde toca? ¿qué pasa si fallan?
4. Producción — ¿Despliegue, logs, backups, monitorización, control de errores?
5. Privacidad — ¿Qué datos son sensibles? ¿Qué sale a la nube y qué se queda local?
6. Seguridad — ¿Prompt injection, tool abuse, validación de inputs/outputs? ¿Costes controlados?

Estilo:
- Eres exigente pero constructivo. Tu trabajo es encontrar lo que falla antes de que falle en producción.
- No aceptes respuestas vagas. Si el alumno dice "está seguro", pregunta exactamente cómo lo sabe.
- Adapta el stack al proyecto del alumno, no al revés. No metas tecnología que no haga falta.
- Termina cada auditoría con un checklist accionable de lo que falta.

Empieza preguntando: Cuéntame tu proyecto final. ¿Qué hace, para quién, y qué stack has usado hasta ahora? A partir de ahí lo auditamos capa por capa.`
};
DELIVERABLE.systemPrompt = DELIVERABLE.systemPrompt + DELIVERABLE_EVAL;

// Módulo extra: Programación con IA
const EXTRA_MODULE = {
  label: "Extra",
  color: "#7C6AF5",
  layer: "PYTHON · JS",
  badge: "EXTRA · EN DIRECTO",
  title: "Programación en Python y JavaScript con IA",
  subtitle: "Aprende a programar para 2026 y más allá: en directo, con prioridad, para escribir y no solo auditar.",
  pitch: "No solo vienes a aprender a usar una IA. Vienes a entrenar criterio técnico: cómo decidir, probar, auditar y llevar un sistema con IA fuera de una demo bonita.",
  objectives: [
    {
      title: "Criterio técnico",
      color: "#4F8EF7",
      text: "Diseñar sistemas, aislar fallos, definir pruebas y auditar decisiones."
    },
    {
      title: "Ingeniería agéntica",
      color: "#7C6AF5",
      text: "Aprende a dirigir a los agentes como los ingenieros de Silicon Valley."
    },
    {
      title: "Llévala a producción",
      color: "#FF6B35",
      text: "Convierte tu proyecto en una app más robusta, con seguridad, copias y control de errores."
    },
    {
      title: "Optimiza, securiza y anonimiza",
      color: "#C0392B",
      text: "Aprende a ahorrar tokens, proteger tus datos y hacer que tu proyecto sea lo más seguro posible."
    }
  ],
  audience: [
    {
      title: "Quieres implementar IA",
      text: "Dedicarte a integrar inteligencia artificial como técnico o ingeniero de producto en empresas y proyectos ajenos."
    },
    {
      title: "Trabajas en una empresa o equipo",
      text: "Y quieres construir herramientas, productos o prototipos para acelerar y mejorar los procesos de tu empresa."
    },
    {
      title: "Tienes un proyecto en mente",
      text: "Algo que quieres montar y necesitas que funcione de verdad, sin perder meses ni clientes por errores o cosas mal hechas."
    }
  ],
  systemPrompt: `Eres el instructor del módulo extra "Programación en Python y JavaScript con IA". Este es un módulo en directo y con prioridad, enfocado en que el alumno aprenda a ESCRIBIR código (no solo auditarlo), usando IA como copiloto.

Tu misión: enseñar Python y JavaScript con criterio técnico, para que el alumno pueda construir, probar, auditar y llevar a producción sistemas con IA.

Temas que dominas:
- Python: sintaxis esencial, estructuras de datos, funciones, clases, entornos virtuales, pip, librerías clave (requests, FastAPI, pydantic, los SDKs de IA)
- JavaScript: sintaxis moderna (ES6+), async/await, Node.js, npm, fetch, frameworks frontend básicos
- Cómo usar IA para programar BIEN: cuándo confiar en el código generado, cómo revisarlo, cómo iterar
- Debugging con IA: leer errores, aislar fallos, escribir tests
- Del prototipo a producción: estructurar proyectos, manejar dependencias, variables de entorno
- Criterio técnico: cuándo Python vs JavaScript, cómo decidir arquitectura, cómo auditar tus propias decisiones

Estilo de enseñanza:
- Enseñas escribiendo código real, no solo explicando teoría. Da ejemplos ejecutables.
- Adaptas el lenguaje (Python o JS) según lo que el alumno quiera construir.
- Insistes en el criterio: no se trata de copiar lo que dice la IA, sino de entender por qué.
- Conectas con el curso principal: este módulo te da la capacidad de escribir lo que antes solo dirigías.
- Eres paciente con principiantes pero no condescendiente. Subes el nivel a medida que el alumno avanza.

Empieza preguntando: ¿Tienes experiencia previa programando, o partimos de cero? Y dime: ¿qué te gustaría ser capaz de construir tú mismo, sin depender de nadie?`
};
EXTRA_MODULE.systemPrompt = EXTRA_MODULE.systemPrompt + EXTRA_EVAL;

// Bloque de notas del especialista, reutilizable en cada vista de detalle.
function SpecialistNotes({ value, onSave, accent }) {
  const [text, setText] = useState(value || "");
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => { setText(value || ""); }, [value]);

  const handleSave = () => {
    onSave(text);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 1800);
  };
  const dirty = (value || "") !== text;

  // Parsea el historial acumulativo en entradas individuales.
  const entries = (value || "")
    .split(/\n\n———\n\n/)
    .map(e => e.trim())
    .filter(Boolean)
    .map(block => {
      const m = block.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
      if (m) {
        const header = m[1];
        const isApproved = /APROBADO/i.test(header);
        const isPending = /PENDIENTE/i.test(header);
        return { header, body: m[2].trim(), isApproved, isPending };
      }
      return { header: null, body: block, isApproved: false, isPending: false };
    });

  return (
    <div style={{
      marginTop: "32px",
      background: "#0E1525",
      border: "1px solid #1C2340",
      borderRadius: "10px",
      padding: "18px 18px"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10px", color: "#3A4565", letterSpacing: "0.12em"
        }}>
          // EXPEDIENTE · HISTORIAL DEL INSTRUCTOR
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {value && !editing && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px", color: "#4A5A7A"
            }}>
              {entries.length} {entries.length === 1 ? "entrada" : "entradas"}
            </span>
          )}
          <button
            onClick={() => { setEditing(e => !e); setText(value || ""); }}
            style={{
              background: "none", border: "none",
              color: editing ? "#6B7A9E" : (accent || "#4F8EF7"),
              cursor: "pointer",
              fontSize: "10px", fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            {editing ? "cancelar" : "editar a mano"}
          </button>
        </div>
      </div>

      {/* Modo lectura: timeline de entradas */}
      {!editing && (
        entries.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#3A4565", lineHeight: "1.6", fontStyle: "italic" }}>
            Sin registros todavía. El instructor añadirá un resumen fechado cada vez que te evalúe.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {entries.map((e, i) => {
              const c = e.isApproved ? "#2DD4A0" : e.isPending ? "#C9A062" : "#6B7A9E";
              return (
                <div key={i} style={{
                  background: "#0A0F1E",
                  border: "1px solid #161D33",
                  borderLeft: `3px solid ${c}`,
                  borderRadius: "8px",
                  padding: "12px 14px"
                }}>
                  {e.header && (
                    <p style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px", color: c, letterSpacing: "0.05em", marginBottom: "6px"
                    }}>
                      {i === 0 && <span style={{ color: accent || "#4F8EF7" }}>● </span>}
                      {e.header}
                    </p>
                  )}
                  <p style={{ fontSize: "13px", color: "#B8C4D8", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {e.body}
                  </p>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modo edición: textarea con el historial completo en crudo */}
      {editing && (
        <>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Historial del expediente. Puedes corregir o ampliar las entradas a mano."
            rows={8}
            style={{
              width: "100%",
              background: "#0A0F1E",
              border: "1px solid #161D33",
              borderRadius: "8px",
              color: "#D0D8EC",
              fontSize: "13px",
              lineHeight: "1.6",
              padding: "12px 14px",
              resize: "vertical",
              fontFamily: "'JetBrains Mono', monospace",
              outline: "none"
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px" }}>
            <button
              onClick={handleSave}
              disabled={!dirty}
              style={{
                background: dirty ? (accent || "#4F8EF7") : "#1C2340",
                color: dirty ? "#0A0F1E" : "#3A4565",
                border: "none",
                padding: "8px 18px",
                borderRadius: "7px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: dirty ? "pointer" : "default"
              }}
            >
              {saved ? "✓ Guardado" : "Guardar cambios"}
            </button>
            <span style={{ fontSize: "11px", color: "#3A4565" }}>
              Separa entradas con una línea «———». Las ediciones se conservan.
            </span>
          </div>
        </>
      )}

      {!editing && (
        <p style={{ fontSize: "11px", color: "#3A4565", marginTop: "12px", lineHeight: "1.5" }}>
          Cada evaluación del instructor añade una entrada nueva arriba. El historial persiste entre sesiones.
        </p>
      )}
    </div>
  );
}

export default function CursoIA() {
  const [activeWeek, setActiveWeek] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [view, setView] = useState("home"); // "home" | "week" | "chat"
  const [completed, setCompleted] = useState({}); // { "week-1": true, "deliverable": true, ... }
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(null); // notificación de desbloqueo
  const [lastVerdict, setLastVerdict] = useState(null); // "APROBADO" | "PENDIENTE" | null
  const [notes, setNotes] = useState({}); // { "week-1": "texto...", ... } notas del especialista
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [savingConvo, setSavingConvo] = useState(false);
  // --- Barrera de acceso (cosmética, no es seguridad real) ---
  const [unlocked, setUnlocked] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const STORAGE_KEY = "course-progress";
  const NOTES_KEY = "course-notes";
  const ACCESS_KEY = "course-access";
  // Códigos válidos. Cámbialos por los que entregues a tus alumnos de pago.
  // NOTA: esto es visible en el código del artifact — disuade, no protege.
  const VALID_CODES = ["IAENG-2026", "ALUMNO-VIP", "ACCESO-CURSO"];
  const TOTAL_ITEMS = WEEKS.length + 2; // semanas + entregable + extra

  // Identificador estable de cualquier sesión (semana, entregable, extra)
  const sessionIdOf = (obj) => {
    if (!obj) return null;
    if (obj.id) return `week-${obj.id}`;
    if (obj.label === "Entregable") return "deliverable";
    if (obj.label === "Extra") return "extra";
    return null;
  };
  const convoKeyOf = (obj) => `course-convo-${sessionIdOf(obj)}`;

  // Comprobar si ya se introdujo un código válido antes (persistido).
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(ACCESS_KEY);
        if (res && res.value === "granted") setUnlocked(true);
      } catch (err) {
        // Sin acceso previo
      }
      setAccessChecked(true);
    })();
  }, []);

  const submitAccessCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (VALID_CODES.map(c => c.toUpperCase()).includes(code)) {
      setUnlocked(true);
      setCodeError(false);
      try { await storage.set(ACCESS_KEY, "granted"); } catch (e) { /* ignore */ }
    } else {
      setCodeError(true);
    }
  };

  const lockAccess = async () => {
    setUnlocked(false);
    setCodeInput("");
    try { await storage.delete(ACCESS_KEY); } catch (e) { /* ignore */ }
  };

  // Cargar progreso al iniciar
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        if (res && res.value) {
          setCompleted(JSON.parse(res.value));
        }
      } catch (err) {
        // No hay progreso guardado todavía — empezamos de cero
      }
      setProgressLoaded(true);
    })();
  }, []);

  // Guardar progreso cada vez que cambia (tras la carga inicial)
  useEffect(() => {
    if (!progressLoaded) return;
    (async () => {
      try {
        await storage.set(STORAGE_KEY, JSON.stringify(completed));
      } catch (err) {
        console.error("No se pudo guardar el progreso:", err);
      }
    })();
  }, [completed, progressLoaded]);

  // Cargar notas del especialista al iniciar
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(NOTES_KEY);
        if (res && res.value) setNotes(JSON.parse(res.value));
      } catch (err) {
        // Sin notas guardadas todavía
      }
      setNotesLoaded(true);
    })();
  }, []);

  // Guardar notas cuando cambian
  useEffect(() => {
    if (!notesLoaded) return;
    (async () => {
      try {
        await storage.set(NOTES_KEY, JSON.stringify(notes));
      } catch (err) {
        console.error("No se pudieron guardar las notas:", err);
      }
    })();
  }, [notes, notesLoaded]);

  const toggleComplete = (itemId) => {
    setCompleted(prev => {
      const next = { ...prev };
      if (next[itemId]) delete next[itemId];
      else next[itemId] = true;
      return next;
    });
  };

  const setNote = (sessionId, text) => {
    setNotes(prev => {
      const next = { ...prev };
      if (text && text.trim()) next[sessionId] = text;
      else delete next[sessionId];
      return next;
    });
  };

  // Añade una entrada fechada del instructor al inicio del expediente, sin borrar lo previo.
  const appendNote = (sessionId, resumen, verdict) => {
    const stamp = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
    const tag = verdict === "APROBADO" ? "APROBADO" : verdict === "PENDIENTE" ? "PENDIENTE" : "REGISTRO";
    const entry = `[${stamp} · ${tag}]\n${resumen}`;
    setNotes(prev => {
      const existing = prev[sessionId] ? prev[sessionId].trim() : "";
      // Evita duplicar exactamente el mismo resumen consecutivo.
      if (existing.startsWith(`[${stamp} · ${tag}]`) && existing.includes(resumen)) {
        return prev;
      }
      const merged = existing ? `${entry}\n\n———\n\n${existing}` : entry;
      return { ...prev, [sessionId]: merged };
    });
  };

  const resetProgress = () => {
    if (!window.confirm("¿Reiniciar todo el progreso? Se borrarán las aprobaciones, las conversaciones guardadas y las notas del especialista. Esta acción no se puede deshacer.")) return;
    setCompleted({});
    setJustUnlocked(null);
    setLastVerdict(null);
    setNotes({});
    // Un único endpoint borra todo el progreso del alumno en el servidor.
    storage.resetAll().catch(err =>
      console.error('[curso-ia] Error al resetear:', err)
    );
  };

  const completedCount = Object.keys(completed).filter(k => completed[k]).length;
  const progressPct = Math.round((completedCount / TOTAL_ITEMS) * 100);

  // ---- Lógica de desbloqueo secuencial estricto ----
  // Semana 1 siempre abierta. Cada semana N>1 exige aprobar la N-1.
  const isWeekUnlocked = (weekId) => {
    if (weekId === 1) return true;
    return !!completed[`week-${weekId - 1}`];
  };

  // Las 10 semanas aprobadas desbloquean el entregable final.
  const allWeeksDone = WEEKS.every(w => completed[`week-${w.id}`]);
  const isDeliverableUnlocked = allWeeksDone;
  // El módulo extra siempre está libre.

  // Detecta el veredicto del instructor en el texto de respuesta.
  const parseVerdict = (text) => {
    if (/\[EVALUACIÓN:\s*APROBADO\]/i.test(text)) return "APROBADO";
    if (/\[EVALUACIÓN:\s*PENDIENTE\]/i.test(text)) return "PENDIENTE";
    return null;
  };

  // Extrae el resumen de sesión que el instructor registra en el expediente.
  const parseResumen = (text) => {
    const m = text.match(/\[RESUMEN:\s*([\s\S]*?)\]/i);
    return m ? m[1].trim() : null;
  };

  // Limpia las etiquetas técnicas para no mostrarlas crudas al alumno.
  const stripVerdictTag = (text) =>
    text
      .replace(/\[EVALUACIÓN:\s*(APROBADO|PENDIENTE)\]/gi, "")
      .replace(/\[RESUMEN:[\s\S]*?\]/gi, "")
      .trim();

  // Procesa el veredicto: marca aprobado y calcula qué se desbloqueó.
  const handleVerdict = (verdict, sessionObj) => {
    if (verdict !== "APROBADO" || !sessionObj) {
      if (verdict === "PENDIENTE") setLastVerdict("PENDIENTE");
      return;
    }
    setLastVerdict("APROBADO");

    let itemId;
    if (sessionObj.id) itemId = `week-${sessionObj.id}`;
    else if (sessionObj.label === "Entregable") itemId = "deliverable";
    else if (sessionObj.label === "Extra") itemId = "extra";

    if (!itemId) return;

    setCompleted(prev => {
      if (prev[itemId]) return prev; // ya estaba aprobado, no re-notificar
      // Calcular desbloqueo solo en la primera aprobación
      if (sessionObj.id && sessionObj.id < WEEKS.length) {
        const next = WEEKS.find(w => w.id === sessionObj.id + 1);
        setJustUnlocked({ type: "week", week: next });
      } else if (sessionObj.id === WEEKS.length) {
        setJustUnlocked({ type: "deliverable" });
      }
      return { ...prev, [itemId]: true };
    });
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const startWeek = (week) => {
    setActiveWeek(week);
    setMessages([]);
    setConversationHistory([]);
    setLastVerdict(null);
    setJustUnlocked(null);
    setView("chat");
    // Intentar restaurar conversación guardada; si no hay, arrancar de cero.
    (async () => {
      let restored = false;
      try {
        const res = await storage.get(convoKeyOf(week));
        if (res && res.value) {
          const saved = JSON.parse(res.value);
          if (saved && Array.isArray(saved.messages) && saved.messages.length) {
            setMessages(saved.messages);
            setConversationHistory(saved.history || []);
            restored = true;
          }
        }
      } catch (err) {
        // No había conversación guardada
      }
      if (!restored) {
        setTimeout(() => {
          fetchResponse([], week.systemPrompt, "__INIT__");
        }, 300);
      }
    })();
  };

  // Guardar la conversación de la sesión activa cuando cambian los mensajes.
  useEffect(() => {
    if (view !== "chat" || !activeWeek || loading) return;
    if (messages.length === 0) return;
    (async () => {
      try {
        await storage.set(
          convoKeyOf(activeWeek),
          JSON.stringify({ messages, history: conversationHistory })
        );
      } catch (err) {
        console.error("No se pudo guardar la conversación:", err);
      }
    })();
  }, [messages, loading, view]);

  // Borra la conversación guardada de una sesión (para "empezar de nuevo").
  const clearConversation = async (sessionObj) => {
    try {
      await storage.delete(convoKeyOf(sessionObj));
    } catch (err) {
      // ignore
    }
    setMessages([]);
    setConversationHistory([]);
    setLastVerdict(null);
    setTimeout(() => {
      fetchResponse([], sessionObj.systemPrompt, "__INIT__");
    }, 200);
  };

  // Datos para el certificado
  const todayStr = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const certificateId = `IA-ENG-${WEEKS.filter(w => completed[`week-${w.id}`]).length}${completed["deliverable"] ? "D" : ""}${completed["extra"] ? "C" : ""}-${new Date().getFullYear()}`;

  // Imprime / guarda como PDF el certificado abriendo una ventana con estilos propios.
  const printCertificate = () => {
    const weeksDone = WEEKS.filter(w => completed[`week-${w.id}`]);
    const win = window.open("", "_blank");
    if (!win) {
      window.alert("Permite las ventanas emergentes para descargar el certificado, o usa una captura de la vista.");
      return;
    }
    const rows = weeksDone.map(w =>
      `<tr><td class="n">${String(w.id).padStart(2,"0")}</td><td>${w.title}</td><td class="layer">${w.layer}</td></tr>`
    ).join("");
    const extras = [
      completed["deliverable"] ? "Entregable final · Proyecto auditado" : null,
      completed["extra"] ? "Certificado · Programación en Python y JavaScript con IA" : null
    ].filter(Boolean).map(t => `<li>${t}</li>`).join("");

    win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Certificado · ${certificateId}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Inter',sans-serif; background:#0A0F1E; color:#E8EDF5; padding:48px; }
.cert { max-width:840px; margin:0 auto; background:linear-gradient(135deg,#0E1525,#0A0F1E); border:1px solid #1C2340; border-radius:16px; padding:56px 56px; position:relative; overflow:hidden; }
.cert:before { content:''; position:absolute; top:0; left:0; right:0; height:4px; background:linear-gradient(90deg,#4F8EF7,#7C6AF5,#2DD4A0,#FF6B35,#C0392B); }
.eyebrow { font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:0.2em; color:#4F8EF7; text-transform:uppercase; margin-bottom:24px; }
h1 { font-size:34px; font-weight:700; line-height:1.15; margin-bottom:8px; }
h1 span { color:#4F8EF7; }
.sub { color:#6B7A9E; font-size:15px; margin-bottom:36px; }
.label { font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.12em; color:#3A4565; margin:28px 0 12px; }
table { width:100%; border-collapse:collapse; }
td { padding:8px 0; font-size:14px; border-bottom:1px solid #161D33; color:#B8C4D8; }
td.n { font-family:'JetBrains Mono',monospace; color:#4F8EF7; width:40px; }
td.layer { font-family:'JetBrains Mono',monospace; font-size:10px; color:#3A4565; text-align:right; letter-spacing:0.08em; }
ul { list-style:none; }
li { font-size:14px; color:#2DD4A0; padding:6px 0; }
li:before { content:'✓ '; }
.foot { margin-top:40px; display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:16px; }
.foot .meta { font-family:'JetBrains Mono',monospace; font-size:11px; color:#4A5A7A; line-height:1.8; }
.seal { width:64px; height:64px; border-radius:50%; border:2px solid #4F8EF7; display:flex; align-items:center; justify-content:center; font-size:24px; color:#4F8EF7; }
.note { margin-top:32px; font-size:11px; color:#3A4565; text-align:center; }
@media print { body { background:#fff; padding:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; } .cert { border:none; } .note{display:none;} }
</style></head><body>
<div class="cert">
  <div class="eyebrow">◈ IA Engineering · Certificado de finalización</div>
  <h1>De Vibe Coding a<br><span>producción segura.</span></h1>
  <p class="sub">Este certificado acredita la finalización del programa de Ingeniería de IA aplicada, evaluado y aprobado capa por capa.</p>
  <div class="label">// SEMANAS APROBADAS</div>
  <table>${rows}</table>
  ${extras ? `<div class="label">// MÓDULOS ADICIONALES</div><ul>${extras}</ul>` : ""}
  <div class="foot">
    <div class="meta">
      ID · ${certificateId}<br>
      Fecha · ${todayStr}<br>
      Evaluación · certificada por instructor
    </div>
    <div class="seal">◈</div>
  </div>
  <p class="note">Usa Cmd/Ctrl + P para guardar como PDF.</p>
</div>
<script>setTimeout(function(){window.print();}, 600);</script>
</body></html>`);
    win.document.close();
  };

  // Inicia una sesión de chat para cualquier módulo (semana, entregable, extra)
  const startSession = (sessionObj) => {
    startWeek(sessionObj);
  };

  const fetchResponse = async (history, systemPrompt, userMsg) => {
    setLoading(true);
    const isInit = userMsg === "__INIT__";
    
    const msgs = isInit
      ? [{ role: "user", content: "Empieza la sesión de esta semana. Salúdame y arranca con tu primera pregunta." }]
      : [...history, { role: "user", content: userMsg }];

    try {
      const response = await fetch(API_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: msgs
        })
      });

      if (!response.ok) {
        throw new Error(`Proxy respondió ${response.status}`);
      }

      const data = await response.json();
      const assistantText = data.content?.[0]?.text || "Error al obtener respuesta.";

      // El historial que enviamos al modelo conserva el texto completo (con la etiqueta),
      // para que el instructor recuerde su propio veredicto en turnos siguientes.
      const newHistory = [
        ...msgs,
        { role: "assistant", content: assistantText }
      ];

      // Detectar veredicto y actuar sobre el progreso.
      const verdict = parseVerdict(assistantText);
      if (verdict) handleVerdict(verdict, activeWeek);

      // Detectar resumen de sesión y añadirlo al expediente (historial acumulativo).
      const resumen = parseResumen(assistantText);
      if (resumen) {
        const sid = sessionIdOf(activeWeek);
        if (sid) appendNote(sid, resumen, verdict);
      }

      // Lo que se muestra al alumno va sin las etiquetas crudas.
      const displayText = stripVerdictTag(assistantText);

      setConversationHistory(newHistory);
      setMessages(prev => [
        ...prev,
        ...(isInit ? [] : [{ role: "user", text: userMsg }]),
        { role: "assistant", text: displayText, verdict }
      ]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "Error de conexión. Verifica tu acceso a la API." }]);
    }

    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    fetchResponse(conversationHistory, activeWeek.systemPrompt, userMsg);
  };

  // RED DE SEGURIDAD 1: fuerza al instructor a emitir un veredicto con el formato exacto.
  const requestEvaluation = () => {
    if (loading || !activeWeek) return;
    const prompt = "Evalúa ahora mi nivel según los objetivos de esta sesión. Decide si ya domino el contenido o qué me falta, y cierra tu mensaje OBLIGATORIAMENTE con la etiqueta exacta [EVALUACIÓN: APROBADO] o [EVALUACIÓN: PENDIENTE] en su propia línea al final.";
    setMessages(prev => [...prev, { role: "user", text: "🎓 Solicité una evaluación de mi nivel.", isSystem: true }]);
    fetchResponse(conversationHistory, activeWeek.systemPrompt, prompt);
  };

  // RED DE SEGURIDAD 2: override manual del especialista (marca aprobado sin pasar por el modelo).
  const manualOverride = (target) => {
    const obj = target || activeWeek;
    if (!obj) return;
    const ok = window.confirm(
      "Override del especialista:\n\n¿Marcar esta sesión como APROBADA manualmente?\n\nÚsalo solo si el instructor confirmó el dominio pero no emitió la etiqueta de evaluación. Desbloqueará el contenido siguiente."
    );
    if (ok) handleVerdict("APROBADO", obj);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goHome = () => {
    setView("home");
    setActiveWeek(null);
    setMessages([]);
    setConversationHistory([]);
  };

  const openWeekDetail = (week) => {
    setActiveWeek(week);
    setView("week");
  };

  // --- Pantalla de acceso (barrera cosmética) ---
  if (accessChecked && !unlocked) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0A0F1E",
        color: "#E8EDF5",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px"
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          input:focus { outline: none; }
          button:focus { outline: none; }
          .gate-shake { animation: shake 0.35s; }
          @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        `}</style>
        <div style={{
          width: "100%", maxWidth: "420px",
          background: "linear-gradient(135deg, #0E1525, #0A0F1E)",
          border: "1px solid #1C2340",
          borderRadius: "16px",
          padding: "40px 32px",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "3px",
            background: "linear-gradient(90deg,#4F8EF7,#7C6AF5,#2DD4A0)"
          }} />
          <div style={{
            width: "44px", height: "44px", background: "#4F8EF7",
            borderRadius: "10px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "20px", marginBottom: "20px"
          }}>◈</div>

          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px", color: "#4F8EF7", letterSpacing: "0.18em",
            textTransform: "uppercase", marginBottom: "12px"
          }}>
            Acceso al curso
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "8px", lineHeight: "1.2" }}>
            IA Engineering
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7A9E", lineHeight: "1.6", marginBottom: "26px" }}>
            Introduce el código de acceso que recibiste al inscribirte para entrar al programa.
          </p>

          <div className={codeError ? "gate-shake" : ""}>
            <input
              type="text"
              value={codeInput}
              onChange={e => { setCodeInput(e.target.value); setCodeError(false); }}
              onKeyDown={e => { if (e.key === "Enter") submitAccessCode(); }}
              placeholder="CÓDIGO DE ACCESO"
              style={{
                width: "100%",
                background: "#0A0F1E",
                border: `1px solid ${codeError ? "#C0392B" : "#1C2340"}`,
                borderRadius: "8px",
                color: "#E8EDF5",
                fontSize: "14px",
                letterSpacing: "0.05em",
                padding: "13px 16px",
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: codeError ? "8px" : "16px"
              }}
            />
            {codeError && (
              <p style={{
                fontSize: "12px", color: "#E85D75", marginBottom: "16px",
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                Código no válido. Revisa el que recibiste o contacta con soporte.
              </p>
            )}
          </div>

          <button
            onClick={submitAccessCode}
            disabled={!codeInput.trim()}
            style={{
              width: "100%",
              background: codeInput.trim() ? "#4F8EF7" : "#1C2340",
              color: codeInput.trim() ? "#0A0F1E" : "#3A4565",
              border: "none",
              padding: "13px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: codeInput.trim() ? "pointer" : "default"
            }}
          >
            Entrar →
          </button>

          <p style={{
            fontSize: "11px", color: "#3A4565", marginTop: "20px",
            lineHeight: "1.5", textAlign: "center"
          }}>
            ¿No tienes código? El acceso se entrega al completar la inscripción del programa.
          </p>
        </div>
      </div>
    );
  }

  // Mientras se comprueba el acceso, evitar parpadeo
  if (!accessChecked) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0A0F1E",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ color: "#2A3356", fontSize: "24px" }}>◈</span>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0F1E",
      color: "#E8EDF5",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      display: "flex",
      flexDirection: "column"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0A0F1E; }
        ::-webkit-scrollbar-thumb { background: #2A3356; border-radius: 2px; }
        textarea:focus { outline: none; }
        button:focus { outline: none; }
        .week-card:hover { transform: translateY(-2px); border-color: rgba(79,142,247,0.4) !important; }
        .week-card { transition: all 0.2s ease; }
        .send-btn:hover { background: #3a7ef5 !important; }
        .send-btn { transition: background 0.15s; }
        .back-btn:hover { color: #4F8EF7 !important; }
        .back-btn { transition: color 0.15s; }
        .obj-item { animation: fadeSlide 0.3s ease both; }
        @keyframes fadeSlide { from { opacity:0; transform: translateX(-8px); } to { opacity:1; transform: translateX(0); } }
        .msg-assistant { animation: msgIn 0.2s ease; }
        @keyframes msgIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
        .layer-badge { font-family: 'JetBrains Mono', monospace; }
        .stack-line { transition: opacity 0.2s; }
        .stack-line:hover { opacity: 1 !important; }
      `}</style>

      {/* HEADER */}
      <header style={{
        borderBottom: "1px solid #1C2340",
        padding: "16px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#0A0F1E",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {view !== "home" && (
            <button
              className="back-btn"
              onClick={goHome}
              style={{
                background: "none", border: "none", color: "#6B7A9E",
                cursor: "pointer", fontSize: "13px", display: "flex",
                alignItems: "center", gap: "6px", padding: "4px 0"
              }}
            >
              ← Volver
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "28px", height: "28px", background: "#4F8EF7",
              borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontSize: "14px" }}>◈</span>
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "13px", fontWeight: "600", color: "#E8EDF5",
              letterSpacing: "0.05em"
            }}>
              IA ENGINEERING
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px", color: "#4F8EF7", background: "rgba(79,142,247,0.1)",
              padding: "2px 8px", borderRadius: "4px", border: "1px solid rgba(79,142,247,0.2)"
            }}>
              10 semanas
            </span>
          </div>
        </div>
        {activeWeek && view === "chat" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#2DD4A0",
              boxShadow: "0 0 8px #2DD4A0"
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px", color: "#6B7A9E"
            }}>
              {activeWeek.label.toUpperCase()} · {activeWeek.title}
            </span>
          </div>
        )}
      </header>

      {/* HOME */}
      {view === "home" && (
        <main style={{ flex: 1, padding: "40px 28px", maxWidth: "920px", margin: "0 auto", width: "100%" }}>
          {/* Hero */}
          <div style={{ marginBottom: "48px" }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px", color: "#4F8EF7", letterSpacing: "0.15em",
              marginBottom: "16px", textTransform: "uppercase"
            }}>
              De Vibe Coding a producción
            </p>
            <h1 style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: "700",
              lineHeight: "1.15",
              color: "#E8EDF5",
              marginBottom: "16px"
            }}>
              Aprende a dirigir la IA<br />
              <span style={{ color: "#4F8EF7" }}>como ingeniero.</span>
            </h1>
            <p style={{
              fontSize: "15px", color: "#6B7A9E", lineHeight: "1.7",
              maxWidth: "520px"
            }}>
              10 semanas. Desde tu primer prototipo hasta un sistema agéntico en producción, seguro y mantenible. Claude te acompaña como instructor técnico en cada sesión.
            </p>
          </div>

          {/* Progreso global */}
          <div style={{
            background: "#0E1525",
            border: "1px solid #1C2340",
            borderRadius: "12px",
            padding: "20px 22px",
            marginBottom: "44px"
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "14px", flexWrap: "wrap", gap: "8px"
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "26px", fontWeight: "600", color: "#4F8EF7"
                }}>
                  {progressPct}%
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px", color: "#4A5A7A"
                }}>
                  {completedCount} / {TOTAL_ITEMS} completado{completedCount === 1 ? "" : "s"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {completedCount > 0 && (
                  <button
                    onClick={resetProgress}
                    className="back-btn"
                    style={{
                      background: "none", border: "1px solid #1C2340",
                      color: "#4A5A7A", cursor: "pointer",
                      fontSize: "10px", fontFamily: "'JetBrains Mono', monospace",
                      padding: "5px 10px", borderRadius: "6px"
                    }}
                  >
                    reiniciar progreso
                  </button>
                )}
                <button
                  onClick={() => { if (window.confirm("¿Cerrar el acceso? Tendrás que volver a introducir el código.")) lockAccess(); }}
                  className="back-btn"
                  style={{
                    background: "none", border: "1px solid #1C2340",
                    color: "#4A5A7A", cursor: "pointer",
                    fontSize: "10px", fontFamily: "'JetBrains Mono', monospace",
                    padding: "5px 10px", borderRadius: "6px"
                  }}
                >
                  cerrar acceso
                </button>
              </div>
            </div>

            {/* Barra */}
            <div style={{
              height: "8px", background: "#0A0F1E", borderRadius: "4px",
              overflow: "hidden", border: "1px solid #161D33"
            }}>
              <div style={{
                height: "100%",
                width: `${progressPct}%`,
                background: progressPct === 100
                  ? "linear-gradient(90deg, #2DD4A0, #4F8EF7)"
                  : "linear-gradient(90deg, #4F8EF7, #7C6AF5)",
                borderRadius: "4px",
                transition: "width 0.5s ease"
              }} />
            </div>

            {/* Segmentos por semana */}
            <div style={{ display: "flex", gap: "4px", marginTop: "12px", flexWrap: "wrap" }}>
              {WEEKS.map(w => (
                <div
                  key={w.id}
                  title={`${w.label}: ${w.title}`}
                  style={{
                    flex: "1 1 0",
                    minWidth: "14px",
                    height: "4px",
                    borderRadius: "2px",
                    background: completed[`week-${w.id}`] ? w.color : "#1C2340",
                    transition: "background 0.3s"
                  }}
                />
              ))}
            </div>

            {allWeeksDone && (
              <div style={{
                marginTop: "16px", paddingTop: "16px",
                borderTop: "1px solid #161D33",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: "10px"
              }}>
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px", color: "#2DD4A0",
                  display: "flex", alignItems: "center", gap: "8px"
                }}>
                  <span>✓</span> Las 10 semanas, aprobadas.
                </p>
                <button
                  onClick={() => setView("certificate")}
                  style={{
                    background: "linear-gradient(90deg, #2DD4A0, #4F8EF7)",
                    color: "#0A0F1E", border: "none",
                    padding: "8px 16px", borderRadius: "7px",
                    fontSize: "12px", fontWeight: "700", cursor: "pointer"
                  }}
                >
                  Ver mi certificado →
                </button>
              </div>
            )}
          </div>

          {/* Stack visual + week cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px", color: "#3A4565", letterSpacing: "0.12em",
              marginBottom: "4px"
            }}>
              // ARQUITECTURA DEL CURSO — CAPAS
            </p>
            {WEEKS.map((week, i) => {
              const unlocked = isWeekUnlocked(week.id);
              const done = !!completed[`week-${week.id}`];
              return (
              <div
                key={week.id}
                className={unlocked ? "week-card" : ""}
                onClick={() => unlocked && openWeekDetail(week)}
                style={{
                  background: "#0E1525",
                  border: `1px solid ${done ? week.color + "40" : "#1C2340"}`,
                  borderRadius: "10px",
                  padding: "18px 20px",
                  cursor: unlocked ? "pointer" : "not-allowed",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  alignItems: "center",
                  gap: "16px",
                  opacity: unlocked ? 1 : 0.5
                }}
              >
                {/* Layer indicator */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{
                    width: "4px",
                    height: "40px",
                    borderRadius: "2px",
                    background: unlocked ? week.color : "#2A3356",
                    opacity: done ? 1 : (unlocked ? 0.55 : 0.4)
                  }} />
                  {done && (
                    <div style={{
                      position: "absolute", top: "-6px", left: "-6px",
                      width: "16px", height: "16px", borderRadius: "50%",
                      background: week.color, color: "#0A0F1E",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: "700",
                      border: "2px solid #0A0F1E"
                    }}>
                      ✓
                    </div>
                  )}
                  {!unlocked && (
                    <div style={{
                      position: "absolute", top: "-6px", left: "-7px",
                      width: "16px", height: "16px", borderRadius: "50%",
                      background: "#1C2340", color: "#6B7A9E",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "9px",
                      border: "2px solid #0A0F1E"
                    }}>
                      🔒
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px", color: week.color, letterSpacing: "0.1em"
                    }}>
                      {week.layer}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px", color: "#3A4565"
                    }}>·</span>
                    <span style={{
                      fontSize: "10px", color: "#3A4565",
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {week.label.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#E8EDF5", marginBottom: "2px" }}>
                    {week.title}
                  </p>
                  <p style={{ fontSize: "12px", color: "#4A5A7A", lineHeight: "1.5" }}>
                    {week.summary.slice(0, 90)}…
                  </p>
                </div>

                {/* Tag + arrow */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <span style={{
                    fontSize: "10px",
                    color: unlocked ? week.color : "#4A5A7A",
                    background: unlocked ? `${week.color}18` : "#141B2E",
                    border: `1px solid ${unlocked ? week.color + "30" : "#1C2340"}`,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontFamily: "'JetBrains Mono', monospace",
                    whiteSpace: "nowrap"
                  }}>
                    {done ? "aprobada" : unlocked ? week.tag : "bloqueada"}
                  </span>
                  <span style={{ color: "#2A3356", fontSize: "16px" }}>
                    {unlocked ? "→" : "🔒"}
                  </span>
                </div>
              </div>
              );
            })}
          </div>

          <div style={{
            marginTop: "36px",
            padding: "16px 20px",
            background: "rgba(79,142,247,0.05)",
            border: "1px solid rgba(79,142,247,0.15)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <span style={{ fontSize: "18px" }}>◈</span>
            <p style={{ fontSize: "13px", color: "#6B7A9E", lineHeight: "1.6" }}>
              <strong style={{ color: "#4F8EF7" }}>Cómo funciona:</strong> el curso es secuencial. En cada sesión el instructor te evalúa con preguntas reales y desbloquea la siguiente semana solo cuando demuestras dominio. Aprueba las 10 para acceder al entregable final. El módulo de programación está siempre disponible.
            </p>
          </div>

          {/* ENTREGABLE FINAL */}
          <div style={{ marginTop: "48px" }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px", color: "#3A4565", letterSpacing: "0.12em",
              marginBottom: "12px"
            }}>
              // ENTREGABLE FINAL
            </p>
            <div
              className={isDeliverableUnlocked ? "week-card" : ""}
              onClick={() => isDeliverableUnlocked && setView("deliverable")}
              style={{
                background: "linear-gradient(135deg, #1A0E18 0%, #0E1525 60%)",
                border: `1px solid ${completed["deliverable"] ? "#E85D7555" : "#3A1E2E"}`,
                borderRadius: "12px",
                padding: "26px 24px",
                cursor: isDeliverableUnlocked ? "pointer" : "not-allowed",
                position: "relative",
                overflow: "hidden",
                opacity: isDeliverableUnlocked ? 1 : 0.55
              }}
            >
              <div style={{
                position: "absolute", top: 0, right: 0, width: "120px", height: "100%",
                background: "radial-gradient(circle at 80% 50%, rgba(232,93,117,0.12), transparent 70%)"
              }} />
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px", color: "#E85D75", letterSpacing: "0.1em",
                  background: "rgba(232,93,117,0.12)", border: "1px solid rgba(232,93,117,0.25)",
                  padding: "3px 10px", borderRadius: "4px"
                }}>
                  {completed["deliverable"] ? "✓ AUDITADO" : "◆ PROYECTO AUDITADO"}
                </span>
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#E8EDF5", marginBottom: "8px" }}>
                {DELIVERABLE.heroTitle}
              </h3>
              <p style={{ fontSize: "13px", color: "#8A6B78", lineHeight: "1.6", maxWidth: "560px", marginBottom: "14px" }}>
                {DELIVERABLE.intro}
              </p>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px", color: isDeliverableUnlocked ? "#E85D75" : "#6B5560"
              }}>
                {isDeliverableUnlocked
                  ? "Planificar y auditar mi proyecto →"
                  : `🔒 Aprueba las 10 semanas para desbloquear (${WEEKS.filter(w => completed[`week-${w.id}`]).length}/10)`}
              </span>
            </div>
          </div>

          {/* STACK DE TECNOLOGÍAS */}
          <div style={{ marginTop: "44px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px", color: "#3A4565", letterSpacing: "0.12em"
              }}>
                // STACK DE TECNOLOGÍAS
              </p>
              <button
                onClick={() => setView("stack")}
                style={{
                  background: "none", border: "none", color: "#4F8EF7",
                  cursor: "pointer", fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                ver todo →
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {TECH_STACK.flatMap(g => g.items).map((item, i) => (
                <span key={i} style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px", color: "#6B7A9E",
                  background: "#0E1525", border: "1px solid #1C2340",
                  padding: "5px 11px", borderRadius: "6px"
                }}>
                  {item.name}
                </span>
              ))}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px", color: "#3A4565",
                padding: "5px 11px", fontStyle: "italic"
              }}>
                + las que el especialista considere
              </span>
            </div>
          </div>

          {/* MÓDULO EXTRA */}
          <div style={{ marginTop: "44px" }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px", color: "#3A4565", letterSpacing: "0.12em",
              marginBottom: "12px"
            }}>
              // MÓDULO ADICIONAL
            </p>
            <div
              className="week-card"
              onClick={() => setView("extra")}
              style={{
                background: "linear-gradient(135deg, #14102A 0%, #0E1525 60%)",
                border: `1px solid ${completed["extra"] ? "#7C6AF555" : "#2A2350"}`,
                borderRadius: "12px",
                padding: "26px 24px",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{
                position: "absolute", top: 0, right: 0, width: "140px", height: "100%",
                background: "radial-gradient(circle at 80% 50%, rgba(124,106,245,0.14), transparent 70%)"
              }} />
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px", color: "#7C6AF5", letterSpacing: "0.1em",
                  background: "rgba(124,106,245,0.12)", border: "1px solid rgba(124,106,245,0.25)",
                  padding: "3px 10px", borderRadius: "4px"
                }}>
                  {completed["extra"] ? "✓ CERTIFICADO" : EXTRA_MODULE.badge}
                </span>
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#E8EDF5", marginBottom: "8px" }}>
                {EXTRA_MODULE.title}
              </h3>
              <p style={{ fontSize: "13px", color: "#6E6890", lineHeight: "1.6", maxWidth: "560px", marginBottom: "14px" }}>
                {EXTRA_MODULE.subtitle}
              </p>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px", color: "#7C6AF5"
              }}>
                {completed["extra"] ? "Repasar o seguir aprendiendo →" : "Aprender a escribir código →"}
              </span>
            </div>
          </div>

          <div style={{ height: "32px" }} />
        </main>
      )}

      {/* WEEK DETAIL */}
      {view === "week" && activeWeek && (
        <main style={{ flex: 1, padding: "36px 28px", maxWidth: "720px", margin: "0 auto", width: "100%" }}>
          <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px", color: activeWeek.color, letterSpacing: "0.12em"
            }}>
              {activeWeek.layer}
            </span>
            <span style={{ color: "#2A3356", fontSize: "10px" }}>·</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px", color: "#3A4565"
            }}>
              {activeWeek.label.toUpperCase()}
            </span>
          </div>

          <h2 style={{
            fontSize: "28px", fontWeight: "700", color: "#E8EDF5",
            marginBottom: "12px", lineHeight: "1.2"
          }}>
            {activeWeek.title}
          </h2>

          <p style={{
            fontSize: "14px", color: "#6B7A9E", lineHeight: "1.75",
            marginBottom: "32px", borderLeft: `3px solid ${activeWeek.color}`,
            paddingLeft: "16px"
          }}>
            {activeWeek.summary}
          </p>

          <div style={{ marginBottom: "32px" }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px", color: "#3A4565", letterSpacing: "0.12em",
              marginBottom: "14px"
            }}>
              // OBJETIVOS DE LA SEMANA
            </p>
            {activeWeek.objectives.map((obj, i) => (
              <div
                key={i}
                className="obj-item"
                style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  marginBottom: "10px",
                  animationDelay: `${i * 0.05}s`
                }}
              >
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px", color: activeWeek.color,
                  marginTop: "3px", flexShrink: 0
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p style={{ fontSize: "14px", color: "#B8C4D8", lineHeight: "1.5" }}>
                  {obj}
                </p>
              </div>
            ))}
          </div>

          {/* Cómo se aprueba esta semana */}
          <div style={{
            background: completed[`week-${activeWeek.id}`] ? "rgba(45,212,160,0.06)" : "#0E1525",
            border: `1px solid ${completed[`week-${activeWeek.id}`] ? "rgba(45,212,160,0.25)" : "#1C2340"}`,
            borderRadius: "10px",
            padding: "16px 18px",
            marginBottom: "28px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start"
          }}>
            <span style={{ fontSize: "16px", marginTop: "1px" }}>
              {completed[`week-${activeWeek.id}`] ? "✓" : "◈"}
            </span>
            <p style={{ fontSize: "13px", color: "#8A92AA", lineHeight: "1.6" }}>
              {completed[`week-${activeWeek.id}`]
                ? <><strong style={{ color: "#2DD4A0" }}>Semana aprobada.</strong> El instructor certificó que dominas estos objetivos. {activeWeek.id < WEEKS.length ? "La siguiente semana ya está desbloqueada." : "Has completado el temario: el entregable final está disponible."}</>
                : <><strong style={{ color: activeWeek.color }}>Cómo se aprueba:</strong> el instructor te hará preguntas durante la sesión y desbloqueará la siguiente semana solo cuando demuestres dominio de los objetivos. Reintentos ilimitados, sin penalización.</>}
            </p>
          </div>

          <div style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap"
          }}>
            <button
              onClick={() => startWeek(activeWeek)}
              style={{
                background: activeWeek.color,
                color: "#0A0F1E",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                letterSpacing: "0.02em"
              }}
            >
              {completed[`week-${activeWeek.id}`] ? "Repasar con el instructor →" : "Iniciar sesión →"}
            </button>
            <button
              onClick={goHome}
              style={{
                background: "none",
                color: "#6B7A9E",
                border: "1px solid #1C2340",
                padding: "12px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              Ver todas las semanas
            </button>
          </div>

          {!completed[`week-${activeWeek.id}`] && (
            <button
              onClick={() => manualOverride()}
              style={{
                background: "none", border: "none",
                color: "#3A4565", cursor: "pointer",
                fontSize: "11px", fontFamily: "'JetBrains Mono', monospace",
                marginTop: "16px", padding: "4px 0",
                textDecoration: "underline", textUnderlineOffset: "3px"
              }}
            >
              override del especialista · aprobar manualmente
            </button>
          )}

          <SpecialistNotes
            value={notes[`week-${activeWeek.id}`]}
            onSave={(t) => setNote(`week-${activeWeek.id}`, t)}
            accent={activeWeek.color}
          />
        </main>
      )}

      {/* ENTREGABLE FINAL VIEW */}
      {view === "deliverable" && (
        <main style={{ flex: 1, padding: "36px 28px", maxWidth: "780px", margin: "0 auto", width: "100%" }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px", color: "#E85D75", letterSpacing: "0.12em",
            background: "rgba(232,93,117,0.12)", border: "1px solid rgba(232,93,117,0.25)",
            padding: "3px 10px", borderRadius: "4px"
          }}>
            ◆ ENTREGABLE FINAL
          </span>

          <h2 style={{
            fontSize: "30px", fontWeight: "700", color: "#E8EDF5",
            margin: "20px 0 14px", lineHeight: "1.15"
          }}>
            {DELIVERABLE.heroTitle}
          </h2>

          <p style={{
            fontSize: "15px", color: "#8A92AA", lineHeight: "1.75",
            marginBottom: "36px", maxWidth: "620px"
          }}>
            {DELIVERABLE.intro}
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "12px",
            marginBottom: "40px"
          }}>
            {DELIVERABLE.pillars.map((p, i) => (
              <div key={i} style={{
                background: "#0E1525",
                border: "1px solid #1C2340",
                borderLeft: `3px solid ${p.color}`,
                borderRadius: "10px",
                padding: "18px 18px"
              }}>
                <p style={{ fontSize: "14px", fontWeight: "700", color: "#E8EDF5", marginBottom: "8px" }}>
                  {p.title}
                </p>
                <p style={{ fontSize: "13px", color: "#6B7A9E", lineHeight: "1.6" }}>
                  {p.text}
                </p>
              </div>
            ))}
          </div>

          {/* Stack mini */}
          <div style={{ marginBottom: "36px" }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px", color: "#3A4565", letterSpacing: "0.12em",
              marginBottom: "12px"
            }}>
              // ALGUNAS TECNOLOGÍAS QUE USARÁS
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {TECH_STACK.flatMap(g => g.items).map((item, i) => (
                <span key={i} style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px", color: "#6B7A9E",
                  background: "#0E1525", border: "1px solid #1C2340",
                  padding: "5px 11px", borderRadius: "6px"
                }}>
                  {item.name}
                </span>
              ))}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px", color: "#3A4565", padding: "5px 11px", fontStyle: "italic"
              }}>
                + las que el especialista considere
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => startSession(DELIVERABLE)}
              style={{
                background: "#E85D75", color: "#0A0F1E", border: "none",
                padding: "13px 26px", borderRadius: "8px",
                fontSize: "14px", fontWeight: "700", cursor: "pointer"
              }}
            >
              {completed["deliverable"] ? "Volver a la auditoría →" : "Auditar mi proyecto con el experto →"}
            </button>
            {completed["deliverable"] && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px", color: "#2DD4A0",
                display: "flex", alignItems: "center", gap: "6px"
              }}>
                ✓ proyecto auditado y aprobado
              </span>
            )}
          </div>
          <p style={{
            fontSize: "12px", color: "#6B5560", marginTop: "14px", lineHeight: "1.5"
          }}>
            El auditor certifica tu proyecto cuando pase la revisión capa por capa. No es un clic: es su veredicto.
          </p>
          {!completed["deliverable"] && (
            <button
              onClick={() => manualOverride(DELIVERABLE)}
              style={{
                background: "none", border: "none",
                color: "#3A4565", cursor: "pointer",
                fontSize: "11px", fontFamily: "'JetBrains Mono', monospace",
                marginTop: "12px", padding: "4px 0",
                textDecoration: "underline", textUnderlineOffset: "3px"
              }}
            >
              override del especialista · aprobar manualmente
            </button>
          )}

          <SpecialistNotes
            value={notes["deliverable"]}
            onSave={(t) => setNote("deliverable", t)}
            accent="#E85D75"
          />
        </main>
      )}

      {/* STACK VIEW */}
      {view === "stack" && (
        <main style={{ flex: 1, padding: "36px 28px", maxWidth: "780px", margin: "0 auto", width: "100%" }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px", color: "#4F8EF7", letterSpacing: "0.12em"
          }}>
            // STACK DE TECNOLOGÍAS
          </span>
          <h2 style={{
            fontSize: "28px", fontWeight: "700", color: "#E8EDF5",
            margin: "14px 0 12px", lineHeight: "1.2"
          }}>
            Las herramientas que dominarás
          </h2>
          <p style={{ fontSize: "14px", color: "#6B7A9E", lineHeight: "1.7", marginBottom: "36px", maxWidth: "600px" }}>
            Un stack profesional completo: desde editores y agentes hasta modelos locales, bases vectoriales e infraestructura. El especialista añade las que tu proyecto necesite.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {TECH_STACK.map((group, gi) => (
              <div key={gi}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ width: "4px", height: "16px", borderRadius: "2px", background: group.color }} />
                  <p style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "12px", color: group.color, letterSpacing: "0.05em", fontWeight: "600"
                  }}>
                    {group.category}
                  </p>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "8px"
                }}>
                  {group.items.map((item, ii) => (
                    <div key={ii} style={{
                      background: "#0E1525", border: "1px solid #1C2340",
                      borderRadius: "8px", padding: "12px 14px"
                    }}>
                      <p style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "13px", color: "#E8EDF5", fontWeight: "600", marginBottom: "3px"
                      }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: "11px", color: "#4A5A7A", lineHeight: "1.4" }}>
                        {item.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: "32px", padding: "16px 18px",
            background: "rgba(79,142,247,0.05)", border: "1px solid rgba(79,142,247,0.15)",
            borderRadius: "8px"
          }}>
            <p style={{ fontSize: "13px", color: "#6B7A9E", lineHeight: "1.6" }}>
              <strong style={{ color: "#4F8EF7" }}>+ las que el especialista considere.</strong> El stack se adapta a tu proyecto: no metemos tecnología por moda, sino la que resuelve tu caso real.
            </p>
          </div>
        </main>
      )}

      {/* EXTRA MODULE VIEW */}
      {view === "extra" && (
        <main style={{ flex: 1, padding: "36px 28px", maxWidth: "780px", margin: "0 auto", width: "100%" }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px", color: "#7C6AF5", letterSpacing: "0.12em",
            background: "rgba(124,106,245,0.12)", border: "1px solid rgba(124,106,245,0.25)",
            padding: "3px 10px", borderRadius: "4px"
          }}>
            {EXTRA_MODULE.badge}
          </span>

          <h2 style={{
            fontSize: "28px", fontWeight: "700", color: "#E8EDF5",
            margin: "20px 0 12px", lineHeight: "1.2"
          }}>
            {EXTRA_MODULE.title}
          </h2>

          <p style={{ fontSize: "15px", color: "#8A92AA", lineHeight: "1.7", marginBottom: "20px", maxWidth: "620px" }}>
            {EXTRA_MODULE.subtitle}
          </p>

          <p style={{
            fontSize: "14px", color: "#B8C4D8", lineHeight: "1.7",
            marginBottom: "40px", maxWidth: "620px",
            borderLeft: "3px solid #7C6AF5", paddingLeft: "16px"
          }}>
            {EXTRA_MODULE.pitch}
          </p>

          {/* Objetivos */}
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px", color: "#3A4565", letterSpacing: "0.12em", marginBottom: "14px"
          }}>
            // OBJETIVOS
          </p>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "12px", marginBottom: "40px"
          }}>
            {EXTRA_MODULE.objectives.map((o, i) => (
              <div key={i} style={{
                background: "#0E1525", border: "1px solid #1C2340",
                borderLeft: `3px solid ${o.color}`, borderRadius: "10px", padding: "16px 18px"
              }}>
                <p style={{ fontSize: "14px", fontWeight: "700", color: "#E8EDF5", marginBottom: "7px" }}>
                  {o.title}
                </p>
                <p style={{ fontSize: "13px", color: "#6B7A9E", lineHeight: "1.6" }}>
                  {o.text}
                </p>
              </div>
            ))}
          </div>

          {/* Dirigido a */}
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px", color: "#3A4565", letterSpacing: "0.12em", marginBottom: "14px"
          }}>
            // DIRIGIDO A
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "40px" }}>
            {EXTRA_MODULE.audience.map((a, i) => (
              <div key={i} style={{
                display: "flex", gap: "14px", alignItems: "flex-start",
                background: "#0E1525", border: "1px solid #1C2340",
                borderRadius: "10px", padding: "16px 18px"
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px", color: "#7C6AF5", marginTop: "2px", flexShrink: 0
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#E8EDF5", marginBottom: "4px" }}>
                    {a.title}
                  </p>
                  <p style={{ fontSize: "13px", color: "#6B7A9E", lineHeight: "1.6" }}>
                    {a.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Cómo se aprueba el módulo extra */}
          <div style={{
            background: completed["extra"] ? "rgba(45,212,160,0.06)" : "#0E1525",
            border: `1px solid ${completed["extra"] ? "rgba(45,212,160,0.25)" : "#1C2340"}`,
            borderRadius: "10px",
            padding: "16px 18px",
            marginBottom: "28px",
            display: "flex", gap: "12px", alignItems: "flex-start"
          }}>
            <span style={{ fontSize: "16px", marginTop: "1px" }}>
              {completed["extra"] ? "✓" : "◈"}
            </span>
            <p style={{ fontSize: "13px", color: "#8A92AA", lineHeight: "1.6" }}>
              {completed["extra"]
                ? <><strong style={{ color: "#2DD4A0" }}>Módulo certificado.</strong> El instructor certificó que dominas los fundamentos para escribir con criterio.</>
                : <><strong style={{ color: "#7C6AF5" }}>Cómo se certifica:</strong> el instructor te pedirá escribir, explicar y depurar código real, y certificará tu dominio cuando lo demuestres. Este módulo es libre: certificarlo no condiciona el resto del curso, es tu señal de progreso. Reintentos ilimitados.</>}
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => startSession(EXTRA_MODULE)}
              style={{
                background: "#7C6AF5", color: "#0A0F1E", border: "none",
                padding: "13px 26px", borderRadius: "8px",
                fontSize: "14px", fontWeight: "700", cursor: "pointer"
              }}
            >
              {completed["extra"] ? "Repasar con el instructor →" : "Empezar a programar con IA →"}
            </button>
          </div>
          {!completed["extra"] && (
            <button
              onClick={() => manualOverride(EXTRA_MODULE)}
              style={{
                background: "none", border: "none",
                color: "#3A4565", cursor: "pointer",
                fontSize: "11px", fontFamily: "'JetBrains Mono', monospace",
                marginTop: "16px", padding: "4px 0",
                textDecoration: "underline", textUnderlineOffset: "3px"
              }}
            >
              override del especialista · aprobar manualmente
            </button>
          )}

          <SpecialistNotes
            value={notes["extra"]}
            onSave={(t) => setNote("extra", t)}
            accent="#7C6AF5"
          />
        </main>
      )}

      {/* CERTIFICATE VIEW */}
      {view === "certificate" && (
        <main style={{ flex: 1, padding: "36px 28px", maxWidth: "760px", margin: "0 auto", width: "100%" }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px", color: "#4F8EF7", letterSpacing: "0.12em"
          }}>
            // CERTIFICADO DE FINALIZACIÓN
          </span>

          {/* Vista previa del certificado */}
          <div style={{
            marginTop: "20px",
            background: "linear-gradient(135deg, #0E1525, #0A0F1E)",
            border: "1px solid #1C2340",
            borderRadius: "16px",
            padding: "40px 40px",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "4px",
              background: "linear-gradient(90deg,#4F8EF7,#7C6AF5,#2DD4A0,#FF6B35,#C0392B)"
            }} />
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px", letterSpacing: "0.18em", color: "#4F8EF7",
              textTransform: "uppercase", marginBottom: "20px"
            }}>
              ◈ IA Engineering · Certificado
            </p>
            <h2 style={{ fontSize: "28px", fontWeight: "700", lineHeight: "1.15", marginBottom: "8px" }}>
              De Vibe Coding a<br /><span style={{ color: "#4F8EF7" }}>producción segura.</span>
            </h2>
            <p style={{ fontSize: "14px", color: "#6B7A9E", marginBottom: "28px" }}>
              Acredita la finalización del programa de Ingeniería de IA aplicada, evaluado y aprobado capa por capa.
            </p>

            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px", letterSpacing: "0.12em", color: "#3A4565", marginBottom: "10px"
            }}>
              // SEMANAS APROBADAS
            </p>
            <div>
              {WEEKS.filter(w => completed[`week-${w.id}`]).map(w => (
                <div key={w.id} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "7px 0", borderBottom: "1px solid #161D33"
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "12px", color: "#4F8EF7", width: "28px"
                  }}>{String(w.id).padStart(2, "0")}</span>
                  <span style={{ fontSize: "14px", color: "#B8C4D8", flex: 1 }}>{w.title}</span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px", color: "#3A4565", letterSpacing: "0.08em"
                  }}>{w.layer}</span>
                </div>
              ))}
            </div>

            {(completed["deliverable"] || completed["extra"]) && (
              <>
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px", letterSpacing: "0.12em", color: "#3A4565", margin: "24px 0 10px"
                }}>
                  // MÓDULOS ADICIONALES
                </p>
                {completed["deliverable"] && (
                  <p style={{ fontSize: "14px", color: "#2DD4A0", padding: "5px 0" }}>✓ Entregable final · Proyecto auditado</p>
                )}
                {completed["extra"] && (
                  <p style={{ fontSize: "14px", color: "#2DD4A0", padding: "5px 0" }}>✓ Certificado · Programación en Python y JavaScript con IA</p>
                )}
              </>
            )}

            <div style={{
              marginTop: "32px", display: "flex", justifyContent: "space-between",
              alignItems: "flex-end", flexWrap: "wrap", gap: "16px"
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px", color: "#4A5A7A", lineHeight: "1.8"
              }}>
                ID · {certificateId}<br />
                Fecha · {todayStr}<br />
                Evaluación · certificada por instructor
              </div>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                border: "2px solid #4F8EF7", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: "22px", color: "#4F8EF7"
              }}>◈</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap" }}>
            <button
              onClick={printCertificate}
              style={{
                background: "#4F8EF7", color: "#0A0F1E", border: "none",
                padding: "13px 26px", borderRadius: "8px",
                fontSize: "14px", fontWeight: "700", cursor: "pointer"
              }}
            >
              Descargar como PDF →
            </button>
            <button
              onClick={goHome}
              style={{
                background: "none", color: "#6B7A9E",
                border: "1px solid #1C2340", padding: "13px 20px",
                borderRadius: "8px", fontSize: "14px", cursor: "pointer"
              }}
            >
              Volver
            </button>
          </div>
          <p style={{ fontSize: "12px", color: "#3A4565", marginTop: "14px", lineHeight: "1.5" }}>
            Se abrirá una ventana con el certificado lista para imprimir o guardar como PDF (Cmd/Ctrl + P).
          </p>
        </main>
      )}

      {/* CHAT */}
      {view === "chat" && activeWeek && (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: "800px",
          margin: "0 auto",
          width: "100%",
          padding: "0 20px"
        }}>
          {/* Week badge */}
          <div style={{
            padding: "12px 0",
            borderBottom: "1px solid #1C2340",
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "2px",
                background: activeWeek.color
              }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px", color: "#4A5A7A"
              }}>
                {activeWeek.label.toUpperCase()} · {activeWeek.title.toUpperCase()}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {(() => {
                const id = activeWeek.id ? `week-${activeWeek.id}` : (activeWeek.label === "Entregable" ? "deliverable" : "extra");
                const isDone = completed[id];
                // Todas las sesiones (semanas, entregable y extra) las certifica el instructor.
                return (
                  <span style={{
                    fontSize: "11px", fontFamily: "'JetBrains Mono', monospace",
                    color: isDone ? "#2DD4A0" : "#3A4565",
                    display: "flex", alignItems: "center", gap: "5px"
                  }}>
                    {isDone
                      ? (activeWeek.label === "Extra" ? "✓ certificado" : "✓ aprobado")
                      : "◈ evaluación en curso"}
                  </span>
                );
              })()}
              <button
                onClick={() => {
                  if (window.confirm("¿Empezar esta sesión de nuevo? Se borrará la conversación guardada con el instructor (tu aprobación se mantiene).")) {
                    clearConversation(activeWeek);
                  }
                }}
                disabled={loading}
                style={{
                  background: "none", border: "none",
                  color: "#3A4565", cursor: loading ? "default" : "pointer",
                  fontSize: "11px", fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                reiniciar
              </button>
              <button
                onClick={() => {
                  if (activeWeek.id) openWeekDetail(activeWeek);
                  else if (activeWeek.label === "Entregable") setView("deliverable");
                  else if (activeWeek.label === "Extra") setView("extra");
                  else goHome();
                }}
                style={{
                  background: "none", border: "none",
                  color: "#3A4565", cursor: "pointer",
                  fontSize: "11px", fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                {activeWeek.id ? "ver objetivos" : "ver detalle"}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 0",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            minHeight: "0"
          }}>
            {messages.length === 0 && loading && (
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "6px",
                  background: activeWeek.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: "12px", color: "#0A0F1E", fontWeight: "700"
                }}>
                  ◈
                </div>
                <div style={{
                  background: "#0E1525", border: "1px solid #1C2340",
                  borderRadius: "10px", padding: "14px 16px"
                }}>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: "5px", height: "5px", borderRadius: "50%",
                        background: activeWeek.color,
                        animation: `pulse 1s ${i * 0.2}s infinite`,
                        opacity: 0.6
                      }} />
                    ))}
                    <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              msg.isSystem ? (
                <div key={i} style={{
                  display: "flex", justifyContent: "center", margin: "2px 0"
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px", color: "#4F8EF7",
                    background: "rgba(79,142,247,0.08)",
                    border: "1px solid rgba(79,142,247,0.2)",
                    padding: "5px 12px", borderRadius: "20px"
                  }}>
                    {msg.text}
                  </span>
                </div>
              ) : (
              <div
                key={i}
                className={msg.role === "assistant" ? "msg-assistant" : ""}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row"
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: "28px", height: "28px", borderRadius: "6px",
                  background: msg.role === "assistant" ? activeWeek.color : "#1C2340",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: "11px",
                  color: msg.role === "assistant" ? "#0A0F1E" : "#6B7A9E",
                  fontWeight: "700", fontFamily: "'JetBrains Mono', monospace"
                }}>
                  {msg.role === "assistant" ? "◈" : "→"}
                </div>

                {/* Bubble */}
                <div style={{
                  background: msg.role === "assistant" ? "#0E1525" : "#141B2E",
                  border: `1px solid ${msg.verdict === "APROBADO" ? "rgba(45,212,160,0.4)" : (msg.role === "assistant" ? "#1C2340" : "#252E48")}`,
                  borderRadius: "10px",
                  padding: "14px 16px",
                  maxWidth: "78%",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  color: msg.role === "assistant" ? "#B8C4D8" : "#D0D8EC",
                  whiteSpace: "pre-wrap"
                }}>
                  {msg.text}
                  {msg.verdict && (
                    <div style={{
                      marginTop: "10px", paddingTop: "10px",
                      borderTop: "1px solid #1C2340",
                      display: "flex", alignItems: "center", gap: "7px"
                    }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "10px", letterSpacing: "0.05em",
                        color: msg.verdict === "APROBADO" ? "#2DD4A0" : "#C9A062",
                        background: msg.verdict === "APROBADO" ? "rgba(45,212,160,0.12)" : "rgba(245,166,35,0.1)",
                        border: `1px solid ${msg.verdict === "APROBADO" ? "rgba(45,212,160,0.3)" : "rgba(245,166,35,0.25)"}`,
                        padding: "3px 9px", borderRadius: "4px"
                      }}>
                        {msg.verdict === "APROBADO" ? "✓ EVALUACIÓN: APROBADO" : "◷ EVALUACIÓN: PENDIENTE"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              )
            ))}

            {loading && messages.length > 0 && (
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "6px",
                  background: activeWeek.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: "12px", color: "#0A0F1E", fontWeight: "700"
                }}>◈</div>
                <div style={{
                  background: "#0E1525", border: "1px solid #1C2340",
                  borderRadius: "10px", padding: "14px 16px"
                }}>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: "5px", height: "5px", borderRadius: "50%",
                        background: activeWeek.color,
                        animation: `pulse 1s ${i * 0.2}s infinite`
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Banner de desbloqueo / veredicto */}
          {justUnlocked && (
            <div style={{
              background: "linear-gradient(135deg, rgba(45,212,160,0.12), rgba(79,142,247,0.10))",
              border: "1px solid rgba(45,212,160,0.35)",
              borderRadius: "10px",
              padding: "14px 16px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              animation: "msgIn 0.3s ease"
            }}>
              <span style={{ fontSize: "20px" }}>✓</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", color: "#2DD4A0", fontWeight: "600", marginBottom: "2px" }}>
                  {justUnlocked.type === "week"
                    ? `Aprobado · ${justUnlocked.week.label} desbloqueada`
                    : "¡Curso completado! Entregable final desbloqueado"}
                </p>
                <p style={{ fontSize: "12px", color: "#8A92AA", lineHeight: "1.5" }}>
                  {justUnlocked.type === "week"
                    ? `Ya puedes empezar "${justUnlocked.week.title}".`
                    : "Tu proyecto final ya puede pasar la auditoría del experto."}
                </p>
              </div>
              <button
                onClick={() => {
                  if (justUnlocked.type === "week") openWeekDetail(justUnlocked.week);
                  else setView("deliverable");
                }}
                style={{
                  background: "#2DD4A0", color: "#0A0F1E", border: "none",
                  padding: "8px 14px", borderRadius: "6px",
                  fontSize: "12px", fontWeight: "700", cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                Ir →
              </button>
            </div>
          )}

          {lastVerdict === "PENDIENTE" && !justUnlocked && (
            <div style={{
              background: "rgba(245,166,35,0.08)",
              border: "1px solid rgba(245,166,35,0.3)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span style={{ fontSize: "15px" }}>◷</span>
              <p style={{ fontSize: "12px", color: "#C9A062", lineHeight: "1.5" }}>
                Aún no aprobada. Revisa el feedback del instructor y sigue practicando — tienes reintentos ilimitados.
              </p>
            </div>
          )}

          {/* Acciones de evaluación (redes de seguridad) — en todas las sesiones certificadas */}
          {(() => {
            const id = activeWeek.id
              ? `week-${activeWeek.id}`
              : (activeWeek.label === "Entregable" ? "deliverable" : "extra");
            const isDone = completed[id];
            if (isDone) return null;
            return (
              <div style={{
                display: "flex", gap: "8px", flexWrap: "wrap",
                marginBottom: "10px", alignItems: "center"
              }}>
                <button
                  onClick={requestEvaluation}
                  disabled={loading}
                  style={{
                    background: loading ? "#141B2E" : "rgba(79,142,247,0.1)",
                    border: "1px solid rgba(79,142,247,0.3)",
                    color: loading ? "#3A4565" : "#4F8EF7",
                    padding: "7px 14px", borderRadius: "7px",
                    fontSize: "12px", cursor: loading ? "default" : "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                    display: "flex", alignItems: "center", gap: "6px"
                  }}
                >
                  🎓 Solicitar evaluación
                </button>
                <button
                  onClick={() => manualOverride()}
                  style={{
                    background: "none",
                    border: "1px solid #1C2340",
                    color: "#4A5A7A",
                    padding: "7px 12px", borderRadius: "7px",
                    fontSize: "11px", cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  override del especialista
                </button>
                <span style={{
                  fontSize: "10px", color: "#2A3356",
                  fontFamily: "'JetBrains Mono', monospace", marginLeft: "auto"
                }}>
                  red de seguridad
                </span>
              </div>
            );
          })()}

          {/* Input */}
          <div style={{
            padding: "16px 0 20px",
            borderTop: "1px solid #1C2340"
          }}>
            <div style={{
              display: "flex",
              gap: "10px",
              background: "#0E1525",
              border: "1px solid #1C2340",
              borderRadius: "10px",
              padding: "10px 12px",
              alignItems: "flex-end"
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Escribe tu respuesta o pregunta..."
                rows={1}
                disabled={loading}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  color: "#E8EDF5",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  resize: "none",
                  fontFamily: "'Inter', system-ui",
                  maxHeight: "120px",
                  overflowY: "auto"
                }}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{
                  background: input.trim() && !loading ? activeWeek.color : "#1C2340",
                  border: "none",
                  borderRadius: "6px",
                  width: "32px", height: "32px",
                  cursor: input.trim() && !loading ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "14px",
                  color: input.trim() && !loading ? "#0A0F1E" : "#3A4565",
                  transition: "all 0.15s"
                }}
              >
                →
              </button>
            </div>
            <p style={{
              fontSize: "10px", color: "#2A3356",
              marginTop: "6px", textAlign: "center",
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              Enter para enviar · Shift+Enter para nueva línea
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
