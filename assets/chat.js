/**
 * Navain AI — /api/chat
 * Proxies chat requests to Groq. The GROQ_API_KEY lives only in Vercel's
 * environment variables and is never sent to the browser.
 *
 * POST { system?: string, messages: [{role, content}], max_tokens?: number }
 *   -> 200 { text: string }
 *   -> 4xx/5xx { error: string }
 */
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const ROLES = new Set(["system", "user", "assistant"]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return res.status(503).json({
      error:
        "Chat is not configured. Add GROQ_API_KEY in Vercel → Project → Settings → " +
        "Environment Variables, then redeploy.",
    });
  }

  const body = typeof req.body === "object" && req.body ? req.body : {};
  const system = typeof body.system === "string" ? body.system.slice(0, 8000) : undefined;

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: "messages must be a non-empty array of { role, content }." });
  }

  // Sanitize: known roles only, string content, capped lengths, last 30 turns.
  const messages = body.messages
    .filter((m) => m && ROLES.has(m.role) && typeof m.content === "string")
    .slice(-30)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (messages.length === 0) {
    return res.status(400).json({ error: "No valid messages provided." });
  }

  const maxTokens = Math.min(Math.max(Number(body.max_tokens) || 1000, 1), 4000);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: system ? [{ role: "system", content: system }, ...messages] : messages,
        max_tokens: maxTokens,
        temperature: 0.6,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error(`Groq error ${upstream.status}: ${detail.slice(0, 500)}`);
      return res.status(502).json({ error: "The AI provider returned an error. Please try again." });
    }

    const data = await upstream.json();
    const text =
      data && data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : "";

    if (!text) {
      return res.status(502).json({ error: "Empty response from the AI provider." });
    }
    return res.status(200).json({ text });
  } catch (err) {
    console.error("chat handler error:", err.message);
    return res.status(500).json({ error: "Failed to reach the AI provider. Please try again." });
  }
}
