import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { predictDemand } from '@/lib/demand-predictor';
import { findRecipesForItem } from '@/lib/recipes-db';

const DEFAULT_EMPRESA_ID = 'demo-padaria-001';

/**
 * Retorna saudação baseada no horário atual (fuso BR).
 * @returns {string} Saudação apropriada
 */
function getSaudacao() {
  // Horário em UTC-3 (Brasil)
  const agora = new Date();
  const hora = agora.getUTCHours() - 3;
  const horaAjustada = hora < 0 ? hora + 24 : hora;

  if (horaAjustada >= 5 && horaAjustada < 12) return 'Bom dia!';
  if (horaAjustada >= 12 && horaAjustada < 18) return 'Boa tarde!';
  return 'Boa noite!';
}

/**
 * GET /api/diana/briefing?empresa_id=demo-padaria-001
 *
 * Briefing matinal — computação pura de dados, sem chamada ao Gemini.
 * Resposta instantânea com resumo operacional do dia.
 */
export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const empresaId = searchParams.get('empresa_id') || DEFAULT_EMPRESA_ID;

    const hoje = new Date();
    const quatorzeDiasAtras = new Date(hoje);
    quatorzeDiasAtras.setDate(hoje.getDate() - 14);

    // Buscar dados em paralelo
    const [estoqueResult, producaoResult] = await Promise.all([
      supabase
        .from('insumos_estoque')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data_validade', { ascending: true }),

      supabase
        .from('historico_producao_vendas')
        .select('*')
        .eq('empresa_id', empresaId)
        .gte('data', quatorzeDiasAtras.toISOString().split('T')[0])
        .order('data', { ascending: false })
        .limit(200),
    ]);

    if (estoqueResult.error) {
      throw new Error(`Erro ao buscar estoque: ${estoqueResult.error.message}`);
    }
    if (producaoResult.error) {
      throw new Error(`Erro ao buscar produção: ${producaoResult.error.message}`);
    }

    const estoque = estoqueResult.data || [];
    const producao = producaoResult.data || [];

    // ── Resumo do estoque ──
    let criticos = 0;
    let vencidos = 0;
    let atencao = 0;

    for (const item of estoque) {
      const validade = new Date(item.data_validade);
      const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

      if (diasRestantes <= 0) vencidos++;
      else if (diasRestantes <= 3) criticos++;
      else if (diasRestantes <= 7) atencao++;
    }

    const resumoEstoque = {
      total_itens: estoque.length,
      criticos,
      vencidos,
      atencao,
    };

    // ── Alertas urgentes (top 3 por score de urgência) ──
    const alertasComScore = estoque
      .map((item) => {
        const validade = new Date(item.data_validade);
        const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
        // Score: quanto menor os dias e maior a quantidade, mais urgente
        const scoreUrgencia = (1 / Math.max(diasRestantes, 0.5)) * (item.quantidade_atual || 1);
        return {
          nome: item.nome,
          quantidade: item.quantidade_atual,
          unidade: item.unidade || 'un',
          dias_restantes: diasRestantes,
          data_validade: item.data_validade,
          score_urgencia: Math.round(scoreUrgencia * 100) / 100,
        };
      })
      .filter((item) => item.dias_restantes <= 7)
      .sort((a, b) => b.score_urgencia - a.score_urgencia)
      .slice(0, 3);

    // ── Sugestão de produção baseada em previsão de demanda ──
    const previsoes = predictDemand(producao);

    // Filtrar previsões para amanhã (dia mais relevante para planejamento)
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    const dataAmanha = amanha.toISOString().split('T')[0];
    const diaSemana = amanha.getDay();

    const sugestaoProdução = previsoes
      .filter((p) => p.data === dataAmanha)
      .map((p) => ({
        produto: p.produto_nome,
        quantidade_sugerida: p.qtd_prevista,
        dia_semana: p.dia_semana,
        confianca: p.confianca,
        // Ajuste para fim de semana (+35% para sábado/domingo)
        ajuste_fim_semana: (diaSemana === 0 || diaSemana === 6)
          ? Math.round(p.qtd_prevista * 1.35)
          : null,
      }));

    // ── Economia estimada do mês ──
    // Cálculo: soma de perdas evitáveis (onde houve perda > 15% da produção)
    let perdasEvitaveis = 0;
    let totalPerdas = 0;
    const custoMedioUnidade = 3.5; // R$ estimado por unidade

    for (const reg of producao) {
      if (reg.qtd_produzida > 0 && reg.qtd_perda > 0) {
        totalPerdas += reg.qtd_perda;
        const percentualPerda = (reg.qtd_perda / reg.qtd_produzida) * 100;
        if (percentualPerda > 15) {
          // Perda acima de 15% é considerada evitável
          const evitavel = reg.qtd_perda - Math.round(reg.qtd_produzida * 0.15);
          perdasEvitaveis += Math.max(0, evitavel);
        }
      }
    }

    // Projetar para o mês (dados de 14 dias → multiplicar por 2.14)
    const fatorProjecao = 30 / 14;
    const economiaMes = {
      perdas_periodo: totalPerdas,
      perdas_evitaveis_periodo: perdasEvitaveis,
      economia_estimada_mensal: `R$ ${(perdasEvitaveis * fatorProjecao * custoMedioUnidade).toFixed(2)}`,
      periodo_base_dias: Math.min(producao.length, 14),
    };

    // ── Receitas sugeridas para itens críticos (≤3 dias) ──
    const receitasSugeridas = [];
    for (const item of estoque) {
      const validade = new Date(item.data_validade);
      const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

      if (diasRestantes > 0 && diasRestantes <= 3) {
        const receitas = findRecipesForItem(item.nome);
        if (receitas.length > 0) {
          receitasSugeridas.push({
            insumo: item.nome,
            dias_restantes: diasRestantes,
            quantidade_disponivel: `${item.quantidade_atual} ${item.unidade || 'un'}`,
            receitas: receitas.slice(0, 2),
          });
        }
      }
    }

    return NextResponse.json({
      briefing: {
        saudacao: getSaudacao(),
        resumo_estoque: resumoEstoque,
        alertas_urgentes: alertasComScore,
        sugestao_producao: sugestaoProdução,
        economia_mes: economiaMes,
        receitas_sugeridas: receitasSugeridas,
      },
      generated_at: hoje.toISOString(),
    });
  } catch (error) {
    console.error('Erro ao gerar briefing:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar briefing operacional. Tente novamente.' },
      { status: 500 }
    );
  }
}
