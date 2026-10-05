/**
 * Navain AI — /api/speak (optional text-to-speech)
 * Reads a chat reply aloud using Groq's TTS model. Only enabled when an API
 * key is configured (see /api/config).
 *
 * POST { text: string } -> 200 audio/wav
 *                        -> 4xx/5xx { error: string }
 */
const GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const key = process.env.GROQ_API_KEY || process.env.TTS_API_KEY;
  if (!key) {
    return res.status(503).json({ error: "Text-to-speech is not configured." });
  }

  const body = typeof req.body === "object" && req.body ? req.body : {};
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 1000) : "";

  if (!text) {
    return res.status(400).json({ error: "text must be a non-empty string." });
  }

  try {
    const upstream = await fetch(GROQ_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "playai-tts",
        voice: process.env.TTS_VOICE || "Aaliyah-PlayAI",
        input: text,
        response_format: "wav",
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error(`Groq TTS error ${upstream.status}: ${detail.slice(0, 500)}`);
      return res.status(502).json({ error: "The TTS provider returned an error." });
    }

    const audio = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Length", audio.length);
    return res.status(200).send(audio);
  } catch (err) {
    console.error("speak handler error:", err.message);
    return res.status(500).json({ error: "Failed to synthesize speech." });
  }
}
