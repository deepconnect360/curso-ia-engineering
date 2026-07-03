// ============================================================================
// PROXY DE DEEPSEEK — Vercel Serverless Function (endpoint alterno de prueba)
// ============================================================================
// Ruta: /api/chat-deepseek
//
// Mismo propósito que api/chat.js pero contra la API de DeepSeek en vez de
// Anthropic. La respuesta se NORMALIZA a la misma forma que devuelve Claude
// ({ content: [{ type: "text", text: "..." }] }) para que el frontend
// (CursoIA.jsx) no necesite ningún cambio para consumir cualquiera de los dos.
//
// CONFIGURACIÓN:
// 1. Crea cuenta en https://platform.deepseek.com (grant inicial gratis)
// 2. Vercel → Settings → Environment Variables, añade:
//      DEEPSEEK_API_KEY = sk-...
//      ALLOWED_ORIGIN    = https://curso-ia.yazatech.com (ya la tienes)
// ============================================================================

export default async function handler(req, res) {
  // CORS — mismo criterio que chat.js
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Falta DEEPSEEK_API_KEY en el servidor." });
    return;
  }

  try {
    const { model, max_tokens, system, messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Payload inválido: faltan mensajes." });
      return;
    }

    const safeMaxTokens = Math.min(max_tokens || 1000, 1500);

    // DeepSeek usa formato OpenAI: el system prompt va como mensaje con
    // role "system" dentro del mismo array, no como parámetro aparte.
    const openaiMessages = [
      ...(system ? [{ role: "system", content: system }] : []),
      ...messages,
    ];

    const upstream = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:
          model === "claude-sonnet-4-6"
            ? "deepseek-chat"
            : model || "deepseek-chat",
        max_tokens: safeMaxTokens,
        messages: openaiMessages,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      res.status(upstream.status).json({
        error: data?.error?.message || "Error en la API de DeepSeek.",
      });
      return;
    }

    // Normaliza la respuesta OpenAI-shape → Anthropic-shape
    const text = data?.choices?.[0]?.message?.content || "";
    res.status(200).json({
      content: [{ type: "text", text }],
    });
  } catch (err) {
    res.status(500).json({ error: "Error interno del proxy DeepSeek." });
  }
}
