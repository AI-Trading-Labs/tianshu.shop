// 天枢探索 — AI在线写作 API
// Vercel Serverless Function
// 环境变量: AI_API_KEY (DeepSeek API Key)

export default async function handler(req, res) {
  // 只允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  const { prompt, style, max } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: '请输入写作主题' });
  }

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: '服务器 API Key 未配置' });
  }

  // System prompts for different styles
  const systemPrompts = {
    '通用': '你是一个专业的AI写作助手，请根据用户的要求生成高质量的中文内容。',
    '小说': '你是一个小说创作助手。请根据用户设定创作小说章节，注重情节推进和场景描写，语言生动，使用中文。',
    '文案': '你是一个专业文案写手。请创作营销文案，注重说服力，使用中文。',
    '日志': '你是一位AI创业者的日志撰写助手。请用第一人称记录真实的创业过程、思考和收获。'
  };

  const systemPrompt = systemPrompts[style] || systemPrompts['通用'];

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: max || 2048
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `API 错误: ${data.error?.message || JSON.stringify(data)}` 
      });
    }

    const result = data.choices?.[0]?.message?.content;
    if (!result) {
      return res.status(500).json({ error: 'AI 返回为空' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ result });

  } catch (err) {
    return res.status(500).json({ error: `请求失败: ${err.message}` });
  }
}
