import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { askDiana, askDianaStream } from '@/lib/diana-engine';
import { predictDemand } from '@/lib/demand-predictor';
import { findRecipesForItem } from '@/lib/recipes-db';

const DEFAULT_EMPRESA_ID = 'demo-padaria-001';

/**
 * Formata os dados de previsão de demanda para injeção no contexto.
 * @param {Array} previsoes - Resultado do predictDemand
 * @returns {string} Texto formatado
 */
function formatarPrevisaoDemanda(previsoes) {
  if (!previsoes || previsoes.length === 0) return '';

  // Agrupar por produto
  const porProduto = {};
  for (const p of previsoes) {
    if (!porProduto[p.produto_nome]) porProduto[p.produto_nome] = [];
    porProduto[p.produto_nome].push(p);
  }

  const linhas = [];
  for (const [produto, prev] of Object.entries(porProduto)) {
    const detalhe = prev
      .slice(0, 3) // Mostrar próximos 3 dias
      .map((p) => `${p.dia_semana} ${p.data}: ${p.qtd_prevista} un (confiança ${Math.round(p.confianca * 100)}%)`)
      .join(', ');
    linhas.push(`- ${produto}: ${detalhe}`);
  }

  return linhas.join('\n');
}

/**
 * Formata as receitas sugeridas para injeção no contexto.
 * @param {Array} itensComReceitas - Array de {item, receitas}
 * @returns {string} Texto formatado
 */
function formatarReceitasSugeridas(itensComReceitas) {
  if (!itensComReceitas || itensComReceitas.length === 0) return '';

  const linhas = [];
  for (const { item, diasRestantes, receitas } of itensComReceitas) {
    const receitasTexto = receitas
      .slice(0, 2)
      .map((r) => `${r.nome} (${r.tempo_preparo})`)
      .join(', ');
    linhas.push(`- ${item} (vence em ${diasRestantes}d): ${receitasTexto}`);
  }

  return linhas.join('\n');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body.message;
    const empresaId = body.empresa_id || DEFAULT_EMPRESA_ID;
    const useStream = body.stream === true;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória e deve ser um texto válido.' },
        { status: 400 }
      );
    }

    // 1. Buscar contexto operacional em paralelo
    const [estoqueResult, producaoResult, historicoResult] = await Promise.all([
      // Estoque atual — foco em itens com validade próxima
      supabase
        .from('insumos_estoque')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data_validade', { ascending: true })
        .limit(50),

      // Produção recente — últimos 14 dias
      supabase
        .from('historico_producao_vendas')
        .select('*')
        .eq('empresa_id', empresaId)
        .gte('data', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('data', { ascending: false })
        .limit(100),

      // Histórico de conversa — últimas 20 mensagens
      supabase
        .from('diana_conversas')
        .select('papel, conteudo, criado_em')
        .eq('empresa_id', empresaId)
        .order('criado_em', { ascending: false })
        .limit(20),
    ]);

    // 2. Formatar contexto operacional
    const estoque = estoqueResult.data || [];
    const producao = producaoResult.data || [];
    const historicoMsgs = (historicoResult.data || []).reverse();

    let contextUsed = false;
    let operationalContext = '';

    if (estoque.length > 0) {
      contextUsed = true;
      const hoje = new Date();

      const estoqueFormatado = estoque.map((item) => {
        const validade = new Date(item.data_validade);
        const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
        const status =
          diasRestantes <= 0
            ? '🔴 VENCIDO'
            : diasRestantes <= 3
              ? '🔴 CRÍTICO'
              : diasRestantes <= 7
                ? '🟡 ATENÇÃO'
                : '🟢 OK';
        return `- ${item.nome}: ${item.quantidade_atual} ${item.unidade || 'un'} | Validade: ${item.data_validade} (${diasRestantes}d) ${status}`;
      });

      operationalContext += `ESTOQUE ATUAL (${estoque.length} itens):\n${estoqueFormatado.join('\n')}\n\n`;
    }

    if (producao.length > 0) {
      contextUsed = true;

      const producaoFormatada = producao.slice(0, 20).map((reg) => {
        const perda = reg.qtd_produzida > 0
          ? Math.round((reg.qtd_perda / reg.qtd_produzida) * 100)
          : 0;
        return `- ${reg.data} | ${reg.produto_nome}: produzido=${reg.qtd_produzida}, vendido=${reg.qtd_vendida}, perda=${reg.qtd_perda} (${perda}%)`;
      });

      operationalContext += `PRODUÇÃO RECENTE (últimos 14 dias):\n${producaoFormatada.join('\n')}\n\n`;
    }

    // 3. Enriquecer contexto com previsão de demanda
    const previsoes = predictDemand(producao);
    const previsaoDemandaTexto = formatarPrevisaoDemanda(previsoes);
    if (previsaoDemandaTexto) {
      contextUsed = true;
      operationalContext += `PREVISÃO DE DEMANDA:\n${previsaoDemandaTexto}\n\n`;
    }

    // 4. Enriquecer contexto com receitas para itens próximos do vencimento (≤5 dias)
    const hoje = new Date();
    const itensComReceitas = [];
    for (const item of estoque) {
      const validade = new Date(item.data_validade);
      const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
      if (diasRestantes > 0 && diasRestantes <= 5) {
        const receitas = findRecipesForItem(item.nome);
        if (receitas.length > 0) {
          itensComReceitas.push({ item: item.nome, diasRestantes, receitas });
        }
      }
    }
    const receitasTexto = formatarReceitasSugeridas(itensComReceitas);
    if (receitasTexto) {
      operationalContext += `RECEITAS DISPONÍVEIS:\n${receitasTexto}\n`;
    }

    // 5. Formatar histórico para o engine
    const history = historicoMsgs.map((msg) => ({
      role: msg.papel,
      content: msg.conteudo,
    }));

    // 6. Resposta com streaming SSE ou JSON tradicional
    if (useStream) {
      return handleStreamResponse(message.trim(), operationalContext, history, empresaId);
    }

    // Resposta tradicional (sem streaming)
    const dianaResponse = await askDiana(message.trim(), operationalContext, history);

    // Salvar conversa no histórico
    await salvarConversa(empresaId, message.trim(), dianaResponse);

    return NextResponse.json({
      response: dianaResponse,
      context_used: contextUsed,
    });
  } catch (error) {
    console.error('Erro no chat da Diana:', error);

    if (error.message?.includes('API key') || error.message?.includes('API_KEY')) {
      return NextResponse.json(
        { error: 'Erro de configuracao da IA. Verifique a chave da API OpenAI.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno ao processar sua mensagem. Tente novamente.' },
      { status: 500 }
    );
  }
}

/**
 * Processa resposta em streaming via SSE.
 * @param {string} message - Mensagem do usuário
 * @param {string} operationalContext - Contexto operacional completo
 * @param {Array} history - Histórico de conversa
 * @param {string} empresaId - ID da empresa
 * @returns {Response} Resposta SSE
 */
function handleStreamResponse(message, operationalContext, history, empresaId) {
  const encoder = new TextEncoder();
  let respostaCompleta = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generator = askDianaStream(message, operationalContext, history);

        for await (const chunkText of generator) {
          respostaCompleta += chunkText;

          const evento = `data: ${JSON.stringify({ token: chunkText })}\n\n`;
          controller.enqueue(encoder.encode(evento));
        }

        // Sinalizar fim do stream
        const eventoFinal = `data: ${JSON.stringify({ done: true })}\n\n`;
        controller.enqueue(encoder.encode(eventoFinal));
        controller.close();

        // Salvar conversa após streaming completar
        await salvarConversa(empresaId, message, respostaCompleta);
      } catch (error) {
        console.error('Erro no streaming da Diana:', error);
        const eventoErro = `data: ${JSON.stringify({ error: 'Erro ao processar resposta.' })}\n\n`;
        controller.enqueue(encoder.encode(eventoErro));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Salva a conversa (mensagem do usuário + resposta da Diana) no Supabase.
 * @param {string} empresaId - ID da empresa
 * @param {string} mensagemUsuario - Mensagem enviada pelo usuário
 * @param {string} respostaDiana - Resposta gerada pela Diana
 */
async function salvarConversa(empresaId, mensagemUsuario, respostaDiana) {
  const agora = new Date().toISOString();

  const { error: saveError } = await supabase
    .from('diana_conversas')
    .insert([
      {
        empresa_id: empresaId,
        papel: 'user',
        conteudo: mensagemUsuario,
        criado_em: agora,
      },
      {
        empresa_id: empresaId,
        papel: 'assistant',
        conteudo: respostaDiana,
        criado_em: new Date(Date.now() + 1).toISOString(), // +1ms para ordenação
      },
    ]);

  if (saveError) {
    console.error('Erro ao salvar conversa:', saveError);
    // Não falha a resposta — o chat ainda funciona
  }
}
