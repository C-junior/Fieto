-- ============================================
-- INTEGRA - Schema do Banco de Dados
-- Sistema de Gestão Inteligente de Panificação
-- ============================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: perfis_usuarios
-- Gerenciamento de acessos por empresa
-- ============================================
CREATE TABLE IF NOT EXISTS perfis_usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cargo TEXT DEFAULT 'operador',
  empresa_id TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABELA: insumos_estoque
-- Controle de matéria-prima
-- ============================================
CREATE TABLE IF NOT EXISTS insumos_estoque (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  categoria TEXT DEFAULT 'geral',
  quantidade_atual NUMERIC NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'kg',
  lote TEXT,
  data_validade DATE,
  custo_unitario NUMERIC DEFAULT 0,
  empresa_id TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca por validade
CREATE INDEX IF NOT EXISTS idx_estoque_validade ON insumos_estoque(data_validade ASC);
CREATE INDEX IF NOT EXISTS idx_estoque_empresa ON insumos_estoque(empresa_id);

-- ============================================
-- TABELA: historico_producao_vendas
-- Dados para calibração de IA
-- ============================================
CREATE TABLE IF NOT EXISTS historico_producao_vendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data DATE NOT NULL,
  produto_nome TEXT NOT NULL,
  qtd_produzida NUMERIC DEFAULT 0,
  qtd_vendida NUMERIC DEFAULT 0,
  qtd_perda NUMERIC DEFAULT 0,
  empresa_id TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_producao_data ON historico_producao_vendas(data DESC);
CREATE INDEX IF NOT EXISTS idx_producao_empresa ON historico_producao_vendas(empresa_id);

-- ============================================
-- TABELA: diana_conversas
-- Histórico de chat com a Diana
-- ============================================
CREATE TABLE IF NOT EXISTS diana_conversas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  papel TEXT NOT NULL CHECK (papel IN ('user', 'assistant')),
  conteudo TEXT NOT NULL,
  empresa_id TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diana_empresa ON diana_conversas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_diana_criado ON diana_conversas(criado_em DESC);

-- ============================================
-- RLS (Row Level Security)
-- Para o MVP/demo, permitimos acesso anon
-- Em produção, filtrar por auth.jwt()
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE perfis_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_producao_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE diana_conversas ENABLE ROW LEVEL SECURITY;

-- Policies para demo (permite acesso via anon key)
-- Em produção, trocar por auth.jwt() ->> 'empresa_id'
CREATE POLICY "Permitir leitura demo" ON perfis_usuarios FOR SELECT USING (true);
CREATE POLICY "Permitir tudo demo" ON perfis_usuarios FOR ALL USING (true);

CREATE POLICY "Permitir leitura estoque" ON insumos_estoque FOR SELECT USING (true);
CREATE POLICY "Permitir inserção estoque" ON insumos_estoque FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização estoque" ON insumos_estoque FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão estoque" ON insumos_estoque FOR DELETE USING (true);

CREATE POLICY "Permitir leitura producao" ON historico_producao_vendas FOR SELECT USING (true);
CREATE POLICY "Permitir inserção producao" ON historico_producao_vendas FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização producao" ON historico_producao_vendas FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão producao" ON historico_producao_vendas FOR DELETE USING (true);

CREATE POLICY "Permitir leitura diana" ON diana_conversas FOR SELECT USING (true);
CREATE POLICY "Permitir inserção diana" ON diana_conversas FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização diana" ON diana_conversas FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão diana" ON diana_conversas FOR DELETE USING (true);

-- ============================================
-- SEED DATA: Dados dramáticos para demo
-- empresa_id fixo para demo: 'demo-padaria-001'
-- ============================================

-- Limpar dados existentes (para re-execuções)
DELETE FROM diana_conversas WHERE empresa_id = 'demo-padaria-001';
DELETE FROM historico_producao_vendas WHERE empresa_id = 'demo-padaria-001';
DELETE FROM insumos_estoque WHERE empresa_id = 'demo-padaria-001';

-- ============================================
-- INSUMOS DE ESTOQUE
-- Cenários dramáticos: itens vencendo, estoque alto
-- ============================================
INSERT INTO insumos_estoque (nome, categoria, quantidade_atual, unidade, lote, data_validade, custo_unitario, empresa_id) VALUES
-- 🔴 CRÍTICOS - Vencem em 1-3 dias
('Leite Integral', 'laticínios', 30, 'litros', 'LT-2025-0612', CURRENT_DATE + INTERVAL '2 days', 4.50, 'demo-padaria-001'),
('Creme de Leite', 'laticínios', 15, 'litros', 'CL-2025-0610', CURRENT_DATE + INTERVAL '1 day', 8.90, 'demo-padaria-001'),
('Ovos Caipira', 'proteínas', 120, 'unidades', 'OV-2025-0611', CURRENT_DATE + INTERVAL '3 days', 1.20, 'demo-padaria-001'),
('Morango Fresco', 'frutas', 8, 'kg', 'FR-2025-0613', CURRENT_DATE + INTERVAL '1 day', 22.00, 'demo-padaria-001'),

-- 🟡 ATENÇÃO - Vencem em 4-7 dias
('Manteiga sem Sal', 'laticínios', 12, 'kg', 'MT-2025-0608', CURRENT_DATE + INTERVAL '5 days', 35.00, 'demo-padaria-001'),
('Fermento Biológico', 'fermentação', 5, 'kg', 'FB-2025-0607', CURRENT_DATE + INTERVAL '6 days', 28.00, 'demo-padaria-001'),
('Queijo Mussarela', 'laticínios', 20, 'kg', 'QM-2025-0609', CURRENT_DATE + INTERVAL '4 days', 32.00, 'demo-padaria-001'),
('Presunto Fatiado', 'frios', 10, 'kg', 'PF-2025-0610', CURRENT_DATE + INTERVAL '5 days', 25.00, 'demo-padaria-001'),
('Banana Prata', 'frutas', 15, 'kg', 'BN-2025-0612', CURRENT_DATE + INTERVAL '4 days', 6.50, 'demo-padaria-001'),

-- 🟢 SEGUROS - Vencem em 8+ dias
('Farinha de Trigo', 'farinhas', 200, 'kg', 'FT-2025-0520', CURRENT_DATE + INTERVAL '45 days', 4.20, 'demo-padaria-001'),
('Açúcar Cristal', 'açúcares', 80, 'kg', 'AC-2025-0601', CURRENT_DATE + INTERVAL '90 days', 3.80, 'demo-padaria-001'),
('Óleo de Soja', 'óleos', 40, 'litros', 'OS-2025-0515', CURRENT_DATE + INTERVAL '120 days', 7.50, 'demo-padaria-001'),
('Sal Refinado', 'temperos', 25, 'kg', 'SR-2025-0510', CURRENT_DATE + INTERVAL '180 days', 2.10, 'demo-padaria-001'),
('Chocolate em Pó', 'chocolates', 15, 'kg', 'CP-2025-0525', CURRENT_DATE + INTERVAL '60 days', 18.00, 'demo-padaria-001'),
('Leite Condensado', 'laticínios', 30, 'unidades', 'LC-2025-0601', CURRENT_DATE + INTERVAL '150 days', 5.50, 'demo-padaria-001'),
('Margarina Culinária', 'gorduras', 25, 'kg', 'MG-2025-0605', CURRENT_DATE + INTERVAL '30 days', 12.00, 'demo-padaria-001'),
('Polvilho Azedo', 'farinhas', 30, 'kg', 'PA-2025-0520', CURRENT_DATE + INTERVAL '90 days', 8.50, 'demo-padaria-001'),
('Goiabada', 'doces', 10, 'kg', 'GD-2025-0601', CURRENT_DATE + INTERVAL '120 days', 14.00, 'demo-padaria-001'),

-- ❌ VENCIDO - Para mostrar alerta extremo
('Iogurte Natural', 'laticínios', 8, 'litros', 'IO-2025-0601', CURRENT_DATE - INTERVAL '1 day', 9.50, 'demo-padaria-001');

-- ============================================
-- HISTÓRICO DE PRODUÇÃO E VENDAS (90 DIAS)
-- Dados com padrões realistas + cenários de superprodução
-- ============================================

-- Função auxiliar para gerar dados históricos
DO $$
DECLARE
  d DATE;
  dow INT;
  base_pao_frances NUMERIC;
  base_bolo_chocolate NUMERIC;
  base_pao_forma NUMERIC;
  base_biscoito NUMERIC;
  base_croissant NUMERIC;
  variacao NUMERIC;
  vendido NUMERIC;
  perda NUMERIC;
BEGIN
  FOR i IN 0..89 LOOP
    d := CURRENT_DATE - (i || ' days')::INTERVAL;
    dow := EXTRACT(DOW FROM d);
    
    -- Dia da semana afeta a demanda
    -- 0=Dom, 6=Sáb (maior demanda no fim de semana)
    CASE
      WHEN dow IN (0, 6) THEN variacao := 1.35;  -- Fim de semana: +35%
      WHEN dow = 5 THEN variacao := 1.20;          -- Sexta: +20%
      WHEN dow = 1 THEN variacao := 0.80;          -- Segunda: -20%
      ELSE variacao := 1.0;                        -- Normal
    END CASE;

    -- PÃO FRANCÊS (produto estrela)
    base_pao_frances := 150 * variacao + (random() * 30 - 15);
    vendido := base_pao_frances * (0.85 + random() * 0.12);
    -- Superprodução nos últimos 3 dias (cenário dramático)
    IF i < 3 THEN
      base_pao_frances := base_pao_frances * 1.40;
      vendido := base_pao_frances * 0.65;
    END IF;
    perda := GREATEST(0, base_pao_frances - vendido);
    
    INSERT INTO historico_producao_vendas (data, produto_nome, qtd_produzida, qtd_vendida, qtd_perda, empresa_id)
    VALUES (d, 'Pão Francês', ROUND(base_pao_frances), ROUND(vendido), ROUND(perda), 'demo-padaria-001');

    -- BOLO DE CHOCOLATE
    base_bolo_chocolate := 25 * variacao + (random() * 8 - 4);
    vendido := base_bolo_chocolate * (0.80 + random() * 0.15);
    IF i < 2 THEN
      base_bolo_chocolate := base_bolo_chocolate * 1.50;
      vendido := base_bolo_chocolate * 0.55;
    END IF;
    perda := GREATEST(0, base_bolo_chocolate - vendido);
    
    INSERT INTO historico_producao_vendas (data, produto_nome, qtd_produzida, qtd_vendida, qtd_perda, empresa_id)
    VALUES (d, 'Bolo de Chocolate', ROUND(base_bolo_chocolate), ROUND(vendido), ROUND(perda), 'demo-padaria-001');

    -- PÃO DE FORMA
    base_pao_forma := 60 * variacao + (random() * 15 - 7);
    vendido := base_pao_forma * (0.82 + random() * 0.14);
    IF i < 3 THEN
      base_pao_forma := base_pao_forma * 1.35;
      vendido := base_pao_forma * 0.60;
    END IF;
    perda := GREATEST(0, base_pao_forma - vendido);
    
    INSERT INTO historico_producao_vendas (data, produto_nome, qtd_produzida, qtd_vendida, qtd_perda, empresa_id)
    VALUES (d, 'Pão de Forma', ROUND(base_pao_forma), ROUND(vendido), ROUND(perda), 'demo-padaria-001');

    -- BISCOITO AMANTEIGADO
    base_biscoito := 40 * variacao + (random() * 10 - 5);
    vendido := base_biscoito * (0.88 + random() * 0.10);
    perda := GREATEST(0, base_biscoito - vendido);
    
    INSERT INTO historico_producao_vendas (data, produto_nome, qtd_produzida, qtd_vendida, qtd_perda, empresa_id)
    VALUES (d, 'Biscoito Amanteigado', ROUND(base_biscoito), ROUND(vendido), ROUND(perda), 'demo-padaria-001');

    -- CROISSANT
    base_croissant := 35 * variacao + (random() * 8 - 4);
    vendido := base_croissant * (0.75 + random() * 0.20);
    perda := GREATEST(0, base_croissant - vendido);
    
    INSERT INTO historico_producao_vendas (data, produto_nome, qtd_produzida, qtd_vendida, qtd_perda, empresa_id)
    VALUES (d, 'Croissant', ROUND(base_croissant), ROUND(vendido), ROUND(perda), 'demo-padaria-001');

  END LOOP;
END $$;
