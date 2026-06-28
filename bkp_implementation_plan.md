# 🏭 Integra — Protótipo MVP para o Desafio Industrial

Sistema de gerenciamento inteligente para indústrias de panificação, com foco em **redução de desperdício de alimentos** através da agente de IA **Diana**.

## Contexto do Desafio

- **Desafio**: Cadeia Produtiva de Alimentos no Tocantins
- **Prazo**: < 1 semana
- **Formato**: Demo ao vivo com protótipo funcional + Diana respondendo em tempo real
- **Nome do Produto**: **Integra**
- **Idioma**: Português (Brasil)
- **LLM**: Google Gemini (API key disponível)

## User Review Required

> [!IMPORTANT]
> **Supabase Setup**: Você precisará criar o projeto Supabase e me fornecer as credenciais (`SUPABASE_URL` e `SUPABASE_ANON_KEY`) para integração. Posso gerar todo o SQL das tabelas + RLS para você rodar no Supabase Dashboard.

> [!IMPORTANT]
> **API Key Gemini**: Precisarei da sua `GEMINI_API_KEY` para configurar a Diana. Ela ficará em um arquivo `.env.local` (nunca commitado).

> [!WARNING]
> **Prazo agressivo (< 1 semana)**: O plano prioriza funcionalidades que **impressionam jurados na demo ao vivo**. Algumas features avançadas (embeddings vetoriais, edge functions agendadas) serão simuladas com lógica simplificada para não comprometer o prazo.

## Open Questions

> [!IMPORTANT]
> **Domínio de deploy**: Quer que eu configure deploy no Vercel (gratuito, rápido, domínio automático) para a demo ao vivo? Ou prefere rodar localmente na apresentação?

> [!NOTE]
> **Logotipo/Ícone**: Quer que eu gere um logotipo para o "Integra" usando IA generativa, ou você já tem algo?

---

## Estratégia para Vencer o Desafio

### O que vai impressionar os jurados:

| Elemento | Impacto | Implementação |
|----------|---------|---------------|
| **Diana respondendo ao vivo** | 🔥 Altíssimo | Chat funcional com Gemini, respostas contextuais sobre estoque |
| **Alertas proativos com urgência visual** | 🔥 Alto | Cards animados com "30kg de leite vencem em 72h" |
| **Dashboard bonito com dados reais** | 🔥 Alto | Gráficos de demanda vs. produção, indicadores de perda |
| **CRUD de estoque com cores de validade** | ✅ Essencial | Semáforo visual (verde/amarelo/vermelho) |
| **Sugestão de receitas de reaproveitamento** | 🔥 Alto | Diana sugere receitas quando detecta excedente |
| **Métricas de impacto quantificadas** | 🔥 Alto | "Economia estimada: R$ X.XXX/mês" |

---

## Proposed Changes

### Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 14 (App Router) + React 18 |
| **Estilo** | CSS puro (design system custom premium) |
| **Backend/DB** | Supabase (PostgreSQL + Auth + RLS) |
| **IA (Diana)** | Google Gemini API via Next.js API Routes |
| **Charts** | Recharts (leve, React-nativo) |
| **Deploy** | Vercel (recomendado) ou local |
| **Ícones** | Lucide React |

---

### Componente 1: Inicialização do Projeto

#### [NEW] Projeto Next.js com estrutura completa

```
d:\dev\Fieto\
├── .env.local                    # Chaves (Supabase + Gemini)
├── next.config.js
├── package.json
├── public/
│   └── logo.svg
├── src/
│   ├── app/
│   │   ├── layout.js             # Layout raiz com sidebar
│   │   ├── page.js               # Dashboard principal (Diana Hub)
│   │   ├── globals.css           # Design system completo
│   │   ├── estoque/
│   │   │   └── page.js           # CRUD de estoque
│   │   ├── producao/
│   │   │   └── page.js           # Histórico de produção/vendas
│   │   ├── previsao/
│   │   │   └── page.js           # Gráficos de previsão de demanda
│   │   └── api/
│   │       ├── diana/
│   │       │   └── chat/route.js # Endpoint da Diana (Gemini)
│   │       └── diana/
│   │           └── alerts/route.js # Geração de alertas proativos
│   ├── components/
│   │   ├── Sidebar.js            # Navegação lateral
│   │   ├── DianaHub.js           # Painel central com chat + cards
│   │   ├── DianaChat.js          # Interface de chat da Diana
│   │   ├── AlertCard.js          # Card de alerta proativo
│   │   ├── EstoqueTable.js       # Tabela de insumos com cores
│   │   ├── EstoqueModal.js       # Modal de entrada/saída
│   │   ├── DemandChart.js        # Gráfico de demanda projetada
│   │   ├── LossIndicator.js      # Indicador de perdas
│   │   └── MetricCard.js         # Card de métrica KPI
│   ├── lib/
│   │   ├── supabase.js           # Cliente Supabase
│   │   ├── diana-soul.js         # Soul file da Diana (prompt system)
│   │   ├── diana-engine.js       # Motor de IA (Gemini integration)
│   │   ├── demand-predictor.js   # Algoritmo de previsão de demanda
│   │   └── recipes-db.js         # Base local de receitas de reaproveitamento
│   └── hooks/
│       ├── useEstoque.js         # Hook para CRUD estoque
│       ├── useProducao.js        # Hook para produção/vendas
│       └── useDiana.js           # Hook para chat com Diana
```

---

### Componente 2: Design System (CSS)

#### [NEW] [globals.css](file:///d:/dev/Fieto/src/app/globals.css)

Design premium com visual dark moderno que vai impressionar:

- **Paleta**: Dark mode principal com gradientes em azul-ciano (#0A0E1A fundo, #00D4FF ciano accent, #FF6B35 laranja para alertas)
- **Tipografia**: Google Fonts — "Inter" para interface, "JetBrains Mono" para dados numéricos
- **Glassmorphism**: Cards com `backdrop-filter: blur()` e bordas sutis
- **Micro-animações**: Transições suaves em hover, cards de alerta com pulse sutil
- **Semáforo de validade**: Verde (>7 dias), Amarelo (3-7 dias), Vermelho (<3 dias), Vermelho pulsante (vencido)
- **Responsivo**: Grid adaptativo para projetor/tela grande na apresentação

---

### Componente 3: Banco de Dados (Supabase SQL)

#### [NEW] Arquivo SQL de setup completo

Criarei um script SQL único para rodar no Supabase SQL Editor contendo:

```sql
-- Tabelas
CREATE TABLE perfis_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  cargo TEXT DEFAULT 'operador',
  empresa_id UUID NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE insumos_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT,
  quantidade_atual NUMERIC NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL,
  lote TEXT,
  data_validade DATE,
  custo_unitario NUMERIC DEFAULT 0,
  empresa_id UUID NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE historico_producao_vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  produto_nome TEXT NOT NULL,
  qtd_produzida NUMERIC DEFAULT 0,
  qtd_vendida NUMERIC DEFAULT 0,
  qtd_perda NUMERIC DEFAULT 0,
  empresa_id UUID NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE diana_conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  papel TEXT NOT NULL, -- 'user' | 'assistant'
  conteudo TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- RLS em todas as tabelas
-- Seed de dados dramáticos para demo
```

- **RLS**: Cada tabela com policy `empresa_id = auth.jwt() ->> 'empresa_id'`
- **Seed data**: Dados simulados de 90 dias com cenários de urgência

---

### Componente 4: Motor da Diana (IA)

#### [NEW] [diana-soul.js](file:///d:/dev/Fieto/src/lib/diana-soul.js)

O **Soul File** da Diana — prompt de sistema que define personalidade e comportamento:

```
Você é Diana, especialista em operações de panificação da plataforma Integra.
Sua missão: eliminar desperdício de alimentos com inteligência preditiva.

REGRAS ABSOLUTAS:
- Máximo 3 linhas por resposta, a menos que o usuário peça detalhes
- Vá direto ao ponto: dados + ação sugerida
- Nunca use saudações longas ("Olá! Como vai?")
- Sempre quantifique: kg, R$, %, dias
- Se houver risco iminente de perda, comece com "⚠️ ALERTA:"
- Sugira receitas de reaproveitamento quando detectar excedentes
```

#### [NEW] [diana-engine.js](file:///d:/dev/Fieto/src/lib/diana-engine.js)

Motor de integração com Gemini API:
- Injeção de contexto operacional (estoque atual, validades, produção recente)
- Histórico de conversa (memória de curto prazo — últimas 20 mensagens)
- Formatação de resposta em texto limpo (pronto para WhatsApp futuro)

#### [NEW] [chat/route.js](file:///d:/dev/Fieto/src/app/api/diana/chat/route.js)

API Route Next.js que:
1. Recebe a mensagem do usuário
2. Consulta dados operacionais do Supabase (estoque, validades, produção)
3. Monta o contexto com soul + dados + histórico
4. Envia para Gemini API
5. Retorna resposta em texto limpo

#### [NEW] [alerts/route.js](file:///d:/dev/Fieto/src/app/api/diana/alerts/route.js)

Endpoint que gera alertas proativos:
1. Consulta insumos com `data_validade <= CURRENT_DATE + 3`
2. Detecta desvios de superprodução no histórico recente
3. Gera cards de alerta com mensagens da Diana no estilo sucinto
4. Retorna array de alertas formatados

---

### Componente 5: Previsão de Demanda

#### [NEW] [demand-predictor.js](file:///d:/dev/Fieto/src/lib/demand-predictor.js)

Algoritmo simplificado (viável no prazo) mas visualmente impressionante:
- **Média móvel ponderada** dos últimos 30 dias (pesos maiores para dias recentes)
- Ajuste por **dia da semana** (padrão semanal — sábado vende mais pão)
- Detecção de **tendência** (crescimento/queda linear)
- Output: projeção para próximos 7 dias com intervalo de confiança

> [!NOTE]
> Para o demo, isso produz gráficos convincentes com dados simulados. Na versão real, poderia ser substituído por um modelo ML mais sofisticado.

---

### Componente 6: Receitas de Reaproveitamento

#### [NEW] [recipes-db.js](file:///d:/dev/Fieto/src/lib/recipes-db.js)

Base local de 15-20 receitas de reaproveitamento comuns em panificação:

| Insumo Excedente | Subproduto | Rendimento |
|-----------------|------------|------------|
| Pão francês amanhecido | Torrada, Farinha de rosca, Pudim de pão | ~95% aproveitamento |
| Leite próximo do vencimento | Doce de leite, Mingau, Iogurte caseiro | ~100% aproveitamento |
| Ovos excedentes | Quindim, Pudim, Massa de bolo | ~100% aproveitamento |
| Frutas maduras | Geleias, Recheios, Smoothies | ~90% aproveitamento |
| Massa de bolo | Cake pops, Trifle, Bolo inglês | ~95% aproveitamento |

---

### Componente 7: Interface — Páginas

#### [NEW] [page.js](file:///d:/dev/Fieto/src/app/page.js) — Dashboard Principal (Diana Hub)

Layout da tela principal:
```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR  │          DIANA HUB (centro)             │
│           │  ┌─────────────────────────────────┐    │
│  🏠 Home  │  │  KPI Cards (Perdas, Economia,   │    │
│  📦 Estoque│  │  Alertas, Score de Eficiência)  │    │
│  🏭 Produção│ └─────────────────────────────────┘    │
│  📊 Previsão│ ┌──────────────┬──────────────────┐   │
│           │  │  ALERTAS      │  CHAT DIANA       │   │
│           │  │  PROATIVOS    │                   │   │
│           │  │  [Card 1] ⚠️  │  > O que vence    │   │
│           │  │  [Card 2] 🔴  │    hoje?          │   │
│           │  │  [Card 3] 🟡  │                   │   │
│           │  │              │  Diana: 3 itens... │   │
│           │  └──────────────┴──────────────────┘   │
│           │  ┌─────────────────────────────────┐    │
│           │  │  GRÁFICO: Demanda vs Produção   │    │
│           │  │  (últimos 14 dias + projeção)    │    │
│           │  └─────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

#### [NEW] [estoque/page.js](file:///d:/dev/Fieto/src/app/estoque/page.js) — Gestão de Estoque

- Tabela completa com filtros e busca
- Colunas: Nome, Categoria, Quantidade, Unidade, Lote, Validade, Status (semáforo)
- Botões de ação: + Entrada, - Saída, ✏️ Editar, 🗑️ Excluir
- Modal de criação/edição com validação
- Barra lateral com resumo: "X itens críticos", "Y itens vencidos"

#### [NEW] [producao/page.js](file:///d:/dev/Fieto/src/app/producao/page.js) — Produção & Vendas

- Formulário rápido de registro diário
- Tabela histórica com indicador visual de perda (qtd_produzida - qtd_vendida)
- Cálculo automático do % de desperdício por produto

#### [NEW] [previsao/page.js](file:///d:/dev/Fieto/src/app/previsao/page.js) — Previsão de Demanda

- Gráfico principal: Linha de produção real vs. linha de previsão (com área de confiança)
- Cards: "Produção sugerida para amanhã" por produto
- Tabela comparativa: Previsto vs. Real vs. Perda

---

## Cronograma de Execução (< 7 dias)

| Dia | Foco | Entregas |
|-----|------|----------|
| **Dia 1** | Setup + Design System + DB | Projeto Next.js, CSS completo, SQL do Supabase, seed data |
| **Dia 2** | Backend + Diana Core | API routes, integração Gemini, soul file, motor de alertas |
| **Dia 3** | Dashboard + Diana Hub | Página principal, KPI cards, chat funcional, cards de alerta |
| **Dia 4** | CRUD Estoque | Tabela, modal, semáforo de validade, filtros |
| **Dia 5** | Previsão + Produção | Gráficos Recharts, algoritmo de demanda, página de produção |
| **Dia 6** | Polish + Demo Data | Animações, dados dramáticos para demo, testes end-to-end |
| **Dia 7** | Deploy + Ensaio | Vercel deploy, ensaio da apresentação com Diana ao vivo |

---

## Verification Plan

### Automated Tests
```bash
npm run build          # Verifica se compila sem erros
npm run lint           # Verifica qualidade do código
```

### Manual Verification
- [ ] Diana responde perguntas sobre estoque em < 3 segundos
- [ ] Alertas proativos aparecem corretamente para insumos vencendo
- [ ] CRUD de estoque funciona com RLS ativo
- [ ] Gráficos de previsão renderizam com dados simulados
- [ ] Interface responsiva em tela grande (projetor)
- [ ] Diana mantém respostas ≤ 3 linhas em modo normal
- [ ] Diana expande resposta quando solicitado ("detalhe", "explique")

### Ensaio de Apresentação
Cenário sugerido para a demo ao vivo:
1. Abrir o dashboard → Mostrar alertas proativos ("30kg de leite vencem em 72h")
2. Perguntar no chat: *"Diana, o que está mais perto de vencer?"*
3. Diana responde com lista e sugere receita de reaproveitamento
4. Registrar uma produção excessiva → Diana detecta e gera alerta de superprodução
5. Navegar para previsão → Mostrar gráfico com projeção de demanda
6. Perguntar: *"Diana, quanto de pão francês devo produzir amanhã?"*
7. Fechar com métricas de impacto: *"Com o Integra, esta panificadora economizaria R$ X.XXX/mês"*
