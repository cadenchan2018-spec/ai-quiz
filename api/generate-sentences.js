export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const { words, type, model } = req.body ?? {};
    const safeWords = Array.isArray(words)
      ? words
          .map((w) => (typeof w === 'string' ? w.trim() : ''))
          .filter(Boolean)
          .slice(0, 50)
      : [];

    if (safeWords.length === 0) {
      return res
        .status(400)
        .json({ error: { message: 'No words provided' } });
    }

    const prompt = `你是一位專業的香港小學中文老師。
請為以下詞語分別創作一個適合小五學生的填充題句子：${safeWords.join(', ')}。

規則：
1. 句子情境要豐富，長度約 30 字，符合香港小學程度。
2. 答案位置請統一用「 ( ________ ) 」表示。
3. 句子中絕對不能出現該詞語本身。
4. 不要輸出題號、不要任何開場白，直接每行輸出一個句子。`;

    const openRouterKey =
      process.env.OPENROUTER_API_KEY ||
      process.env.OPENROUTER_KEY;

    async function callOpenRouter() {
      if (!openRouterKey) {
        throw new Error('Missing OPENROUTER_API_KEY in server environment');
      }

      const siteUrl = process.env.OPENROUTER_SITE_URL;
      const appName = process.env.OPENROUTER_APP_NAME;

      const headers = {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      };
      if (siteUrl) headers['HTTP-Referer'] = siteUrl;
      if (appName) headers['X-Title'] = appName;

      // OpenRouter is OpenAI-compatible.
      const upstream = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            // You can change this later. This is a solid default on OpenRouter.
            model:
              typeof model === 'string' && model.trim()
                ? model.trim()
                : 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
          }),
        }
      );

      const data = await upstream.json().catch(() => null);

      const msg =
        data?.error?.message ||
        data?.message ||
        `Upstream error (${upstream.status})`;

      if (!upstream.ok) {
        throw new Error(msg);
      }
      if (data?.error) {
        throw new Error(data.error.message);
      }

      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new Error('Upstream response missing content');
      }
      return { provider: 'openrouter', raw: content };
    }

    const result = await callOpenRouter();

    const sentences = result.raw
      .split('\n')
      .map((s) => s.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean);

    return res.status(200).json({
      provider: result.provider,
      words: safeWords,
      type: typeof type === 'string' ? type : undefined,
      sentences,
      raw: result.raw,
    });
  } catch (err) {
    return res.status(500).json({
      error: { message: err instanceof Error ? err.message : 'Server error' },
    });
  }
}

