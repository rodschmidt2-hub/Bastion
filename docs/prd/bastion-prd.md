# PRD — Bastion
## Sistema Interno de Gestão de Clientes — Agência de Marketing/Vendas para Clínicas Odontológicas

**Versão:** 1.0
**Data:** 2026-03-27
**Status:** Aprovado para desenvolvimento

---

## 1. Visão Geral

Bastion é o sistema interno de gestão de clientes da agência. Controla o ciclo de vida completo de cada cliente: cadastro, produtos contratados, contratos, pagamentos, renovações e métricas financeiras (MRR, LTV, churn).

**Modelo de referência:** Agência de serviços recorrentes (MRR) com clientes B2B, ciclo longo, mix de produtos, renovações periódicas e múltiplos responsáveis internos.

**Benchmarks aplicados:** HubSpot Companies, Salesforce Accounts, Chargebee Subscriptions, Conta Azul, ChartMogul.

---

## 2. Usuários

| Role | Descrição |
|------|-----------|
| **Admin** | Acesso total ao sistema. Gerencia usuários, catálogo de produtos, todos os clientes. |
| **Gestor** | Acesso apenas aos clientes onde é responsável interno. |

---

## 3. Épicos e Requisitos Funcionais

### ÉPICO 1 — Cadastro e Ciclo de Vida do Cliente

> **Regras de gestão de acesso definidas (27/03/2026):**
> - Status Ativo/Inativo: visual + registro interno de suspensão de entregas
> - Desativação manual: gestor clica "Desativar" com motivo obrigatório
> - Desativação automática: inadimplência ≥ X dias (configurável) OU todos os contratos cancelados
> - Reativação: sempre manual — quitação de dívida não reverte automaticamente
> - Toda transição de status gera registro no histórico: quem, quando, motivo

| ID | Requisito | Prioridade | Status |
|----|-----------|-----------|--------|
| FR-01 | Cadastro completo: razão social, CNPJ, endereço, segmento, porte | Must | ✅ Feito |
| FR-02 | Contatos múltiplos por cliente com papel: decisor, financeiro, operacional | Must | ❌ Pendente |
| FR-03 | Status do cliente: Ativo / Inativo / Inadimplente / Cancelado | Must | ❌ Atualizar |
| FR-03b | Ativação/desativação manual pelo gestor com motivo obrigatório | Must | ❌ Pendente |
| FR-03c | Desativação automática: inadimplência ≥ X dias (X configurável nas Configurações) | Must | ❌ Pendente |
| FR-03d | Desativação automática: todos os contratos do cliente marcados como Cancelado | Must | ❌ Pendente |
| FR-03e | Reativação sempre manual — quitação de fatura não reverte status automaticamente | Must | ❌ Pendente |
| FR-04 | Histórico de status: data, motivo e usuário responsável por cada transição | Must | ❌ Pendente |
| FR-05 | Responsável interno atribuído com histórico de trocas | Must | ✅ Feito |
| FR-05b | Custo de aquisição do cliente (`custo_aquisicao`, decimal, nullable): campo manual, preparado para integração futura | Should | ❌ Pendente |
| FR-06 | Score de saúde do cliente baseado em pagamentos e engajamento | Should | ❌ Pendente |
| FR-07 | Tags livres para segmentação | Could | ❌ Pendente |

### ÉPICO 2 — Catálogo de Produtos e Serviços

| ID | Requisito | Prioridade | Status |
|----|-----------|-----------|--------|
| FR-08 | Catálogo central: nome, categoria, descrição, valor base | Must | ✅ Básico feito |
| FR-09 | Tipo de produto: recorrente (MRR) ou pontual (one-time) | Must | ❌ Pendente |
| FR-10 | Periodicidade: mensal, trimestral, semestral, anual | Must | ❌ Pendente |
| FR-11 | Variantes/planos por produto (ex: Basic / Pro / Enterprise) | Should | ❌ Pendente |
| FR-12 | Valor base é referência — contratação pode ter valor negociado | Must | ✅ Feito |
| FR-13 | Produto ativado/desativado sem afetar contratações existentes | Must | ✅ Feito |
| FR-14 | Página admin de gerenciamento do catálogo | Must | ❌ Pendente |
| FR-14b | Custo base por produto no catálogo (`custo_base`, decimal, nullable) | Must | ❌ Pendente |

### ÉPICO 3 — Produtos Contratados (Subscriptions)

| ID | Requisito | Prioridade | Status |
|----|-----------|-----------|--------|
| FR-15 | Contratação: cliente + produto + valor negociado + data início | Must | ✅ Básico feito |
| FR-16 | Status: Ativo / Pausado / Cancelado / Em renovação | Must | ✅ Feito |
| FR-17 | Data de início e data de término (ou open-end para recorrente) | Must | ✅ Feito |
| FR-18 | Alerta automático: contratação vence em 60/30/7 dias | Must | ❌ Pendente |
| FR-19 | Ciclo de renovação: registro de renovação manual com histórico | Must | ❌ Pendente |
| FR-20 | Histórico completo de renovações por produto contratado | Must | ❌ Pendente |
| FR-21 | MRR calculado em tempo real: soma produtos ativos | Must | ✅ Feito |
| FR-22 | Cliente pode ter múltiplas contratações do mesmo produto | Must | ✅ Feito |

### ÉPICO 4 — Contratos

| ID | Requisito | Prioridade | Status |
|----|-----------|-----------|--------|
| FR-23 | Contrato vinculado ao cliente: tipo, valor, vigência | Must | ✅ Feito |
| FR-24 | Status: Ativo / Em renovação / Encerrado / Cancelado | Must | ✅ Feito |
| FR-25 | Upload do documento assinado (PDF) | Must | ✅ Feito |
| FR-26 | Alerta de vencimento: 60/30/7 dias | Must | ✅ Alertas básicos feitos |
| FR-27 | Contrato pode abranger múltiplos produtos contratados | Should | ❌ Pendente |
| FR-28 | Histórico de versões e aditivos | Could | ❌ Pendente |

### ÉPICO 5 — Financeiro e Cobranças

> **Regras de negócio definidas (27/03/2026):**
> - Faturamento unificado: 1 fatura por cliente por ciclo, somando todos os contratos ativos do mesmo vencimento
> - Sem pró-rata: novo serviço entra na próxima fatura cheia
> - Sistema 100% interno: cliente não acessa o Bastion, recebe boleto por fora (WhatsApp/email)

| ID | Requisito | Prioridade | Status |
|----|-----------|-----------|--------|
| FR-29 | Registro manual de pagamentos: data, valor, forma, referência | Must | ✅ Feito |
| FR-30 | Status de pagamento: Confirmado / Pendente / Estornado | Must | ✅ Feito |
| FR-31 | Fatura unificada gerada automaticamente por cliente/ciclo: soma todos os contratos ativos com mesmo vencimento | Must | ❌ Pendente |
| FR-31b | Fatura tem breakdown por contrato: Contrato A R$ X + Contrato B R$ Y = Total R$ Z | Must | ❌ Pendente |
| FR-31c | Novo contrato sem pró-rata: entra na próxima fatura cheia | Must | ❌ Pendente |
| FR-32 | Marcação automática de inadimplência: fatura pendente > 5 dias úteis após vencimento | Must | ❌ Pendente |
| FR-33 | LTV: soma histórica de pagamentos confirmados por cliente | Must | ✅ Feito |
| FR-34 | Ticket médio por cliente | Should | ❌ Pendente |
| FR-35 | Receita mensal histórica (MRR mês a mês) | Should | ❌ Pendente |
| FR-36 | Exportação CSV do extrato financeiro por cliente | Could | ❌ Pendente |

### ÉPICO 6 — Dashboard e Métricas

> **Regras de cálculo definidas (27/03/2026):**
> - **NRR** = (MRR_início + Expansion − Contraction − Churn MRR) ÷ MRR_início × 100. Referência: NRR > 100% = crescimento orgânico da base.
> - **Expansion MRR** = MRR adicional de clientes ativos no período anterior (novos produtos + reajustes positivos)
> - **Contraction MRR** = MRR perdido de clientes que continuam mas reduziram (cancelamento parcial de produto)
> - **CAC** = campo `custo_aquisicao` por cliente (manual, FR-05b). CAC médio = Σ custos ÷ novos clientes no período
> - **LTV/CAC** = LTV médio ÷ CAC médio. Benchmark mínimo saudável: ≥ 3×
> - **Payback Period** = CAC ÷ Ticket Médio Mensal. Benchmark: ≤ 12 meses
> - **Taxa de Renovação** = contratos/produtos renovados ÷ contratos/produtos que venceram no período × 100
> - **Receita por Segmento/Responsável** = agrupamento de MRR por campo já existente no cadastro

| ID | Requisito | Prioridade | Status |
|----|-----------|-----------|--------|
| FR-37 | MRR total em tempo real | Must | ✅ Feito |
| FR-37b | ARR total: MRR × 12, exibido ao lado do MRR no dashboard | Must | ❌ Pendente |
| FR-38 | LTV total acumulado | Must | ✅ Feito |
| FR-39 | Clientes inadimplentes com valor em aberto | Must | ✅ Básico feito |
| FR-40 | Contratos a vencer em 30 dias | Must | ✅ Feito |
| FR-41 | Churn de clientes: quantidade de cancelados no período + % sobre base inicial | Must | ❌ Pendente |
| FR-41b | Churn de MRR: valor de MRR perdido no período (cancelados + contraction) | Must | ❌ Pendente |
| FR-41c | Expansion MRR: MRR adicional vindo de clientes já existentes (novos produtos + reajustes) | Must | ❌ Pendente |
| FR-41d | Contraction MRR: MRR perdido de clientes que reduziram serviço sem cancelar | Must | ❌ Pendente |
| FR-41e | NRR (Net Revenue Retention): calculado automaticamente a partir de MRR + expansion + contraction + churn MRR | Must | ❌ Pendente |
| FR-42 | Novos clientes no mês | Should | ❌ Pendente |
| FR-42b | Taxa de Renovação: % de contratos/produtos renovados sobre os que venceram no período | Must | ❌ Pendente |
| FR-43 | MRR breakdown por produto/categoria | Should | ❌ Pendente |
| FR-43b | Concentração de receita por cliente: % do MRR total que cada cliente representa | Should | ❌ Pendente |
| FR-43c | Receita recorrente vs pontual: separação do MRR do período por tipo de produto | Should | ❌ Pendente |
| FR-43d | Margem de Contribuição total: Σ(valor_contratado − custo_base) de todos os produtos ativos | Should | ❌ Pendente |
| FR-43e | Receita por segmento de cliente (Solo / Rede / Especialidade): MRR agrupado por campo existente | Should | ❌ Pendente |
| FR-43f | Receita por responsável interno: MRR agrupado por gestor atribuído | Should | ❌ Pendente |
| FR-43g | CAC médio: média de `custo_aquisicao` dos clientes adquiridos no período | Should | ❌ Pendente |
| FR-43h | LTV/CAC ratio: LTV médio ÷ CAC médio, com semáforo visual (< 3× vermelho, 3–5× âmbar, > 5× verde) | Should | ❌ Pendente |
| FR-43i | Payback Period médio: CAC médio ÷ Ticket Médio Mensal, em meses | Should | ❌ Pendente |
| FR-43j | Tempo médio de cliente (tenure): média de meses de vida dos clientes ativos | Should | ❌ Pendente |
| FR-44 | Projeção de receita próximos 3 meses | Could | ❌ Pendente |

### ÉPICO 7 — Documentos

| ID | Requisito | Prioridade | Status |
|----|-----------|-----------|--------|
| FR-45 | Upload de documentos por cliente: PDF, imagem | Must | ✅ Feito |
| FR-46 | Tipos: Contrato, Procuração, Autorização, NF, Outro | Must | ✅ Feito |
| FR-47 | Download com URL assinada temporária | Must | ✅ Feito |
| FR-48 | Exclusão com confirmação | Must | ✅ Feito |

### ÉPICO 8 — Usuários e Permissões

| ID | Requisito | Prioridade | Status |
|----|-----------|-----------|--------|
| FR-49 | Role Admin: acesso total | Must | ✅ Feito |
| FR-50 | Role Gestor: acesso apenas aos próprios clientes | Must | ✅ Feito |
| FR-51 | Convite por email com link de ativação | Must | ✅ Feito |
| FR-52 | Ativar/desativar usuário sem deletar | Must | ✅ Feito |
| FR-53 | Log de atividades por usuário | Could | ❌ Pendente |

### ÉPICO 9 — Visão Financeira Avançada do Cliente

> Benchmark: Chargebee Customer Detail, ChartMogul Customer View, Stripe Customer Dashboard

| ID | Requisito | Prioridade | Status |
|----|-----------|-----------|--------|
| FR-55 | Timeline financeira unificada: faturas + pagamentos + renovações + reajustes em ordem cronológica reversa | Must | ❌ Pendente |
| FR-56 | Indicador de dias em atraso e valor total em aberto visível em destaque no topo da tab financeiro | Must | ❌ Pendente |
| FR-57 | Banner "Próxima Fatura": valor total, data de vencimento e breakdown por contrato (always visible) | Must | ❌ Pendente |
| FR-58 | Resumo anual: total pago no ano atual vs ano anterior com variação percentual | Should | ❌ Pendente |
| FR-59 | Gráfico de MRR mensal do cliente: barras mês a mês dos últimos 7 meses | Should | ❌ Pendente |
| FR-60 | Grid de pontualidade de pagamento por mês (verde/âmbar/vermelho) com score percentual | Should | ❌ Pendente |
| FR-61 | Histórico de reajustes: valor anterior → valor novo + percentual de variação por renovação | Should | ❌ Pendente |
| FR-62 | Campo de notas financeiras internas por cliente (texto livre, não visível ao cliente) | Could | ❌ Pendente |
| FR-63 | Margem de Contribuição por cliente: Σ(valor_contratado − custo_base) dos produtos ativos, exibida em destaque na tab Financeiro | Should | ❌ Pendente |
| FR-63b | ARR do cliente: MRR do cliente × 12, exibido ao lado do MRR na tab Financeiro | Should | ❌ Pendente |
| FR-63c | CAC do cliente: campo `custo_aquisicao` exibido na tab Financeiro (editável pelo admin) | Should | ❌ Pendente |
| FR-63d | LTV/CAC ratio individual: LTV do cliente ÷ CAC do cliente, com semáforo visual | Should | ❌ Pendente |
| FR-63e | Payback period individual: CAC ÷ Ticket Médio Mensal do cliente, em meses | Should | ❌ Pendente |
| FR-63f | Tenure do cliente: meses desde o cadastro até hoje, exibido no resumo | Should | ❌ Pendente |

### ÉPICO 10 — NPS e Satisfação do Cliente

> **Regras definidas (27/03/2026):**
> - Registro manual pelo gestor: nota 0–10 + data + observação
> - Histórico ao longo do tempo — mais de uma entrada por cliente
> - Fase 2: integração com pesquisa externa (WhatsApp/formulário) — não escopo agora

| ID | Requisito | Prioridade | Status |
|----|-----------|-----------|--------|
| FR-64 | Registro de NPS/CSAT por cliente: nota 0–10 + data + responsável + observação (texto livre) | Must | ❌ Pendente |
| FR-65 | Histórico de NPS por cliente em ordem cronológica reversa | Must | ❌ Pendente |
| FR-66 | Score NPS atual em destaque no perfil do cliente (última nota registrada + variação) | Should | ❌ Pendente |
| FR-67 | NPS médio global no dashboard (média de todas as últimas notas por cliente) | Should | ❌ Pendente |
| FR-68 | Clientes com NPS baixo (≤ 6) listados em alerta no dashboard | Should | ❌ Pendente |

---

## 4. Requisitos Não Funcionais

| ID | Requisito |
|----|-----------|
| NFR-01 | Tempo de carregamento de página < 2s |
| NFR-02 | RLS no Supabase — dados isolados por role |
| NFR-03 | Deploy automático via Vercel |
| NFR-04 | Mobile-friendly (responsivo) |
| NFR-05 | Autenticação via Supabase Auth com sessão persistente |

---

## 5. Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 App Router + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui |
| Backend | Supabase (Postgres + Auth + Storage) |
| Deploy | Vercel |
| Auth | Supabase Auth + SSR |

---

## 6. Modelo de Dados — Entidades Principais

```
profiles                → usuários internos (admin/gestor)

clientes                → empresas gerenciadas [EXPANDIR]
  └─ campos novos: custo_aquisicao (decimal, nullable — FR-05b)

contatos_cliente        → contatos múltiplos por cliente (FR-02) [NOVO]

produtos_agencia        → catálogo com tipo + periodicidade + custo_base [EXPANDIR]
  └─ campos: nome, categoria, tipo (recorrente|pontual), periodicidade,
             valor_base, custo_base (nullable — FR-14b), ativo

produtos_contratados    → subscriptions com ciclo de renovação [EXPANDIR]
  └─ base para Expansion MRR e Contraction MRR (queries sobre histórico de valor)

renovacoes              → histórico de renovações [NOVO]
  └─ base para Taxa de Renovação e Histórico de Reajustes

contratos               → documentos de contrato

faturas                 → fatura unificada por cliente/ciclo [NOVO — FR-31]
  └─ campos: cliente_id, valor_total, data_vencimento, status, periodo_ref

fatura_itens            → breakdown da fatura por contrato [NOVO — FR-31b]
  └─ campos: fatura_id, contrato_id, valor

pagamentos              → registros financeiros (vinculados à fatura)

documentos              → arquivos no Storage

historico_status        → transições de status do cliente [NOVO — FR-04]
  └─ campos: cliente_id, status_anterior, status_novo, motivo, tipo (manual|auto), usuario_id

historico_responsaveis  → trocas de responsável

notas_financeiras       → notas internas por cliente (FR-62) [NOVO]

nps_cliente             → histórico de NPS/CSAT por cliente [NOVO — FR-64/65]
  └─ campos: cliente_id, nota (0–10), data, registrado_por, observacao
```

### KPIs derivados — sem tabela nova, só query

| KPI | Fonte de dados |
|-----|---------------|
| ARR | MRR × 12 |
| LTV/CAC ratio | `pagamentos` (LTV) ÷ `clientes.custo_aquisicao` (CAC) |
| Payback Period | `clientes.custo_aquisicao` ÷ MRR do cliente |
| NRR | `produtos_contratados` histórico + `renovacoes` |
| Expansion MRR | `produtos_contratados`: novos produtos + reajustes positivos em clientes existentes |
| Contraction MRR | `produtos_contratados`: cancelamentos parciais (status Cancelado sem churn total) |
| Taxa de Renovação | `renovacoes` ÷ contratações vencidas no período |
| Concentração de Receita | MRR por cliente ÷ MRR total |
| Receita por Segmento | MRR agrupado por `clientes.segmento` |
| Receita por Responsável | MRR agrupado por `clientes.responsavel_id` |
| Tenure | `clientes.created_at` → meses desde cadastro |
| Margem de Contribuição | Σ(`produtos_contratados.valor` − `produtos_agencia.custo_base`) |

---

## 7. Backlog Priorizado — Próximas Entregas

### Sprint 1 — Fundação de Produtos (alto impacto, base para tudo)
- Story 2.1 — Expandir catálogo: tipo (recorrente/pontual) + periodicidade + **custo_base** (FR-14b)
- Story 2.2 — Página admin de gestão do catálogo
- Story 3.1 — Produtos contratados com periodicidade e ciclo de renovação
- Story 3.2 — Histórico de renovações

### Sprint 2 — Motor Financeiro (elimina trabalho manual)
- Story 5.1 — Fatura unificada por cliente/ciclo + inadimplência automática (FR-31, FR-31b, FR-31c, FR-32)
- Story 5.2 — Visão financeira avançada do cliente (FR-55 a FR-63b)
- Story 5.3 — MRR histórico mês a mês

### Sprint 3 — Completude do Cliente
- Story 1.1 — Contatos múltiplos por cliente
- Story 1.2 — Gestão de acesso: Ativar/Desativar com histórico de status (FR-03b a FR-04)
- Story 6.1 — Dashboard financeiro completo: ARR, Churn cliente + MRR, NRR, Expansion MRR, Contraction MRR, Taxa de Renovação (FR-37b, FR-41, FR-41b–e, FR-42b)
- Story 6.2 — Dashboard analítico: MRR breakdown, concentração, recorrente vs pontual, margem, segmento, responsável (FR-43 a FR-43j)
- Story 10.1 — NPS/CSAT por cliente: registro manual + histórico (FR-64, FR-65, FR-66)

### Sprint 4 — Polimento e Inteligência
- Story 1.3 — Health score do cliente
- Story 5.4 — Exportação CSV financeiro
- Story 5.5 — Visão CAC/LTV/Payback/Tenure por cliente na tab Financeiro (FR-63c a FR-63f)
- Story 6.3 — Dashboard NPS global + alertas (FR-67, FR-68)
- Story 6.4 — Projeção de receita (FR-44)
