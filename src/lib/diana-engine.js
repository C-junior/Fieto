import { GoogleGenerativeAI } from '@google/generative-ai';
import { DIANA_SOUL } from '@/lib/diana-soul';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Monta o system prompt substituindo todos os placeholders.
 * @param {string} operationalContext - Contexto de estoque e produção
 * @param {string} previsaoDemanda - Previsão de demanda formatada
 * @param {string} receitasDisponiveis - Receitas sugeridas para itens próximos do vencimento
 * @returns {string} System prompt completo
 */
function buildSystemPrompt(operationalContext, previsaoDemanda, receitasDisponiveis) {
  return DIANA_SOUL
    .replace('{{CONTEXTO_OPERACIONAL}}', operationalContext || 'Nenhum dado operacional disponível no momento.')
    .replace('{{PREVISAO_DEMANDA}}', previsaoDemanda || 'Nenhuma previsão de demanda disponível no momento.')
    .replace('{{RECEITAS_DISPONIVEIS}}', receitasDisponiveis || 'Nenhuma receita disponível no momento.');
}

/**
 * Monta o histórico de chat no formato esperado pelo Gemini.
 * @param {string} systemPrompt - System prompt completo
 * @param {Array<{role: string, content: string}>} history - Histórico de conversa
 * @returns {Array} Histórico formatado para o Gemini
 */
function buildChatHistory(systemPrompt, history) {
  const chatHistory = history.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  return [
    {
      role: 'user',
      parts: [{ text: systemPrompt }],
    },
    {
      role: 'model',
      parts: [{ text: 'Diana 2.0 online. Monitorando estoque, produção e demanda.' }],
    },
    ...chatHistory,
  ];
}

/**
 * Envia uma mensagem para a Diana (Gemini) com contexto operacional.
 * Retorna a resposta completa (sem streaming).
 * @param {string} message - Mensagem do usuário
 * @param {string} operationalContext - Contexto operacional formatado (estoque, produção)
 * @param {Array<{role: string, content: string}>} history - Histórico de conversa recente
 * @returns {Promise<string>} Resposta da Diana
 */
export async function askDiana(message, operationalContext, history = []) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Substituir placeholder de contexto no system prompt
  const systemPrompt = buildSystemPrompt(operationalContext);

  const chat = model.startChat({
    history: buildChatHistory(systemPrompt, history),
  });

  const result = await chat.sendMessage(message);
  const response = result.response;
  return response.text();
}

/**
 * Envia uma mensagem para a Diana com streaming de resposta.
 * Retorna um async generator que emite chunks de texto conforme chegam.
 * @param {string} message - Mensagem do usuário
 * @param {string} operationalContext - Contexto operacional formatado
 * @param {Array<{role: string, content: string}>} history - Histórico de conversa recente
 * @returns {AsyncGenerator<string>} Chunks de texto da resposta
 */
export async function* askDianaStream(message, operationalContext, history = []) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Montar system prompt com todos os contextos
  const systemPrompt = buildSystemPrompt(operationalContext);

  // Montar conteúdo completo: system prompt + histórico + mensagem atual
  const contents = [
    ...buildChatHistory(systemPrompt, history).map((entry) => ({
      role: entry.role,
      parts: entry.parts,
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  // Usar generateContentStream para resposta em streaming
  const result = await model.generateContentStream({ contents });

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      yield chunkText;
    }
  }
}
