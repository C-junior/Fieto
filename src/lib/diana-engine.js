import { DIANA_SOUL } from '@/lib/diana-soul';

/**
 * Diana Engine 2.0 — Motor de IA com OpenRouter (primário) + Gemini (fallback).
 *
 * Usa a API OpenRouter (compatível com OpenAI) para acessar modelos gratuitos.
 * Se OpenRouter falhar, tenta Gemini como fallback.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Modelos gratuitos do OpenRouter, em ordem de preferência
const FREE_MODELS = [
  'google/gemma-4-27b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'qwen/qwen3-coder:free',
  'openrouter/free',
];

/**
 * Monta o system prompt substituindo o placeholder do contexto operacional.
 */
function buildSystemPrompt(operationalContext) {
  return DIANA_SOUL
    .replace('{{CONTEXTO_OPERACIONAL}}', operationalContext || 'Nenhum dado operacional disponível no momento.');
}

/**
 * Chama a API OpenRouter (OpenAI-compatible).
 * @param {string} systemPrompt - System prompt
 * @param {string} message - Mensagem do usuário
 * @param {Array} history - Histórico de conversa
 * @param {string} model - Model ID
 * @returns {Promise<string>} Resposta completa
 */
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
  return data.choices?.[0]?.message?.content || 'Diana não conseguiu gerar uma resposta.';
}

/**
 * Chama a API OpenRouter com streaming SSE.
 * @param {string} systemPrompt - System prompt
 * @param {string} message - Mensagem do usuário
 * @param {Array} history - Histórico de conversa
 * @param {string} model - Model ID
 * @returns {AsyncGenerator<string>} Chunks de texto
 */
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

/**
 * Remove blocos de pensamento <think>...</think> do texto.
 */
function cleanResponseText(text) {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '') // Remove tags <think> completas
    .replace(/<think>[\s\S]*/gi, '')           // Remove tag aberta caso venha incompleta
    .trim();
}

/**
 * Filtra chunks de streaming para não emitir nada que esteja dentro de <think>...</think>
 */
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
          // Ainda está pensando, descarta o buffer atual mas mantém se puder ter parte da tag de fechamento
          const lastLessThan = buffer.lastIndexOf('<');
          if (lastLessThan !== -1 && '</think>'.startsWith(buffer.slice(lastLessThan))) {
            buffer = buffer.slice(lastLessThan); // Mantém possível início da tag de fechamento
          } else {
            buffer = '';
          }
          break;
        }
      } else {
        const startIdx = buffer.indexOf('<think>');
        if (startIdx !== -1) {
          // Emite o que veio antes do <think>
          if (startIdx > 0) {
            yield buffer.slice(0, startIdx);
          }
          inThink = true;
          buffer = buffer.slice(startIdx + 7);
        } else {
          // Verifica se o final do buffer tem um início parcial de "<think>"
          const lastLessThan = buffer.lastIndexOf('<');
          if (lastLessThan !== -1 && '<think>'.startsWith(buffer.slice(lastLessThan))) {
            if (lastLessThan > 0) {
              yield buffer.slice(0, lastLessThan);
            }
            buffer = buffer.slice(lastLessThan);
            break;
          } else {
            yield buffer;
            buffer = '';
          }
        }
      }
    }
  }
}

/**
 * Tenta chamar OpenRouter com modelos gratuitos em sequência.
 * Se todos falharem, tenta Gemini como fallback.
 */
async function callWithFallback(systemPrompt, message, history) {
  // Tentar OpenRouter primeiro
  if (OPENROUTER_API_KEY) {
    for (const model of FREE_MODELS) {
      try {
        const response = await callOpenRouter(systemPrompt, message, history, model);
        if (response) return cleanResponseText(response);
      } catch (err) {
        console.warn(`OpenRouter model ${model} failed:`, err.message);
        continue;
      }
    }
  }

  // Fallback para Gemini
  if (GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const chatHistory = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Diana 2.0 online. Monitorando estoque, produção e demanda.' }] },
        ...history.map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      ];

      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessage(message);
      return cleanResponseText(result.response.text());
    } catch (err) {
      if (err.status === 429 || err.message?.includes('429') || err.message?.includes('quota')) {
        console.warn('Gemini fallback also rate limited:', err.message);
      } else {
        console.error('Gemini fallback error:', err);
      }
    }
  }

  return '⚠️ Diana temporariamente indisponível — nenhum provedor de IA disponível no momento. Tente novamente em alguns minutos.';
}

/**
 * Envia uma mensagem para a Diana com contexto operacional.
 * Retorna a resposta completa (sem streaming).
 */
export async function askDiana(message, operationalContext, history = []) {
  const systemPrompt = buildSystemPrompt(operationalContext);
  return callWithFallback(systemPrompt, message, history);
}

/**
 * Envia uma mensagem para a Diana com streaming.
 * Retorna um async generator que emite chunks de texto.
 */
export async function* askDianaStream(message, operationalContext, history = []) {
  const systemPrompt = buildSystemPrompt(operationalContext);

  // Tentar OpenRouter streaming primeiro
  if (OPENROUTER_API_KEY) {
    for (const model of FREE_MODELS) {
      try {
        let hasYielded = false;
        const generator = callOpenRouterStream(systemPrompt, message, history, model);
        for await (const chunk of cleanStream(generator)) {
          hasYielded = true;
          yield chunk;
        }
        if (hasYielded) return;
      } catch (err) {
        console.warn(`OpenRouter stream ${model} failed:`, err.message);
        continue;
      }
    }
  }

  // Fallback para Gemini streaming
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

      const contents = [
        ...chatHistory,
        { role: 'user', parts: [{ text: message }] },
      ];

      const result = await model.generateContentStream({ contents });
      
      // Criar um gerador local para passar pelo cleanStream
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
      if (err.status === 429 || err.message?.includes('429')) {
        console.warn('Gemini stream fallback rate limited');
      } else {
        console.error('Gemini stream fallback error:', err);
      }
    }
  }

  yield '⚠️ Diana temporariamente indisponível — nenhum provedor de IA disponível no momento. Tente novamente em alguns minutos.';
}
