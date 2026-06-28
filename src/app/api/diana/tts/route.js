import { NextResponse } from 'next/server';

const OPENAI_TTS_MODELS = [
  process.env.OPENAI_TTS_MODEL,
  'gpt-4o-mini-tts',
  'tts-1',
].filter(Boolean);
const OPENAI_TTS_VOICE = process.env.OPENAI_TTS_VOICE || 'nova';

function cleanTextForSpeech(text) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*/gi, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/[═*#_`]/g, '')
    .replace(/ALERTA:\s*/gi, 'Atencao: ')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function writeWavHeader(samplesLength, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const header = Buffer.alloc(44);
  // "RIFF"
  header.write('RIFF', 0);
  // file size - 8
  header.writeUInt32LE(36 + samplesLength, 4);
  // "WAVE"
  header.write('WAVE', 8);
  // "fmt "
  header.write('fmt ', 12);
  // chunk size (16)
  header.writeUInt32LE(16, 16);
  // audio format (1 = PCM)
  header.writeUInt16LE(1, 20);
  // num channels
  header.writeUInt16LE(numChannels, 22);
  // sample rate
  header.writeUInt32LE(sampleRate, 24);
  // byte rate = sampleRate * numChannels * bitsPerSample / 8
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  // block align = numChannels * bitsPerSample / 8
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  // bits per sample
  header.writeUInt16LE(bitsPerSample, 34);
  // "data"
  header.write('data', 36);
  // chunk size
  header.writeUInt32LE(samplesLength, 40);
  return header;
}

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const body = await request.json();
    const text = body.text;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Texto e obrigatorio.' },
        { status: 400 }
      );
    }

    const cleanText = cleanTextForSpeech(text);

    if (!cleanText) {
      return NextResponse.json(
        { error: 'Texto esta vazio apos limpeza.' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json({ fallback: true, cleanText });
    }

    const input = cleanText.length > 1200
      ? `${cleanText.slice(0, 1197)}...`
      : cleanText;

    let lastError = '';
    const isOpenRouterKey = apiKey.startsWith('sk-or-');

    // 1. Rota do OpenRouter se a chave for sk-or-*
    if (isOpenRouterKey) {
      try {
        console.log('Using OpenRouter TTS with Gemini 3.1 Flash...');
        // Tenta Gemini 3.1 Flash (ótima voz em português, requer PCM)
        const geminiRes = await fetch('https://openrouter.ai/api/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-3.1-flash-tts-preview',
            input,
            voice: 'aoede',
            response_format: 'pcm',
          }),
        });

        if (geminiRes.ok) {
          const pcmBuffer = Buffer.from(await geminiRes.arrayBuffer());
          const wavHeader = writeWavHeader(pcmBuffer.length, 24000, 1, 16);
          const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

          return new Response(wavBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'audio/wav',
              'Content-Length': wavBuffer.byteLength.toString(),
              'Cache-Control': 'private, max-age=1800',
            },
          });
        }

        const geminiErr = await geminiRes.text();
        console.warn('OpenRouter Gemini TTS failed:', geminiErr, 'Trying Kokoro...');

        // Tenta Kokoro 82M como fallback (retorna MP3 nativo)
        const kokoroRes = await fetch('https://openrouter.ai/api/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'hexgrad/kokoro-82m',
            input,
            voice: 'af_bella',
            response_format: 'mp3',
          }),
        });

        if (kokoroRes.ok) {
          const audioBuffer = await kokoroRes.arrayBuffer();
          return new Response(audioBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioBuffer.byteLength.toString(),
              'Cache-Control': 'private, max-age=1800',
            },
          });
        }

        lastError = `OpenRouter TTS failed. Gemini: ${geminiRes.status}, Kokoro: ${kokoroRes.status}`;
      } catch (err) {
        lastError = `OpenRouter TTS fetch exception: ${err.message}`;
        console.error('OpenRouter TTS error:', err);
      }
    } else {
      // 2. Rota oficial da OpenAI se for chave padrão
      for (const model of OPENAI_TTS_MODELS) {
        const ttsBody = {
          model,
          voice: OPENAI_TTS_VOICE,
          input,
          response_format: 'mp3',
        };

        if (model.includes('gpt-4o')) {
          ttsBody.instructions = 'Fale em portugues brasileiro, com tom profissional, claro e acolhedor.';
        }

        const openAIRes = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(ttsBody),
        });

        if (openAIRes.ok) {
          const audioBuffer = await openAIRes.arrayBuffer();

          return new Response(audioBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioBuffer.byteLength.toString(),
              'Cache-Control': 'private, max-age=1800',
            },
          });
        }

        lastError = `${openAIRes.status}: ${await openAIRes.text()}`;
        console.error(`OpenAI TTS error with ${model}:`, lastError);
      }
    }

    return NextResponse.json({ fallback: true, cleanText: input, reason: lastError });
  } catch (error) {
    console.error('Erro no TTS:', error);
    return NextResponse.json(
      { error: 'Erro interno ao gerar audio.' },
      { status: 500 }
    );
  }
}
