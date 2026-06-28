# 🚀 Walkthrough de Homologação — Integra

O protótipo **Integra** foi totalmente implementado, testado e compilou localmente com **zero erros**. Este guia explica os passos para colocar o sistema no ar e apresenta o roteiro ideal de demonstração para encantar os jurados.

---

## 🛠️ Passo 1: Configuração do Banco de Dados (Supabase)

Você precisa rodar o script SQL gerado para criar as tabelas, índices, políticas de RLS e injetar os dados de demonstração.

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard).
2. Selecione o seu projeto (`teuobrovytjotvioqmtp`).
3. No menu lateral esquerdo, clique em **SQL Editor**.
4. Clique em **New query**.
5. Abra o arquivo local [supabase-schema.sql](file:///d:/dev/Fieto/supabase-schema.sql) no seu computador e copie todo o seu conteúdo.
6. Cole o código no painel do Supabase e clique em **Run** (no canto inferior direito).
7. Certifique-se de que a mensagem retornou sucesso. As tabelas estarão prontas e populadas com 90 dias de histórico operacional simulado.

---

## 💻 Passo 2: Executar Localmente

Para rodar e testar o sistema no seu computador:

1. Abra um terminal no diretório do projeto (`d:\dev\Fieto`).
2. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Abra o navegador em [http://localhost:3000](http://localhost:3000).

---

## 🎙️ Roteiro da Demo ao Vivo (Para Impressionar a Banca)

Siga estes passos cronológicos durante o Pitch para mostrar o valor imediato do **Integra**:

### 1. Abertura e Visual Impactante (Home)
*   **Ação**: Mostre a tela inicial. Os jurados serão imediatamente atraídos pelo tema dark sofisticado e com acabamento de vidro (glassmorphism).
*   **O que falar**: *"Este é o Integra, o hub central de combate ao desperdício na panificação. Notem os KPIs consolidados: a Diana já calculou uma economia projetada de R$ X.XXX baseando-se no comportamento recente da nossa padaria, e nos avisa que temos R$ XXX,XX em insumos em risco iminente de vencimento."*

### 2. A Diana Proativa em Ação (Diana Hub)
*   **Ação**: Aponte para o painel esquerdo **"Decisões Proativas da Diana"**. Lá estarão os cards de alerta (ex: "Leite Integral vence em 2 dias").
*   **O que falar**: *"Diferente de sistemas de estoque tradicionais que são passivos, a Diana atua de forma autônoma. Ela monitora as validades e sugere receitas de reaproveitamento locais na hora. Por exemplo, ela nos alerta sobre o vencimento de 30 litros de Leite Integral em 2 dias e sugere produzir Doce de Leite amanhã."*

### 3. Interação com Linguagem Natural
*   **Ação**: Clique na sugestão rápida do chat: *"O que está mais perto de vencer hoje?"* ou digite a pergunta. A Diana responderá em menos de 3 segundos com respostas ultra-curtas e profissionais (máximo de 3 linhas), respeitando a sua persona.
*   **O que falar**: *"O mestre padeiro pode conversar com o sistema de forma natural, até mesmo por voz ou no WhatsApp futuramente. A Diana analisa o inventário e retorna instantaneamente apenas o que é crucial, sem rodeios."*
*   **Ação de Aceite**: Clique no botão **"Aceitar"** do card de alerta de validade do leite. O sistema enviará automaticamente uma mensagem no chat pedindo a receita detalhada, e a Diana expandirá sua resposta listando os ingredientes e modo de preparo.
*   **O que falar**: *"Ao aceitar a sugestão, a Diana nos entrega a receita na hora, convertendo um desperdício financeiro certo em um subproduto lucrativo."*

### 4. Estoque com Semáforo Visual
*   **Ação**: Navegue até a tela **"Estoque"** no menu. Mostre os alertas por cores nas linhas (vermelho para vencidos/críticos, amarelo para atenção, verde para seguros).
*   **O que falar**: *"Aqui temos o controle de validade e rastreabilidade de lote. O semáforo visual dá prioridade imediata ao que precisa ser consumido no dia."*

### 5. Previsão de Demanda Estatística
*   **Ação**: Navegue até a tela **"Previsão"**. Mostre o gráfico de linhas e áreas.
*   **O que falar**: *"Para evitar sobras de balcão (como pão francês amanhecido), nosso algoritmo cruza os 90 dias de histórico e calcula a tendência e sazonalidade. Vejam no gráfico a linha de produção real vs. a área azul de previsão da Diana. No fim de semana, por exemplo, o sistema prevê uma alta de 35% de vendas, evitando que falte produto para os clientes ou que sobre pão no fim do dia."*

---

## ⚡ Deploy Vercel (Opcional)

Se desejar subir um link público estável para compartilhar com os jurados:
1. Instale a CLI do Vercel: `npm install -g vercel`
2. No diretório do projeto, rode: `vercel`
3. Siga as instruções do terminal para vincular sua conta (gratuita).
4. Adicione as variáveis de ambiente `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `GEMINI_API_KEY` nas configurações do projeto na Vercel.
