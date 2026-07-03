// ============================================================================
// PROXY DE LA API DE CLAUDE — Vercel Serverless Function
// ============================================================================
// Ruta: /api/chat  (Vercel mapea automáticamente el archivo api/chat.js)
//
// Por qué existe: el frontend NUNCA debe contener tu API key. Este proxy vive
// en el servidor de Vercel, recibe la petición del curso, le añade la key
// desde una variable de entorno y reenvía a Anthropic. Así la key nunca llega
// al navegador del alumno.
//
// CONFIGURACIÓN (una sola vez):
// 1. En el panel de Vercel → Settings → Environment Variables, añade:
//      ANTHROPIC_API_KEY = sk-ant-...   (tu key real)
// 2. Opcional: ALLOWED_ORIGIN = https://tudominio.com  (para restringir quién
//    puede llamar a este proxy; si lo dejas vacío, acepta cualquier origen).
// ============================================================================

export default async function handler(req, res) {
  // CORS: permite que tu WordPress llame al proxy.
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight CORS: debe resolverse ANTES del chequeo "solo POST"
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Solo aceptamos POST para la petición real.
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  // ... el resto del archivo sigue igual
