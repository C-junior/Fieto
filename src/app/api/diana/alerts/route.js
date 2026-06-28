import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { findRecipesForItem } from '@/lib/recipes-db';
import { predictDemand } from '@/lib/demand-predictor';

const DEFAULT_EMPRESA_ID = 'demo-padaria-001';

/**
 * Calcula o score de prioridade de um alerta.
 * Score = (1/max(dias_restantes, 0.5)) * 3 + (valor_financeiro/100) * 2 + (quantidade/50) * 1
 * @param {number} diasRestantes - Dias até vencimento
 * @param {number} valorFinanceiro - Valor financeiro estimado em R$
 * @param {number} quantidade - Quantidade do item
 * @returns {number} Score de prioridade (maior = mais urgente)
 */
function calcularPrioridade(diasRestantes, valorFinanceiro, quantidade) {
  const fatorTempo = (1 / Math.max(diasRestantes, 0.5)) * 3;
  const fatorValor = (valorFinanceiro / 100) * 2;
  const fatorQuantidade = (quantidade / 50) * 1;
  return Math.round((fatorTempo + fatorValor + fatorQuantidade) * 100) / 100;
}

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const empresaId = searchParams.get('empresa_id') || DEFAULT_EMPRESA_ID;

    const hoje = new Date();
    const em7Dias = new Date(hoje);
    em7Dias.setDate(hoje.getDate() + 7);
    const quatorzeDiasAtras = new Date(hoje);
    quatorzeDiasAtras.setDate(hoje.getDate() - 14);

    // Buscar dados em paralelo
    const [estoqueResult, producaoResult] = await Promise.all([
      // Itens com validade nos próximos 7 dias (ou já vencidos)
      supabase
        .from('insumos_estoque')
        .select('*')
        .eq('empresa_id', empresaId)
        .lte('data_validade', em7Dias.toISOString().split('T')[0])
        .order('data_validade', { ascending: true }),

      // Produção dos últimos 14 dias (ampliado para alimentar previsão de demanda)
      supabase
        .from('historico_producao_vendas')
        .select('*')
        .eq('empresa_id', empresaId)
        .gte('data', quatorzeDiasAtras.toISOString().split('T')[0])
        .order('data', { ascending: false }),
    ]);

    if (estoqueResult.error) {
      throw new Error(`Erro ao buscar estoque: ${estoqueResult.error.message}`);
    }
    if (producaoResult.error) {
      throw new Error(`Erro ao buscar produção: ${producaoResult.error.message}`);
    }

    const estoque = estoqueResult.data || [];
    const producao = producaoResult.data || [];
    const alerts = [];
    let alertCounter = 0;

    // Custo médio por unidade para estimativa de valor financeiro
    const custoMedioUnidade = 3.5;

    // ── Alertas de validade (CRITICAL e WARNING) ──
    for (const item of estoque) {
       const validade = new Date(item.data_validade);
       const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
       const valorFinanceiro = (item.quantidade_atual || 0) * custoMedioUnidade;

       if (diasRestantes <= 3) {
         // CRITICAL — vence em 3 dias ou já venceu
         alertCounter++;
         alerts.push({
           id: `alert-crit-${alertCounter}`,
           type: 'VALIDADE',
           severity: 'CRITICAL',
           priority_score: calcularPrioridade(diasRestantes, valorFinanceiro, item.quantidade_atual || 0),
           title: diasRestantes <= 0
             ? `${item.nome} VENCIDO!`
             : `${item.nome} vence em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`,
           message: diasRestantes <= 0
             ? `${item.nome} venceu há ${Math.abs(diasRestantes)} dia(s). Quantidade: ${item.quantidade_atual} ${item.unidade || 'un'}. Descarte imediato necessário.`
             : `${item.nome} vence em ${diasRestantes} dia(s). Quantidade em estoque: ${item.quantidade_atual} ${item.unidade || 'un'}.`,
           suggestion: diasRestantes <= 0
             ? 'Descarte imediatamente e registre a perda no sistema.'
             : 'Use prioritariamente na produção de hoje ou doe antes do vencimento.',
           item_name: item.nome,
           dias_restantes: diasRestantes,
           created_at: hoje.toISOString(),
         });
       } else if (diasRestantes <= 7) {
         // WARNING — vence em 4–7 dias
         alertCounter++;
         alerts.push({
           id: `alert-warn-${alertCounter}`,
           type: 'VALIDADE',
           severity: 'WARNING',
           priority_score: calcularPrioridade(diasRestantes, valorFinanceiro, item.quantidade_atual || 0),
           title: `${item.nome} vence em ${diasRestantes} dias`,
           message: `${item.nome} tem validade para ${diasRestantes} dias. Quantidade: ${item.quantidade_atual} ${item.unidade || 'un'}.`,
           suggestion: 'Planeje o uso deste insumo nos próximos dias para evitar desperdício.',
           item_name: item.nome,
           dias_restantes: diasRestantes,
           created_at: hoje.toISOString(),
         });
       }
     }

    // ── Alertas de superprodução (OVERPRODUCTION) ──
    // Usar apenas últimos 3 dias para superprodução
    const tresDiasAtras = new Date(hoje);
    tresDiasAtras.setDate(hoje.getDate() - 3);

    for (const reg of producao) {
      const dataReg = new Date(reg.data + 'T12:00:00');
      if (dataReg < tresDiasAtras) continue;

      if (reg.qtd_produzida > 0 && reg.qtd_perda > 0) {
        const percentualPerda = (reg.qtd_perda / reg.qtd_produzida) * 100;

        if (percentualPerda > 20) {
          alertCounter++;
          const valorPerda = reg.qtd_perda * custoMedioUnidade;
          alerts.push({
            id: `alert-over-${alertCounter}`,
            type: 'SUPERPRODUÇÃO',
            severity: 'WARNING',
            priority_score: calcularPrioridade(7, valorPerda, reg.qtd_perda),
            title: `Alta perda em ${reg.produto_nome} (${Math.round(percentualPerda)}%)`,
            message: `Em ${reg.data}, ${reg.produto_nome} teve ${reg.qtd_perda} unidades de perda (${Math.round(percentualPerda)}% do produzido). Produzido: ${reg.qtd_produzida}, Vendido: ${reg.qtd_vendida}.`,
            suggestion: `Considere reduzir a produção de ${reg.produto_nome} em ${Math.round(percentualPerda - 10)}% nos próximos dias.`,
            item_name: reg.produto_nome,
            dias_restantes: null,
            created_at: hoje.toISOString(),
          });
        }
      }
    }

    // ── Alertas de reaproveitamento (REUSE) ──
    const itensParaReuso = estoque.filter((item) => {
      const validade = new Date(item.data_validade);
      const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
      return diasRestantes > 0 && diasRestantes <= 5;
    });

    for (const item of itensParaReuso) {
      const receitas = findRecipesForItem(item.nome);
      if (receitas.length > 0) {
        const validade = new Date(item.data_validade);
        const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
        const valorFinanceiro = (item.quantidade_atual || 0) * custoMedioUnidade;

        alertCounter++;
        const receitasTexto = receitas
          .slice(0, 3)
          .map((r) => r.nome)
          .join(', ');

        alerts.push({
          id: `alert-reuse-${alertCounter}`,
          type: 'REAPROVEITAMENTO',
          severity: 'INFO',
          priority_score: calcularPrioridade(diasRestantes, valorFinanceiro, item.quantidade_atual || 0),
          title: `Receitas sugeridas para ${item.nome}`,
          message: `${item.nome} vence em ${diasRestantes} dia(s). Receitas possíveis: ${receitasTexto}.`,
          suggestion: receitas[0].descricao,
          item_name: item.nome,
          dias_restantes: diasRestantes,
          receitas_sugeridas: receitas.slice(0, 3),
          created_at: hoje.toISOString(),
        });
      }
    }

    // ── Alertas de oportunidade baseados em previsão de demanda ──
    const previsoes = predictDemand(producao);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    const diaSemanaAmanha = amanha.getDay();

    // Oportunidade: fim de semana → +35% produção
    if (diaSemanaAmanha === 0 || diaSemanaAmanha === 6) {
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      alertCounter++;
      alerts.push({
        id: `alert-oport-${alertCounter}`,
        type: 'OPORTUNIDADE',
        severity: 'INFO',
        priority_score: 2.0, // Score moderado para oportunidades de fim de semana
        title: `Amanhã é ${diasSemana[diaSemanaAmanha]} — aumente a produção!`,
        message: `Fins de semana costumam ter ~35% mais demanda. Considere aumentar a produção de todos os produtos principais.`,
        suggestion: 'Aumente a produção em 35% para os itens de maior saída no fim de semana.',
        item_name: null,
        dias_restantes: null,
        created_at: hoje.toISOString(),
      });
    }

    // Oportunidade: demanda prevista significativamente acima da média
    if (previsoes.length > 0) {
      // Calcular média geral por produto
      const mediaPorProduto = {};
      const contagemPorProduto = {};
      for (const p of previsoes) {
        if (!mediaPorProduto[p.produto_nome]) {
          mediaPorProduto[p.produto_nome] = 0;
          contagemPorProduto[p.produto_nome] = 0;
        }
        mediaPorProduto[p.produto_nome] += p.qtd_prevista;
        contagemPorProduto[p.produto_nome]++;
      }

      // Verificar se algum dia específico tem demanda >30% acima da média
      for (const p of previsoes) {
        const media = mediaPorProduto[p.produto_nome] / contagemPorProduto[p.produto_nome];
        if (p.qtd_prevista > media * 1.3 && p.data === amanha.toISOString().split('T')[0]) {
          alertCounter++;
          const aumento = Math.round(((p.qtd_prevista - media) / media) * 100);
          alerts.push({
            id: `alert-oport-${alertCounter}`,
            type: 'OPORTUNIDADE',
            severity: 'INFO',
            priority_score: 1.5 + (aumento / 100), // Score proporcional ao aumento previsto
            title: `Demanda alta prevista para ${p.produto_nome}`,
            message: `A previsão indica ${p.qtd_prevista} unidades de ${p.produto_nome} para amanhã (${p.dia_semana}), ${aumento}% acima da média.`,
            suggestion: `Produza pelo menos ${p.qtd_prevista} unidades de ${p.produto_nome} amanhã para atender a demanda.`,
            item_name: p.produto_nome,
            dias_restantes: null,
            created_at: hoje.toISOString(),
          });
        }
      }
    }

    // Ordenar por priority_score (maior primeiro) e limitar a top 8
    alerts.sort((a, b) => b.priority_score - a.priority_score);
    const topAlerts = alerts.slice(0, 8);

    return NextResponse.json({
      alerts: topAlerts,
      generated_at: hoje.toISOString(),
    });
  } catch (error) {
    console.error('Erro ao gerar alertas:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar alertas operacionais. Tente novamente.' },
      { status: 500 }
    );
  }
}
