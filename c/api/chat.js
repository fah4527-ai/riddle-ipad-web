const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    json(res, 500, { error: "Missing DEEPSEEK_API_KEY on the server." });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    json(res, 400, { error: "Invalid JSON body." });
    return;
  }

  const message = String(body.message || "").trim();
  if (!message) {
    json(res, 400, { error: "Write something first." });
    return;
  }

  if (message.length > 3000) {
    json(res, 400, { error: "Message is too long." });
    return;
  }

  const systemPrompt =
    process.env.SYSTEM_PROMPT ||
    "You are the spirit inside an enchanted diary. Reply briefly, mysteriously, and helpfully.";

  try {
    const upstream = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.8,
        max_tokens: 700
      })
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      json(res, upstream.status, {
        error: data?.error?.message || "DeepSeek request failed."
      });
      return;
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    json(res, 200, { reply: reply || "The page remains silent." });
  } catch (error) {
    json(res, 500, {
      error: error instanceof Error ? error.message : "Server error."
    });
  }
}
