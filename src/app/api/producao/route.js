import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const DEFAULT_EMPRESA_ID = 'demo-padaria-001';

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const empresaId = searchParams.get('empresa_id') || DEFAULT_EMPRESA_ID;

    const { data, error } = await supabase
      .from('historico_producao_vendas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('data', { ascending: false })
      .limit(90);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ records: data || [] });
  } catch (error) {
    console.error('Erro ao listar produção:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar histórico de produção. Tente novamente.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const empresaId = body.empresa_id || DEFAULT_EMPRESA_ID;

    const { produto_nome, data, qtd_produzida, qtd_vendida, qtd_perda } = body;

    if (!produto_nome || !data || qtd_produzida === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: produto_nome, data, qtd_produzida.' },
        { status: 400 }
      );
    }

    if (typeof qtd_produzida !== 'number' || qtd_produzida < 0) {
      return NextResponse.json(
        { error: 'Quantidade produzida deve ser um número positivo.' },
        { status: 400 }
      );
    }

    // Calcular perda automaticamente se não fornecida
    const perdaCalculada =
      qtd_perda !== undefined
        ? qtd_perda
        : Math.max(0, (qtd_produzida || 0) - (qtd_vendida || 0));

    const { data: record, error } = await supabase
      .from('historico_producao_vendas')
      .insert([
        {
          empresa_id: empresaId,
          produto_nome,
          data,
          qtd_produzida,
          qtd_vendida: qtd_vendida || 0,
          qtd_perda: perdaCalculada,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('Erro ao registrar produção:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar produção. Verifique os dados e tente novamente.' },
      { status: 500 }
    );
  }
}
