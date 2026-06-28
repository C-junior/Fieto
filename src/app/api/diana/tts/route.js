import { NextResponse } from 'next/server';

/**
 * POST /api/diana/tts
 * Converte texto da Diana em áudio usando ElevenLabs TTS.
 * Fallback: retorna flag para usar Web Speech API no cliente.
 *
 * Body: { text: string }
 * Returns: audio/mpeg stream OR { fallback: true }
 */

// Vozes para tentar em ordem de preferência:
// 1. Roberta — voz feminina brasileira (community, requer paid)
// 2. Rachel — voz feminina pré-feita (default)
// 3. Bella — voz feminina suave
// 4. Sarah — voz feminina natural
const VOICE_CANDIDATES = [
  'RGymW84CSmfVugnA5tvA', // Roberta (PT-BR)
  '21m00Tcm4TlvDq8ikWAM', // Rachel
  'EXAVITQu4vr4xnSDxMaL', // Bella
  'MF3mGyEYCl7XYWbV9V6O', // Elli
];

const MODEL_ID = 'eleven_multilingual_v2';

export async function POST(request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    const body = await request.json();
    const text = body.text;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Texto é obrigatório.' },
        { status: 400 }
      );
    }

    // Limpar texto — remover emojis e caracteres especiais que prejudicam a fala
    const cleanText = text
      .replace(/[⚠️📊💡✅🔥🍞☀️⏰📦📋💰📈🟢🟡🔴═]/g, '')
      .replace(/\*\*/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (cleanText.length === 0) {
      return NextResponse.json(
        { error: 'Texto está vazio após limpeza.' },
        { status: 400 }
      );
    }

    // Se não houver API key, sinalizar fallback para Web Speech API
    if (!apiKey) {
      return NextResponse.json({ fallback: true, cleanText });
    }

    // Limitar tamanho do texto para evitar custos excessivos (máx ~1000 chars)
    const truncatedText = cleanText.length > 1000
      ? cleanText.slice(0, 997) + '...'
      : cleanText;

    // Tentar cada voz candidata até uma funcionar
    for (const voiceId of VOICE_CANDIDATES) {
      try {
        const elevenlabsRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': apiKey,
            },
            body: JSON.stringify({
              text: truncatedText,
              model_id: MODEL_ID,
              voice_settings: {
                stability: 0.6,
                similarity_boost: 0.78,
                style: 0.35,
                use_speaker_boost: true,
              },
            }),
          }
        );

        if (elevenlabsRes.ok) {
          // Sucesso! Stream audio de volta
          const audioBuffer = await elevenlabsRes.arrayBuffer();
          return new Response(audioBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioBuffer.byteLength.toString(),
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }

        // Se for 402 (payment required) ou 401 (unauthorized), tentar próxima voz
        const status = elevenlabsRes.status;
        if (status === 402 || status === 401 || status === 404) {
          console.warn(`ElevenLabs voice ${voiceId} returned ${status}, trying next...`);
          continue;
        }

        // Outros erros (429 rate limit, etc) — não tentar mais
        const errText = await elevenlabsRes.text();
        console.error('ElevenLabs API error:', status, errText);
        break;
      } catch (fetchErr) {
        console.error(`ElevenLabs fetch error for voice ${voiceId}:`, fetchErr);
        continue;
      }
    }

    // Se nenhuma voz ElevenLabs funcionou, retornar fallback
    console.warn('ElevenLabs não disponível, usando fallback Web Speech API');
    return NextResponse.json({ fallback: true, cleanText: truncatedText });
  } catch (error) {
    console.error('Erro no TTS:', error);
    return NextResponse.json(
      { error: 'Erro interno ao gerar áudio.' },
      { status: 500 }
    );
  }
}
