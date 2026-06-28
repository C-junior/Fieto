/**
 * Base de receitas para reaproveitamento de insumos próximos ao vencimento.
 * Cada receita mapeia ingredientes-chave para sugestões de uso.
 */
const RECIPES_DB = [
  {
    id: 'rec-001',
    nome: 'Pudim de Pão',
    ingredientes_chave: ['pão', 'pao', 'leite', 'ovos', 'ovo'],
    descricao: 'Pudim feito com pão amanhecido, leite e ovos. Ótimo para reaproveitar pães do dia anterior.',
    tempo_preparo: '60 min',
  },
  {
    id: 'rec-002',
    nome: 'Torrada Especial',
    ingredientes_chave: ['pão', 'pao', 'manteiga', 'queijo'],
    descricao: 'Torradas crocantes com manteiga e queijo. Ideal para pães próximos ao vencimento.',
    tempo_preparo: '15 min',
  },
  {
    id: 'rec-003',
    nome: 'Farinha de Rosca Caseira',
    ingredientes_chave: ['pão', 'pao'],
    descricao: 'Triture pães secos para fazer farinha de rosca. Pode ser vendida ou usada em empanados.',
    tempo_preparo: '30 min',
  },
  {
    id: 'rec-004',
    nome: 'Bolo de Banana',
    ingredientes_chave: ['banana', 'farinha', 'ovos', 'ovo', 'açúcar', 'acucar'],
    descricao: 'Bolo simples usando bananas maduras. Excelente para frutas próximas ao vencimento.',
    tempo_preparo: '45 min',
  },
  {
    id: 'rec-005',
    nome: 'Cream Cheese Caseiro',
    ingredientes_chave: ['leite', 'creme de leite', 'creme', 'iogurte'],
    descricao: 'Cream cheese feito com leite e creme. Reaproveita laticínios próximos ao vencimento.',
    tempo_preparo: '120 min',
  },
  {
    id: 'rec-006',
    nome: 'Brigadeiro Gourmet',
    ingredientes_chave: ['leite condensado', 'chocolate', 'cacau', 'creme de leite', 'manteiga'],
    descricao: 'Brigadeiros gourmet para venda rápida. Usa chocolate e laticínios com validade curta.',
    tempo_preparo: '30 min',
  },
  {
    id: 'rec-007',
    nome: 'Pão Recheado',
    ingredientes_chave: ['farinha', 'fermento', 'queijo', 'presunto', 'calabresa'],
    descricao: 'Pães recheados com embutidos e queijos próximos ao vencimento.',
    tempo_preparo: '90 min',
  },
  {
    id: 'rec-008',
    nome: 'Geleia Caseira',
    ingredientes_chave: ['fruta', 'frutas', 'morango', 'uva', 'açúcar', 'acucar'],
    descricao: 'Geleias artesanais feitas com frutas maduras. Prolonga a vida útil em semanas.',
    tempo_preparo: '45 min',
  },
  {
    id: 'rec-009',
    nome: 'Massa de Pizza',
    ingredientes_chave: ['farinha', 'fermento', 'azeite', 'óleo'],
    descricao: 'Massa de pizza usando farinha e fermento. Pode ser congelada para uso posterior.',
    tempo_preparo: '120 min',
  },
  {
    id: 'rec-010',
    nome: 'Croûtons',
    ingredientes_chave: ['pão', 'pao', 'azeite', 'alho', 'ervas'],
    descricao: 'Croûtons crocantes para sopas e saladas. Reaproveita pães de forma e baguetes.',
    tempo_preparo: '20 min',
  },
];

/**
 * Busca receitas que usam um determinado insumo.
 * @param {string} itemName - Nome do insumo (ex: "farinha de trigo", "leite")
 * @returns {Array<{id: string, nome: string, descricao: string, tempo_preparo: string}>}
 */
export function findRecipesForItem(itemName) {
  if (!itemName) return [];

  const normalizado = itemName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return RECIPES_DB.filter((recipe) =>
    recipe.ingredientes_chave.some((ingrediente) => {
      const ingNorm = ingrediente
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return normalizado.includes(ingNorm) || ingNorm.includes(normalizado);
    })
  ).map(({ id, nome, descricao, tempo_preparo }) => ({
    id,
    nome,
    descricao,
    tempo_preparo,
  }));
}
