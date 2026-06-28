import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { findRecipesForItem } from '@/lib/recipes-db';

const DEFAULT_EMPRESA_ID = 'demo-padaria-001';

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const empresaId = searchParams.get('empresa_id') || DEFAULT_EMPRESA_ID;

    const hoje = new Date();
    const em7Dias = new Date(hoje);
    em7Dias.setDate(hoje.getDate() + 7);
    const tresDiasAtras = new Date(hoje);
    tresDiasAtras.setDate(hoje.getDate() - 3);

    // Buscar dados em paralelo
    const [estoqueResult, producaoResult] = await Promise.all([
      // Itens com validade nos próximos 7 dias (ou já vencidos)
      supabase
        .from('insumos_estoque')
        .select('*')
        .eq('empresa_id', empresaId)
        .lte('data_validade', em7Dias.toISOString().split('T')[0])
        .order('data_validade', { ascending: true }),

      // Produção dos últimos 3 dias
      supabase
        .from('historico_producao_vendas')
        .select('*')
        .eq('empresa_id', empresaId)
        .gte('data', tresDiasAtras.toISOString().split('T')[0])
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

    // ── Alertas de validade (CRITICAL e WARNING) ──
    for (const item of estoque) {
       const validade = new Date(item.data_validade);
       const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

       if (diasRestantes <= 3) {
         // CRITICAL — vence in 3 dias ou já venceu
         alertCounter++;
         alerts.push({
           id: `alert-crit-${alertCounter}`,
           type: 'VALIDADE',
           severity: 'CRITICAL',
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
    for (const reg of producao) {
      if (reg.qtd_produzida > 0 && reg.qtd_perda > 0) {
        const percentualPerda = (reg.qtd_perda / reg.qtd_produzida) * 100;

        if (percentualPerda > 20) {
          alertCounter++;
          alerts.push({
            id: `alert-over-${alertCounter}`,
            type: 'SUPERPRODUÇÃO',
            severity: 'WARNING',
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

        alertCounter++;
        const receitasTexto = receitas
          .slice(0, 3)
          .map((r) => r.nome)
          .join(', ');

        alerts.push({
          id: `alert-reuse-${alertCounter}`,
          type: 'REAPROVEITAMENTO',
          severity: 'INFO',
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

    // Ordenar: CRITICAL primeiro, depois WARNING, depois INFO
    const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    alerts.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

    return NextResponse.json({
      alerts,
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
