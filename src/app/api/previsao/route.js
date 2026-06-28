import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { predictDemand, calculateMetrics } from '@/lib/demand-predictor';

const DEFAULT_EMPRESA_ID = 'demo-padaria-001';

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const empresaId = searchParams.get('empresa_id') || DEFAULT_EMPRESA_ID;

    // Buscar últimos 90 dias de histórico
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 90);

    const { data: historico, error } = await supabase
      .from('historico_producao_vendas')
      .select('produto_nome, data, qtd_vendida, qtd_produzida, qtd_perda')
      .eq('empresa_id', empresaId)
      .gte('data', dataInicio.toISOString().split('T')[0])
      .order('data', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    if (!historico || historico.length === 0) {
      return NextResponse.json({
        predictions: [],
        metrics: {
          mae: 0,
          mape: 0,
          acuracia_media: 0,
          total_produtos: 0,
          periodo_dias: 0,
          aviso: 'Nenhum dado de produção encontrado para gerar previsões.',
        },
      });
    }

    const predictions = predictDemand(historico);
    const metrics = calculateMetrics(historico);

    return NextResponse.json({
      predictions,
      metrics,
    });
  } catch (error) {
    console.error('Erro ao gerar previsão de demanda:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar previsão de demanda. Tente novamente.' },
      { status: 500 }
    );
  }
}
