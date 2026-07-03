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

  // Preflight CORS: el navegador manda OPTIONS antes del POST real en
  // peticiones cross-origin con Content-Type: application/json.
  // Debe resolverse ANTES del chequeo "solo POST" o el preflight
  // recibiría 405 y el navegador bloquearía la petición real (CORS error).
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
  if (!apiKey) {
    res.status(500).json({ error: "Falta ANTHROPIC_API_KEY en el servidor." });
    return;
  }

  try {
    const { model, max_tokens, system, messages } = req.body || {};

    // Validación básica del payload.
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Payload inválido: faltan mensajes." });
      return;
    }

    // Salvaguarda de coste: limita el tamaño de la respuesta aunque el cliente
    // pida más. Ajusta el tope según tu presupuesto.
    const safeMaxTokens = Math.min(max_tokens || 1000, 1500);

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-6",
        max_tokens: safeMaxTokens,
        system: system || "",
        messages
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      // Reenvía el error de Anthropic sin filtrar la key.
      res.status(upstream.status).json({
        error: data?.error?.message || "Error en la API de Claude."
      });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Error interno del proxy." });
  }
}
