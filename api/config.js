/**
 * Navain AI — /api/config
 * Tells the frontend which optional features are live, based on which
 * environment variables are configured in Vercel. No secrets are exposed.
 *
 * GET -> { "chat": boolean, "tts": boolean }
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }
  return res.status(200).json({
    chat: Boolean(process.env.GROQ_API_KEY),
    tts: Boolean(process.env.GROQ_API_KEY || process.env.TTS_API_KEY),
  });
}
