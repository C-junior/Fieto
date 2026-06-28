import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const DEFAULT_EMPRESA_ID = 'demo-padaria-001';

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const empresaId = searchParams.get('empresa_id') || DEFAULT_EMPRESA_ID;

    const { data, error } = await supabase
      .from('insumos_estoque')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('data_validade', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ items: data || [] });
  } catch (error) {
    console.error('Erro ao listar estoque:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar itens do estoque. Tente novamente.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const empresaId = body.empresa_id || DEFAULT_EMPRESA_ID;

    const { nome, quantidade_atual, unidade, data_validade, categoria, custo_unitario } = body;

    if (!nome || quantidade_atual === undefined || !data_validade) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, quantidade_atual, data_validade.' },
        { status: 400 }
      );
    }

    if (typeof quantidade_atual !== 'number' || quantidade_atual < 0) {
      return NextResponse.json(
        { error: 'Quantidade deve ser um número positivo.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('insumos_estoque')
      .insert([
        {
          empresa_id: empresaId,
          nome,
          quantidade_atual,
          unidade: unidade || 'un',
          data_validade,
          categoria: categoria || null,
          custo_unitario: custo_unitario || null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar item no estoque:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar item ao estoque. Verifique os dados e tente novamente.' },
      { status: 500 }
    );
  }
}
