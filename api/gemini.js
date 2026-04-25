export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'Missing API key' });

  // 列出所有可用模型
  if (req.method === 'GET') {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await r.json();
    return res.status(r.status).json(data);
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 依序嘗試不同模型
  const models = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-pro-vision',
  ];

  for (const model of models) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body)
        }
      );
      const data = await geminiRes.json();
      if (geminiRes.status !== 404) {
        data._modelUsed = model;
        return res.status(geminiRes.status).json(data);
      }
    } catch(e) {}
  }

  return res.status(404).json({ error: '找不到任何可用的 Gemini 模型，請確認 API Key 是否正確。' });
}
