import { DIANA_SOUL } from '@/lib/diana-soul';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4.1-mini';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const FREE_MODELS = [
  'google/gemma-4-27b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'qwen/qwen3-coder:free',
  'openrouter/free',
];

function buildSystemPrompt(operationalContext) {
  return DIANA_SOUL.replace(
    '{{CONTEXTO_OPERACIONAL}}',
    operationalContext || 'Nenhum dado operacional disponivel no momento.'
  );
}

function buildMessages(systemPrompt, message, history) {
  return [
    { role: 'developer', content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];
}

async function callOpenAI(systemPrompt, message, history) {
  const isOpenRouter = OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-or-');
  const url = isOpenRouter 
    ? 'https://openrouter.ai/api/v1/chat/completions' 
    : 'https://api.openai.com/v1/chat/completions';
  
  const model = isOpenRouter && !OPENAI_CHAT_MODEL.includes('/')
    ? `openai/${OPENAI_CHAT_MODEL}`
    : OPENAI_CHAT_MODEL;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
  };

  if (isOpenRouter) {
    headers['HTTP-Referer'] = 'https://integra-panificacao.vercel.app';
    headers['X-Title'] = 'Integra - Diana AI';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: buildMessages(systemPrompt, message, history),
      max_tokens: 1024,
      temperature: 0.55,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI/OpenRouter ${model} error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Diana nao conseguiu gerar uma resposta.';
}

async function* callOpenAIStream(systemPrompt, message, history) {
  const isOpenRouter = OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-or-');
  const url = isOpenRouter 
    ? 'https://openrouter.ai/api/v1/chat/completions' 
    : 'https://api.openai.com/v1/chat/completions';
  
  const model = isOpenRouter && !OPENAI_CHAT_MODEL.includes('/')
    ? `openai/${OPENAI_CHAT_MODEL}`
    : OPENAI_CHAT_MODEL;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
  };

  if (isOpenRouter) {
    headers['HTTP-Referer'] = 'https://integra-panificacao.vercel.app';
    headers['X-Title'] = 'Integra - Diana AI';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: buildMessages(systemPrompt, message, history),
      max_tokens: 1024,
      temperature: 0.55,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI/OpenRouter ${model} stream error ${res.status}: ${errText}`);
  }

  yield* readOpenAICompatibleStream(res);
}

async function callOpenRouter(systemPrompt, message, history, model) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://integra-panificacao.vercel.app',
      'X-Title': 'Integra - Diana AI',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter ${model} error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Diana nao conseguiu gerar uma resposta.';
}

async function* callOpenRouterStream(systemPrompt, message, history, model) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://integra-panificacao.vercel.app',
      'X-Title': 'Integra - Diana AI',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter ${model} stream error ${res.status}: ${errText}`);
  }

  yield* readOpenAICompatibleStream(res);
}

async function* readOpenAICompatibleStream(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const jsonStr = trimmed.slice(6);
      if (jsonStr === '[DONE]') return;

      try {
        const parsed = JSON.parse(jsonStr);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // skip malformed chunks
      }
    }
  }
}

function cleanResponseText(text) {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*/gi, '')
    .trim();
}

async function* cleanStream(generator) {
  let inThink = false;
  let buffer = '';

  for await (const chunk of generator) {
    buffer += chunk;

    while (buffer.length > 0) {
      if (inThink) {
        const endIdx = buffer.indexOf('</think>');
        if (endIdx !== -1) {
          inThink = false;
          buffer = buffer.slice(endIdx + 8);
        } else {
          const lastLessThan = buffer.lastIndexOf('<');
          buffer = lastLessThan !== -1 && '</think>'.startsWith(buffer.slice(lastLessThan))
            ? buffer.slice(lastLessThan)
            : '';
          break;
        }
      } else {
        const startIdx = buffer.indexOf('<think>');
        if (startIdx !== -1) {
          if (startIdx > 0) yield buffer.slice(0, startIdx);
          inThink = true;
          buffer = buffer.slice(startIdx + 7);
        } else {
          const lastLessThan = buffer.lastIndexOf('<');
          if (lastLessThan !== -1 && '<think>'.startsWith(buffer.slice(lastLessThan))) {
            if (lastLessThan > 0) yield buffer.slice(0, lastLessThan);
            buffer = buffer.slice(lastLessThan);
            break;
          }

          yield buffer;
          buffer = '';
        }
      }
    }
  }
}

async function callWithFallback(systemPrompt, message, history) {
  if (OPENAI_API_KEY) {
    try {
      const response = await callOpenAI(systemPrompt, message, history);
      if (response) return cleanResponseText(response);
    } catch (err) {
      console.warn('OpenAI failed, trying legacy providers:', err.message);
    }
  }

  if (OPENROUTER_API_KEY) {
    for (const model of FREE_MODELS) {
      try {
        const response = await callOpenRouter(systemPrompt, message, history, model);
        if (response) return cleanResponseText(response);
      } catch (err) {
        console.warn(`OpenRouter model ${model} failed:`, err.message);
      }
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const chatHistory = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Diana 2.0 online. Monitorando estoque, producao e demanda.' }] },
        ...history.map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      ];

      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessage(message);
      return cleanResponseText(result.response.text());
    } catch (err) {
      console.error('Gemini fallback error:', err);
    }
  }

  return 'Diana temporariamente indisponivel. Verifique a configuracao da IA e tente novamente.';
}

export async function askDiana(message, operationalContext, history = []) {
  const systemPrompt = buildSystemPrompt(operationalContext);
  return callWithFallback(systemPrompt, message, history);
}

export async function* askDianaStream(message, operationalContext, history = []) {
  const systemPrompt = buildSystemPrompt(operationalContext);

  if (OPENAI_API_KEY) {
    try {
      let hasYielded = false;
      for await (const chunk of cleanStream(callOpenAIStream(systemPrompt, message, history))) {
        hasYielded = true;
        yield chunk;
      }
      if (hasYielded) return;
    } catch (err) {
      console.warn('OpenAI stream failed, trying legacy providers:', err.message);
    }
  }

  if (OPENROUTER_API_KEY) {
    for (const model of FREE_MODELS) {
      try {
        let hasYielded = false;
        for await (const chunk of cleanStream(callOpenRouterStream(systemPrompt, message, history, model))) {
          hasYielded = true;
          yield chunk;
        }
        if (hasYielded) return;
      } catch (err) {
        console.warn(`OpenRouter stream ${model} failed:`, err.message);
      }
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const chatHistory = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Diana 2.0 online.' }] },
        ...history.map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      ];

      const result = await model.generateContentStream({
        contents: [...chatHistory, { role: 'user', parts: [{ text: message }] }],
      });

      const localGenerator = async function* () {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) yield chunkText;
        }
      };

      for await (const chunk of cleanStream(localGenerator())) {
        yield chunk;
      }
      return;
    } catch (err) {
      console.error('Gemini stream fallback error:', err);
    }
  }

  yield 'Diana temporariamente indisponivel. Verifique a configuracao da IA e tente novamente.';
}
