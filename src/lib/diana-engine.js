import { GoogleGenerativeAI } from '@google/generative-ai';
import { DIANA_SOUL } from '@/lib/diana-soul';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Envia uma mensagem para a Diana (Gemini) com contexto operacional.
 * @param {string} message - Mensagem do usuário
 * @param {string} operationalContext - Contexto operacional formatado (estoque, produção)
 * @param {Array<{role: string, content: string}>} history - Histórico de conversa recente
 * @returns {Promise<string>} Resposta da Diana
 */
export async function askDiana(message, operationalContext, history = []) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Substituir placeholder de contexto no system prompt
  const systemPrompt = DIANA_SOUL.replace(
    '{{CONTEXTO_OPERACIONAL}}',
    operationalContext || 'Nenhum dado operacional disponível no momento.'
  );

  const chatHistory = history.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'Diana online. Monitorando estoque e produção.' }],
      },
      ...chatHistory,
    ],
  });

  const result = await chat.sendMessage(message);
  const response = result.response;
  return response.text();
}
