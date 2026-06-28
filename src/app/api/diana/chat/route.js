import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { askDiana } from '@/lib/diana-engine';

const DEFAULT_EMPRESA_ID = 'demo-padaria-001';

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body.message;
    const empresaId = body.empresa_id || DEFAULT_EMPRESA_ID;

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

      operationalContext += `PRODUÇÃO RECENTE (últimos 14 dias):\n${producaoFormatada.join('\n')}\n`;
    }

    // 3. Formatar histórico para o engine
    const history = historicoMsgs.map((msg) => ({
      role: msg.papel,
      content: msg.conteudo,
    }));

    // 4. Chamar a Diana
    const dianaResponse = await askDiana(message.trim(), operationalContext, history);

    // 5. Salvar mensagem do usuário e resposta no histórico
    const agora = new Date().toISOString();

    const { error: saveError } = await supabase
      .from('diana_conversas')
      .insert([
        {
          empresa_id: empresaId,
          papel: 'user',
          conteudo: message.trim(),
          criado_em: agora,
        },
        {
          empresa_id: empresaId,
          papel: 'assistant',
          conteudo: dianaResponse,
          criado_em: new Date(Date.now() + 1).toISOString(), // +1ms para ordenação
        },
      ]);

    if (saveError) {
      console.error('Erro ao salvar conversa:', saveError);
      // Não falha a resposta — o chat ainda funciona
    }

    // 6. Retornar resposta
    return NextResponse.json({
      response: dianaResponse,
      context_used: contextUsed,
    });
  } catch (error) {
    console.error('Erro no chat da Diana:', error);

    if (error.message?.includes('API key') || error.message?.includes('API_KEY')) {
      return NextResponse.json(
        { error: 'Erro de configuração da IA. Verifique a chave da API Gemini.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno ao processar sua mensagem. Tente novamente.' },
      { status: 500 }
    );
  }
}
