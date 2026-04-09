export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const apiKey =
      process.env.SILICONFLOW_API_KEY ||
      process.env.SILICON_API_KEY ||
      process.env.SILICONFLOW_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: { message: 'Missing SILICONFLOW_API_KEY in server environment' },
      });
    }

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

    const upstream = await fetch(
      'https://api.siliconflow.cn/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model:
            typeof model === 'string' && model.trim()
              ? model.trim()
              : 'deepseek-ai/DeepSeek-V3',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        `Upstream error (${upstream.status})`;
      return res.status(502).json({ error: { message: msg } });
    }

    if (data?.error) {
      return res.status(502).json({ error: { message: data.error.message } });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      return res
        .status(502)
        .json({ error: { message: 'Upstream response missing content' } });
    }

    const sentences = content
      .split('\n')
      .map((s) => s.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean);

    return res.status(200).json({
      words: safeWords,
      type: typeof type === 'string' ? type : undefined,
      sentences,
      raw: content,
    });
  } catch (err) {
    return res.status(500).json({
      error: { message: err instanceof Error ? err.message : 'Server error' },
    });
  }
}

