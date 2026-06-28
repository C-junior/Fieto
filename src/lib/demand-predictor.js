/**
 * Motor de previsão de demanda baseado em média móvel ponderada
 * com ajuste de sazonalidade por dia da semana.
 *
 * Abordagem estatística leve, sem dependência de ML.
 */

/**
 * Calcula previsão de demanda para os próximos 7 dias.
 * @param {Array<{produto_nome: string, data: string, qtd_vendida: number, qtd_produzida: number}>} historico
 * @returns {Array<{produto_nome: string, data: string, dia_semana: string, qtd_prevista: number, confianca: number}>}
 */
export function predictDemand(historico) {
  if (!historico || historico.length === 0) return [];

  const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // Agrupar por produto
  const porProduto = {};
  for (const registro of historico) {
    const key = registro.produto_nome;
    if (!porProduto[key]) porProduto[key] = [];
    porProduto[key].push(registro);
  }

  const previsoes = [];

  for (const [produto_nome, registros] of Object.entries(porProduto)) {
    // Calcular média por dia da semana (sazonalidade semanal)
    const mediaPorDia = {};
    const contagemPorDia = {};

    for (const reg of registros) {
      const diaSemana = new Date(reg.data + 'T12:00:00').getDay();
      if (!mediaPorDia[diaSemana]) {
        mediaPorDia[diaSemana] = 0;
        contagemPorDia[diaSemana] = 0;
      }
      mediaPorDia[diaSemana] += reg.qtd_vendida || 0;
      contagemPorDia[diaSemana] += 1;
    }

    for (const dia of Object.keys(mediaPorDia)) {
      mediaPorDia[dia] = mediaPorDia[dia] / contagemPorDia[dia];
    }

    // Média móvel ponderada (últimos 14 registros, pesos crescentes)
    const sorted = [...registros].sort((a, b) => new Date(b.data) - new Date(a.data));
    const recentes = sorted.slice(0, 14);
    let somaWeighted = 0;
    let somaWeights = 0;
    recentes.forEach((reg, i) => {
      const peso = recentes.length - i;
      somaWeighted += (reg.qtd_vendida || 0) * peso;
      somaWeights += peso;
    });
    const mediaMovel = somaWeights > 0 ? somaWeighted / somaWeights : 0;

    // Gerar previsão para próximos 7 dias
    const hoje = new Date();
    for (let d = 1; d <= 7; d++) {
      const dataFutura = new Date(hoje);
      dataFutura.setDate(hoje.getDate() + d);
      const diaSemana = dataFutura.getDay();

      const mediaDia = mediaPorDia[diaSemana] || mediaMovel;

      // Blend: 60% sazonalidade do dia, 40% média móvel geral
      const qtdPrevista = Math.round(mediaDia * 0.6 + mediaMovel * 0.4);

      // Confiança baseada na quantidade de dados disponíveis
      const dadosDia = contagemPorDia[diaSemana] || 0;
      const confianca = Math.min(0.95, 0.4 + dadosDia * 0.08);

      previsoes.push({
        produto_nome,
        data: dataFutura.toISOString().split('T')[0],
        dia_semana: DIAS_SEMANA[diaSemana],
        qtd_prevista: qtdPrevista,
        confianca: Math.round(confianca * 100) / 100,
      });
    }
  }

  return previsoes;
}

/**
 * Calcula métricas de precisão do modelo comparando previsões anteriores com dados reais.
 * @param {Array<{produto_nome: string, data: string, qtd_vendida: number, qtd_produzida: number}>} historico
 * @returns {{mae: number, mape: number, acuracia_media: number, total_produtos: number, periodo_dias: number}}
 */
export function calculateMetrics(historico) {
  if (!historico || historico.length < 7) {
    return {
      mae: 0,
      mape: 0,
      acuracia_media: 0,
      total_produtos: 0,
      periodo_dias: historico?.length || 0,
      aviso: 'Dados insuficientes para calcular métricas. Mínimo de 7 registros necessários.',
    };
  }

  const sorted = [...historico].sort((a, b) => new Date(a.data) - new Date(b.data));

  // Dividir: primeiros 80% para treino, últimos 20% para teste
  const splitIndex = Math.floor(sorted.length * 0.8);
  const treino = sorted.slice(0, splitIndex);
  const teste = sorted.slice(splitIndex);

  // Gerar previsões com dados de treino e comparar com teste
  const prediçõesTreino = predictDemand(treino);

  let somaErroAbsoluto = 0;
  let somaErroPercentual = 0;
  let comparacoes = 0;

  for (const real of teste) {
    const previsao = prediçõesTreino.find(
      (p) => p.produto_nome === real.produto_nome && p.data === real.data
    );
    if (previsao && real.qtd_vendida > 0) {
      const erro = Math.abs(previsao.qtd_prevista - real.qtd_vendida);
      somaErroAbsoluto += erro;
      somaErroPercentual += erro / real.qtd_vendida;
      comparacoes++;
    }
  }

  const produtos = new Set(historico.map((h) => h.produto_nome));
  const mae = comparacoes > 0 ? Math.round((somaErroAbsoluto / comparacoes) * 100) / 100 : 0;
  const mape = comparacoes > 0 ? Math.round((somaErroPercentual / comparacoes) * 10000) / 100 : 0;

  return {
    mae,
    mape,
    acuracia_media: Math.max(0, Math.round((100 - mape) * 100) / 100),
    total_produtos: produtos.size,
    periodo_dias: historico.length,
    comparacoes_realizadas: comparacoes,
  };
}
