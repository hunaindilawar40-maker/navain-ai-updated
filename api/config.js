/**
 * Navain AI — /api/config
 * Tells the frontend which optional features are live, based on which
 * environment variables are configured in Vercel. No secrets are exposed.
 *
 * GET -> { "chat": boolean }
 * Text only: this site has no text-to-speech or voice-playback endpoint,
 * and no paid SMS/text-back endpoint (removed — no budget for a provider).
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }
  return res.status(200).json({
    chat: Boolean(process.env.GROQ_API_KEY),
  });
}
