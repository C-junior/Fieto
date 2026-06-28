import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do item é obrigatório.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nome, quantidade_atual, unidade, data_validade, categoria, custo_unitario } = body;

    // Montar objeto de atualização apenas com campos fornecidos
    const updateData = {};
    if (nome !== undefined) updateData.nome = nome;
    if (quantidade_atual !== undefined) {
      if (typeof quantidade_atual !== 'number' || quantidade_atual < 0) {
        return NextResponse.json(
          { error: 'Quantidade deve ser um número positivo.' },
          { status: 400 }
        );
      }
      updateData.quantidade_atual = quantidade_atual;
    }
    if (unidade !== undefined) updateData.unidade = unidade;
    if (data_validade !== undefined) updateData.data_validade = data_validade;
    if (categoria !== undefined) updateData.categoria = categoria;
    if (custo_unitario !== undefined) updateData.custo_unitario = custo_unitario;
    updateData.atualizado_em = new Date().toISOString();

    if (Object.keys(updateData).length <= 1) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar foi fornecido.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('insumos_estoque')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Item não encontrado.' },
          { status: 404 }
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar item do estoque. Tente novamente.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do item é obrigatório.' },
        { status: 400 }
      );
    }

    const { error, count } = await supabase
      .from('insumos_estoque')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error('Erro ao excluir item:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir item do estoque. Tente novamente.' },
      { status: 500 }
    );
  }
}
