# Plano de Testes — Bastion CRM
**Tipo:** Manual
**Ambiente:** localhost:3000 + Supabase Remoto
**Escopo:** Todos os módulos
**Gerado por:** @qa (Quinn)
**Data:** 2026-04-01

---

## Dados de Teste Globais

```
URL Base: http://localhost:3000

USUÁRIO ADMIN
  Email: carlos@dentalgrowth.com.br
  Senha: 123456
  Role:  admin

CLIENTE DE TESTE A (já existe no banco)
  ID:            cccccccc-0000-0000-0000-000000000001
  Razão Social:  Clínica Dental Growth
  CNPJ:          12.345.678/0001-90
  Status:        ativo

CLIENTE DE TESTE B (criar durante os testes)
  Razão Social:  Odonto Prime Ltda
  Nome Fantasia: Odonto Prime
  CNPJ:          98.765.432/0001-11
  Segmento:      solo
  Porte:         pequeno
  Email:         contato@odontoprime.com.br
  Telefone:      (11) 99999-8888
  CEP:           01310-100
  Logradouro:    Av. Paulista
  Número:        1000
  Bairro:        Bela Vista
  Cidade:        São Paulo
  UF:            SP

PRODUTO DE TESTE
  Nome:          Site + SEO Pro
  Tipo:          recorrente
  Periodicidade: mensal
  Valor Padrão:  R$ 1.500,00
  Custo Base:    R$ 300,00
  Categoria:     (criar: "Marketing Digital")

OFERTA DE TESTE
  Nome:          Plano Anual
  Valor:         R$ 1.350,00
  Carência:      3 meses
  Multa:         10%
  Reajuste:      IPCA
  Renovação:     automática

SEGUNDO USUÁRIO (para testar convite)
  Email:         operacional@dentalgrowth.com.br
  Role:          operacional
```

---

## Legenda de Status

| Símbolo | Significado |
|---------|-------------|
| ⬜ | Não executado |
| ✅ | Passou |
| ❌ | Falhou |
| ⚠️ | Passou com ressalvas |

---

## MÓDULO 1 — Autenticação

### TC-AUTH-001 — Login com credenciais válidas
**Pré-condição:** Servidor rodando em localhost:3000
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar `http://localhost:3000` | Redireciona para `/login` |
| 2 | Preencher Email: `carlos@dentalgrowth.com.br` | Campo preenchido |
| 3 | Preencher Senha: `123456` | Campo preenchido (oculto) |
| 4 | Clicar em **Entrar** | Redireciona para `/dashboard` |
| 5 | Verificar nome do usuário na topbar | Exibe "Carlos" ou nome cadastrado |

---

### TC-AUTH-002 — Login com credenciais inválidas
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar `/login` | Página de login exibida |
| 2 | Preencher Email: `carlos@dentalgrowth.com.br` | Campo preenchido |
| 3 | Preencher Senha: `senhaerrada` | Campo preenchido |
| 4 | Clicar em **Entrar** | Mensagem "Email ou senha incorretos" |
| 5 | Verificar que permanece em `/login` | Não houve redirecionamento |

---

### TC-AUTH-003 — Logout
**Pré-condição:** Usuário autenticado
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Clicar em **Sair** na topbar | Redireciona para `/login` |
| 2 | Tentar acessar `/dashboard` diretamente | Redireciona para `/login` |
| 3 | Fazer login novamente | Acesso restaurado |

---

### TC-AUTH-004 — Proteção de rotas
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Sem autenticação, acessar `/dashboard` | Redirect para `/login` |
| 2 | Sem autenticação, acessar `/clientes` | Redirect para `/login` |
| 3 | Sem autenticação, acessar `/financeiro` | Redirect para `/login` |

---

## MÓDULO 2 — Dashboard

### TC-DASH-001 — Carregamento dos KPIs
**Pré-condição:** Autenticado como admin
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar `/dashboard` | Página carrega sem erro |
| 2 | Verificar card "Total de Clientes" | Número >= 0 exibido |
| 3 | Verificar card "MRR" | Valor em R$ exibido |
| 4 | Verificar card "Receita neste mês" | Valor em R$ exibido |
| 5 | Verificar card "Clientes Inadimplentes" | Número >= 0 exibido |
| 6 | Verificar card "Contratos Vencendo" | Número >= 0 exibido |
| 7 | Verificar gráfico MRR histórico | Gráfico de linha renderizado (12 meses) |
| 8 | Verificar tabela "Top Clientes por MRR" | Lista de clientes carregada |
| 9 | Verificar tabela "Últimas Atividades" | Eventos exibidos |
| 10 | Verificar ausência de erros no console | Console sem erros em vermelho |

---

## MÓDULO 3 — Clientes

### TC-CLI-001 — Listar clientes
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar `/clientes` | Tabela de clientes carregada |
| 2 | Verificar colunas: Nome, Segmento, Porte, Responsável, Contato, MRR | Todas colunas visíveis |
| 3 | Verificar "Dental Growth" na lista | Cliente de teste A presente |

---

### TC-CLI-002 — Criar novo cliente
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Clicar em **Novo Cliente** | Drawer/modal abre |
| 2 | Preencher Razão Social: `Odonto Prime Ltda` | Campo preenchido |
| 3 | Preencher Nome Fantasia: `Odonto Prime` | Campo preenchido |
| 4 | Preencher CNPJ: `98.765.432/0001-11` | Campo preenchido |
| 5 | Selecionar Segmento: `solo` | Opção selecionada |
| 6 | Selecionar Porte: `pequeno` | Opção selecionada |
| 7 | Preencher Email do decisor: `contato@odontoprime.com.br` | Campo preenchido |
| 8 | Preencher CEP: `01310-100` | Campo preenchido |
| 9 | Preencher Logradouro: `Av. Paulista` | Campo preenchido |
| 10 | Preencher Número: `1000` | Campo preenchido |
| 11 | Preencher Bairro: `Bela Vista` | Campo preenchido |
| 12 | Preencher Cidade: `São Paulo` | Campo preenchido |
| 13 | Selecionar UF: `SP` | Opção selecionada |
| 14 | Clicar em **Salvar** | Drawer fecha, cliente aparece na lista |
| 15 | Verificar código gerado (CLI-XXXXX) | Código sequencial atribuído |
| 16 | Verificar status inicial do cliente | Status `contrato_pendente` |

---

### TC-CLI-003 — Editar dados do cliente
**Pré-condição:** Cliente "Odonto Prime" criado
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Clicar no cliente "Odonto Prime" | Abre perfil do cliente |
| 2 | Ir para aba **Dados** | Aba de dados exibida |
| 3 | Alterar Nome Fantasia para `Odonto Prime Plus` | Campo alterado |
| 4 | Clicar em **Salvar** | Dados atualizados, confirmação exibida |
| 5 | Recarregar a página | Nome fantasia persiste como `Odonto Prime Plus` |

---

### TC-CLI-004 — Adicionar contato ao cliente
**Pré-condição:** No perfil do cliente "Odonto Prime"
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na aba **Dados**, localizar seção Contatos | Seção de contatos visível |
| 2 | Clicar em **Adicionar Contato** | Formulário de contato abre |
| 3 | Preencher Nome: `Dr. João Silva` | Campo preenchido |
| 4 | Preencher Cargo: `Sócio-Proprietário` | Campo preenchido |
| 5 | Preencher Email: `joao@odontoprime.com.br` | Campo preenchido |
| 6 | Preencher WhatsApp: `(11) 99999-7777` | Campo preenchido |
| 7 | Marcar **Contato Principal** | Checkbox marcado |
| 8 | Clicar em **Salvar** | Contato aparece na lista |
| 9 | Verificar badge "Principal" no contato | Badge visível |

---

### TC-CLI-005 — Definir contato como principal
**Pré-condição:** Cliente com 2+ contatos
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Adicionar segundo contato: `Dra. Maria Santos` | Contato criado |
| 2 | Clicar em **Definir como Principal** no segundo contato | Ação executada |
| 3 | Verificar que "Dra. Maria Santos" tem badge Principal | Badge movido |
| 4 | Verificar que "Dr. João Silva" perdeu o badge | Badge removido |

---

### TC-CLI-006 — Registrar NPS
**Pré-condição:** No perfil do cliente
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Ir para aba **NPS** | Aba NPS exibida |
| 2 | Clicar em **Registrar NPS** | Formulário abre |
| 3 | Selecionar score: `9` | Score selecionado |
| 4 | Preencher Observação: `Cliente muito satisfeito com os resultados` | Campo preenchido |
| 5 | Clicar em **Salvar** | Registro aparece no histórico |
| 6 | Verificar score 9 exibido com data atual | Dados corretos |
| 7 | Verificar impacto no Health Score | Health score atualizado |

---

### TC-CLI-007 — Alterar responsável do cliente
**Pré-condição:** Autenticado como admin, perfil do cliente aberto
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Clicar em **Alterar Responsável** na barra de ações | Modal/seletor abre |
| 2 | Selecionar outro usuário disponível | Usuário selecionado |
| 3 | Confirmar alteração | Responsável atualizado |
| 4 | Verificar histórico de responsáveis na aba Dados | Mudança registrada com data |

---

### TC-CLI-008 — Health Score
**Pré-condição:** Cliente com NPS registrado, faturas e contratos
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar perfil de cliente com dados completos | Perfil carregado |
| 2 | Verificar badge de Health Score no topo | Score 0-100 exibido |
| 3 | Verificar breakdown: Pontualidade (50%), NPS (30%), Longevidade (20%) | Componentes visíveis |

---

## MÓDULO 4 — Produtos, Categorias e Ofertas

### TC-PROD-001 — Criar categoria
**Pré-condição:** Autenticado como admin, acessar `/produtos`
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Ir para aba **Categorias** | Lista de categorias exibida |
| 2 | Clicar em **Nova Categoria** | Campo/formulário abre |
| 3 | Digitar: `Marketing Digital` | Nome digitado |
| 4 | Confirmar criação | Categoria aparece na lista |

---

### TC-PROD-002 — Criar produto
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Ir para aba **Catálogo** | Lista de produtos exibida |
| 2 | Clicar em **Novo Produto** | Drawer abre |
| 3 | Preencher Nome: `Site + SEO Pro` | Campo preenchido |
| 4 | Selecionar Tipo: `recorrente` | Opção selecionada |
| 5 | Selecionar Periodicidade: `mensal` | Opção selecionada |
| 6 | Preencher Valor Padrão: `1500` | Campo preenchido |
| 7 | Preencher Custo Base: `300` | Campo preenchido |
| 8 | Selecionar Categoria: `Marketing Digital` | Categoria selecionada |
| 9 | Clicar em **Salvar** | Produto criado, aparece no catálogo |
| 10 | Verificar slug gerado (ex: `site-seo-pro`) | Slug automático |

---

### TC-PROD-003 — Criar oferta para produto
**Pré-condição:** Produto "Site + SEO Pro" criado
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Clicar no produto "Site + SEO Pro" | Detalhes/ofertas exibidos |
| 2 | Clicar em **Nova Oferta** | Drawer de oferta abre |
| 3 | Preencher Nome: `Plano Anual` | Campo preenchido |
| 4 | Preencher Valor: `1350` | Campo preenchido |
| 5 | Preencher Carência: `3` meses | Campo preenchido |
| 6 | Preencher Multa: `10` % | Campo preenchido |
| 7 | Preencher Reajuste: `IPCA` | Campo preenchido |
| 8 | Marcar **Renovação Automática** | Checkbox marcado |
| 9 | Clicar em **Salvar** | Oferta criada e vinculada ao produto |

---

### TC-PROD-004 — Desativar e reativar produto
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | No catálogo, localizar "Site + SEO Pro" | Produto visível |
| 2 | Clicar em **Desativar** | Status muda para inativo |
| 3 | Verificar produto não disponível para contratação | Produto indisponível |
| 4 | Clicar em **Ativar** | Status volta para ativo |

---

### TC-PROD-005 — Renomear categoria
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na aba Categorias, localizar "Marketing Digital" | Categoria visível |
| 2 | Clicar em **Renomear** | Campo editável |
| 3 | Alterar para: `Marketing e SEO` | Nome alterado |
| 4 | Confirmar | Categoria renomeada |
| 5 | Verificar produto "Site + SEO Pro" com nova categoria | Produto atualizado |

---

## MÓDULO 5 — Contratos

### TC-CONT-001 — Fluxo completo de onboarding (criar → assinar → ativar)
**Pré-condição:** Cliente "Odonto Prime" em status `contrato_pendente`
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Abrir perfil "Odonto Prime", aba **Contratos** | Aviso de sem contrato ativo |
| 2 | Clicar em **Novo Contrato** | Formulário de contrato abre |
| 3 | Selecionar Tipo: `servicos` (ou disponível) | Tipo selecionado |
| 4 | Selecionar Forma de Pagamento: `pix` | Forma selecionada |
| 5 | Clicar em **Criar Contrato** | Contrato criado com número (CON-2026-XXXX) |
| 6 | Verificar status do contrato: `ativo` | Status correto |
| 7 | Clicar em **Assinar Contrato** | Contrato marcado como assinado |
| 8 | Verificar data de assinatura registrada | Data atual exibida |
| 9 | Clicar em **Ativar Cliente** na barra de ações | Status do cliente muda para `ativo` |
| 10 | Verificar badge de status no topo do perfil | Badge "Ativo" exibido |

---

### TC-CONT-002 — Adicionar produto ao contrato
**Pré-condição:** Cliente "Odonto Prime" ativo, contrato ativo
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Ir para aba **Produtos** no perfil do cliente | Lista de produtos vazia |
| 2 | Clicar em **Adicionar Produto** | Modal abre |
| 3 | Selecionar produto: `Site + SEO Pro` | Produto selecionado |
| 4 | Selecionar oferta: `Plano Anual` | Oferta selecionada |
| 5 | Verificar valor preenchido: `R$ 1.350,00` | Valor da oferta exibido |
| 6 | Preencher Data Início: data de hoje | Campo preenchido |
| 7 | Preencher Data Fim: 12 meses à frente | Campo preenchido |
| 8 | Clicar em **Adicionar** | Produto aparece na lista de produtos do cliente |
| 9 | Verificar MRR do cliente atualizado | MRR = R$ 1.350,00 |

---

### TC-CONT-003 — Adicionar produto com valor negociado (gestor)
**Pré-condição:** Autenticado como gestor ou admin
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Clicar em **Adicionar Produto** | Modal abre |
| 2 | Selecionar produto e oferta | Selecionado |
| 3 | Preencher Valor Especial: `1200` | Campo de valor especial visível |
| 4 | Preencher Motivo: `Desconto fidelidade` | Campo obrigatório preenchido |
| 5 | Clicar em **Adicionar** | Produto adicionado com valor negociado |
| 6 | Verificar valor efetivo: R$ 1.200,00 | Valor negociado aplicado |

---

### TC-CONT-004 — Alterar produto (upsell)
**Pré-condição:** Cliente com produto ativo
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na aba Produtos, clicar em **Alterar Produto** | Modal de alteração abre |
| 2 | Selecionar novo produto de maior valor | Produto selecionado |
| 3 | Selecionar tipo: `upsell` | Tipo selecionado |
| 4 | Preencher Motivo: `Upgrade para plano completo` | Campo preenchido |
| 5 | Confirmar alteração | Produto anterior encerrado, novo ativado |
| 6 | Verificar histórico de alterações | Registro de upsell com motivo |

---

### TC-CONT-005 — Renovar data de vencimento do produto
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na lista de produtos do cliente, localizar item ativo | Item visível |
| 2 | Clicar em **Renovar** | Modal de renovação abre |
| 3 | Preencher Nova Data de Fim: 12 meses à frente | Campo preenchido |
| 4 | Preencher Novo Valor (opcional): `1400` | Campo preenchido |
| 5 | Preencher Observação: `Renovação anual 2027` | Campo preenchido |
| 6 | Confirmar renovação | Data atualizada |
| 7 | Verificar histórico de renovações na aba | Registro com data anterior e nova |

---

### TC-CONT-006 — Remover produto do contrato
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na lista de produtos, clicar em **Remover** | Confirmação solicitada |
| 2 | Confirmar remoção | Produto removido da lista |
| 3 | Verificar MRR atualizado | MRR reduzido conforme produto removido |

---

## MÓDULO 6 — Financeiro

### TC-FIN-001 — Gerar fatura manualmente
**Pré-condição:** Cliente "Odonto Prime" ativo com produto contratado
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Abrir perfil "Odonto Prime", aba **Financeiro** | Lista de faturas (vazia inicialmente) |
| 2 | Clicar em **Gerar Fatura** | Formulário abre |
| 3 | Preencher Competência: `2026-04` (Abril/2026) | Campo preenchido |
| 4 | Preencher Data de Vencimento: `2026-04-10` | Campo preenchido |
| 5 | Clicar em **Gerar** | Fatura criada com número (FAT-2026-XXXX) |
| 6 | Verificar valor total = R$ 1.350,00 | Valor correto |
| 7 | Verificar status: `pendente` | Status correto |
| 8 | Verificar itens da fatura (breakdown por produto) | Items listados |

---

### TC-FIN-002 — Registrar pagamento total
**Pré-condição:** Fatura gerada com status `pendente`
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na lista de faturas, localizar fatura pendente | Fatura visível |
| 2 | Clicar em **Registrar Pagamento** | Formulário abre |
| 3 | Preencher Data de Pagamento: hoje | Campo preenchido |
| 4 | Preencher Valor: `1350` | Valor total |
| 5 | Selecionar Forma: `pix` | Forma selecionada |
| 6 | Clicar em **Salvar** | Pagamento registrado |
| 7 | Verificar status da fatura: `pago` | Status atualizado |
| 8 | Verificar valor pago = R$ 1.350,00 | Valor correto |

---

### TC-FIN-003 — Registrar pagamento parcial
**Pré-condição:** Gerar nova fatura pendente
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Gerar nova fatura para competência `2026-05` | Fatura criada |
| 2 | Clicar em **Registrar Pagamento** | Formulário abre |
| 3 | Preencher Valor: `700` (parcial) | Campo preenchido |
| 4 | Selecionar Forma: `boleto` | Forma selecionada |
| 5 | Clicar em **Salvar** | Pagamento registrado |
| 6 | Verificar status da fatura: `parcial` | Status correto |
| 7 | Verificar saldo devedor: `R$ 650,00` | Saldo calculado |
| 8 | Registrar segundo pagamento: `650` | Pagamento complementar |
| 9 | Verificar status da fatura: `pago` | Fatura quitada |

---

### TC-FIN-004 — Estornar pagamento
**Pré-condição:** Fatura com pagamento registrado
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Localizar pagamento confirmado | Pagamento visível |
| 2 | Clicar em **Estornar** | Confirmação solicitada |
| 3 | Confirmar estorno | Pagamento marcado como `estornado` |
| 4 | Verificar status da fatura volta para `pendente` ou `parcial` | Status revertido |

---

### TC-FIN-005 — Criar acordo de inadimplência
**Pré-condição:** Cliente com fatura(s) em atraso
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na aba Financeiro, clicar em **Criar Acordo** | Drawer de acordo abre |
| 2 | Selecionar Tipo: `inadimplencia` | Tipo selecionado |
| 3 | Preencher Descrição: `Acordo parcelamento Abril/2026` | Campo preenchido |
| 4 | Preencher Valor Original: `1350` | Campo preenchido |
| 5 | Preencher Valor Acordado: `1200` (desconto) | Campo preenchido |
| 6 | Definir 3 parcelas de `R$ 400,00` | Parcelas configuradas |
| 7 | Clicar em **Criar Acordo** | Acordo criado |
| 8 | Verificar 3 novas faturas de parcela geradas | Faturas criadas |
| 9 | Verificar fatura original com status `em_acordo` | Status correto |
| 10 | Verificar evento na timeline do cliente | Evento "Acordo criado" registrado |

---

### TC-FIN-006 — Dashboard financeiro
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar `/financeiro` | Dashboard financeiro carregado |
| 2 | Verificar KPI "MRR Total" | Valor em R$ exibido |
| 3 | Verificar KPI "LTV Acumulado" | Valor em R$ exibido |
| 4 | Verificar KPI "Em Aberto" | Total de faturas pendentes |
| 5 | Verificar KPI "Recebido (mês)" | Total do mês atual |
| 6 | Verificar tabela "Cobranças em Aberto" | Faturas pendentes/atrasadas listadas |
| 7 | Verificar tabela "Últimos Pagamentos" | Pagamentos recentes listados |

---

### TC-FIN-007 — Exportar CSV de inadimplentes
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | No dashboard financeiro, clicar em **Exportar Inadimplentes** | Download iniciado |
| 2 | Abrir arquivo CSV | Arquivo abre corretamente |
| 3 | Verificar colunas: cliente, fatura, valor, vencimento, dias em atraso | Colunas presentes |
| 4 | Verificar dados dos clientes inadimplentes | Dados corretos |

---

### TC-FIN-008 — Pontualidade e métricas do cliente
**Pré-condição:** Cliente com histórico de faturas (pagas e atrasadas)
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na aba Financeiro do cliente, localizar grid de pontualidade | Grid mensal exibido |
| 2 | Verificar meses com pagamento no prazo (verde) | Meses corretos marcados |
| 3 | Verificar meses com atraso (vermelho/amarelo) | Marcação correta |
| 4 | Verificar card de métricas: LTV, CAC, Tenure | Valores calculados |

---

## MÓDULO 7 — Documentos

### TC-DOC-001 — Upload de documento
**Pré-condição:** Perfil do cliente aberto, aba Documentos
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Ir para aba **Documentos** | Lista de documentos (vazia ou com existentes) |
| 2 | Clicar em **Upload** | Seletor de arquivo abre |
| 3 | Selecionar arquivo PDF (< 10MB) | Arquivo selecionado |
| 4 | Preencher Nome: `Contrato Assinado Abril 2026` | Campo preenchido |
| 5 | Selecionar Tipo: `contrato` | Tipo selecionado |
| 6 | Clicar em **Enviar** | Documento aparece na lista |
| 7 | Verificar nome, tipo e data de upload | Dados corretos |

---

### TC-DOC-002 — Download de documento
**Pré-condição:** Documento uploaded
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na lista de documentos, clicar em **Baixar/Visualizar** | Download inicia ou aba abre |
| 2 | Verificar arquivo correto baixado | Arquivo intacto |
| 3 | Tentar novamente após 1 hora (signed URL expira em 1h) | Nova URL gerada automaticamente |

---

### TC-DOC-003 — Upload com arquivo inválido
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Tentar upload de arquivo > 10MB | Erro "arquivo muito grande" |
| 2 | Tentar upload de tipo não permitido (ex: .exe) | Erro de tipo inválido |

---

### TC-DOC-004 — Deletar documento
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na lista de documentos, clicar em **Excluir** | Confirmação solicitada |
| 2 | Confirmar exclusão | Documento removido da lista e do storage |
| 3 | Verificar que link antigo não funciona | URL retorna 404 |

---

### TC-DOC-005 — Gerar documento a partir de modelo
**Pré-condição:** Modelo DOCX cadastrado na biblioteca de modelos
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na aba Documentos, clicar em **Gerar Documento** | Modal de geração abre |
| 2 | Selecionar modelo disponível | Modelo selecionado |
| 3 | Clicar em **Gerar** | Documento gerado com variáveis substituídas |
| 4 | Verificar documento na lista com nome gerado automaticamente | Documento listado |
| 5 | Baixar e verificar variáveis substituídas (nome_cliente, cnpj, etc) | Dados do cliente presentes |

---

## MÓDULO 8 — Usuários

### TC-USR-001 — Listar usuários (admin)
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar `/usuarios` | Tabela de usuários carregada |
| 2 | Verificar colunas: Nome, Email, Role, Status | Colunas visíveis |
| 3 | Verificar usuário admin listado | Usuário presente |

---

### TC-USR-002 — Convidar novo usuário
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Clicar em **Convidar Usuário** | Formulário abre |
| 2 | Preencher Email: `operacional@dentalgrowth.com.br` | Campo preenchido |
| 3 | Selecionar Role: `operacional` | Role selecionada |
| 4 | Clicar em **Enviar Convite** | Convite enviado, usuário aparece na lista |

---

### TC-USR-003 — Alterar role de usuário
**Pré-condição:** Segundo usuário convidado
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Na tabela, localizar `operacional@dentalgrowth.com.br` | Usuário visível |
| 2 | Clicar em **Alterar Role** | Seletor de role abre |
| 3 | Selecionar: `gestor` | Role selecionada |
| 4 | Confirmar | Role atualizada na tabela |

---

### TC-USR-004 — Desativar usuário
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Clicar em **Desativar** no segundo usuário | Confirmação solicitada |
| 2 | Confirmar | Status muda para inativo |
| 3 | Verificar que admin não pode se auto-desativar | Ação bloqueada para própria conta |

---

### TC-USR-005 — Acesso negado para não-admin
**Pré-condição:** Logar como usuário com role `operacional`
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Tentar acessar `/usuarios` | Acesso negado ou redirecionamento |
| 2 | Tentar acessar `/produtos` | Acesso negado ou redirecionamento |
| 3 | Verificar sidebar não exibe itens restritos | Itens admin ocultos |

---

## MÓDULO 9 — Configurações

### TC-CFG-001 — Ver configurações pessoais
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar `/configuracoes` | Página de configurações carregada |
| 2 | Verificar seção "Minha Conta" com email, role, status | Dados corretos |

---

### TC-CFG-002 — Alterar parâmetros da agência (admin)
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Localizar seção "Parâmetros da Agência" | Formulário visível para admin |
| 2 | Alterar "Dias para gerar fatura": `5` | Campo alterado |
| 3 | Alterar "Dias até suspensão": `45` | Campo alterado |
| 4 | Alterar "Alerta renovação (dias)": `20` | Campo alterado |
| 5 | Alterar "Multa por atraso": `2` % | Campo alterado |
| 6 | Alterar "Juros diário": `0.033` % | Campo alterado |
| 7 | Clicar em **Salvar** | Configurações salvas com sucesso |
| 8 | Recarregar a página | Valores persistem |

---

### TC-CFG-003 — Configurar notificações de email
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Localizar seção "Notificações" | Lista de eventos exibida |
| 2 | Ativar evento "Fatura Vencendo" | Toggle ativado |
| 3 | Definir antecedência: `3` dias | Campo preenchido |
| 4 | Ativar evento "Fatura Vencida" | Toggle ativado |
| 5 | Ativar evento "Renovação Próxima" | Toggle ativado |
| 6 | Clicar em **Salvar** | Configurações de notificação salvas |

---

## MÓDULO 10 — Contratos (Listagem Consolidada)

### TC-CONT-LIST-001 — Listagem e KPIs de contratos
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar `/contratos` | Dashboard de contratos carregado |
| 2 | Verificar KPI "Total de Contratos" | Número >= 0 |
| 3 | Verificar KPI "Contratos Ativos" | Número correto |
| 4 | Verificar KPI "Vencendo em 30 dias" | Número correto |
| 5 | Verificar tabela com cliente, tipo, datas, valor, status | Tabela exibida |
| 6 | Verificar destaque visual para contratos vencendo em < 7 dias | Estilo diferente aplicado |

---

## MÓDULO 11 — Modelos de Documento

### TC-MOD-001 — Biblioteca de modelos
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Acessar `/modelos` | Biblioteca de modelos carregada |
| 2 | Verificar modelos listados por tipo | Agrupados por tipo |
| 3 | Admin: verificar opções de gerenciamento | Botões de gerenciar visíveis |
| 4 | Clicar em **Baixar** em um modelo | Download do template original |

---

## MÓDULO 12 — Fluxos Críticos End-to-End

### TC-E2E-001 — Onboarding completo de novo cliente
**Status:** ⬜
**Descrição:** Fluxo completo desde criação até primeiro pagamento

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Criar cliente "Clínica Sorriso Perfeito" | Cliente criado (`contrato_pendente`) |
| 2 | Adicionar contato principal | Contato criado |
| 3 | Criar contrato (pix) | Contrato criado |
| 4 | Adicionar produto "Site + SEO Pro" / Oferta "Plano Anual" | Produto adicionado |
| 5 | Assinar contrato | Contrato assinado |
| 6 | Ativar cliente | Status = `ativo` |
| 7 | Gerar fatura competência atual | Fatura criada (valor correto) |
| 8 | Registrar pagamento total via pix | Fatura = `pago` |
| 9 | Verificar MRR no dashboard aumentou | MRR atualizado |
| 10 | Registrar NPS 8 | NPS registrado |
| 11 | Verificar Health Score > 0 | Score calculado |
| 12 | Verificar timeline de eventos do cliente | Todos os eventos registrados |

---

### TC-E2E-002 — Fluxo de inadimplência e acordo
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Gerar 2 faturas em atraso para cliente existente | Faturas pendentes criadas |
| 2 | Verificar cliente aparece em "Cobranças em Aberto" no financeiro | Listado |
| 3 | Criar acordo de inadimplência com 2 parcelas | Acordo criado |
| 4 | Verificar faturas originais como `em_acordo` | Status correto |
| 5 | Verificar 2 novas faturas de parcela | Faturas de parcela criadas |
| 6 | Registrar pagamento da parcela 1 | Parcela 1 = `pago` |
| 7 | Não pagar parcela 2 | Parcela 2 = `pendente` |
| 8 | Marcar acordo como quebrado | Status = `quebrado` |
| 9 | Verificar evento na timeline | Evento registrado |

---

### TC-E2E-003 — Ciclo de upsell com renovação
**Status:** ⬜

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Cliente com produto ativo de R$ 1.350/mês | Estado inicial |
| 2 | Alterar produto para novo com valor maior (upsell) | Produto alterado |
| 3 | Verificar histórico de alterações com tipo `upsell` | Registro criado |
| 4 | Renovar data de vencimento + reajuste de valor | Data e valor atualizados |
| 5 | Verificar histórico de renovações | Renovação registrada |
| 6 | Gerar fatura com novo valor | Fatura com valor atualizado |
| 7 | Verificar MRR do cliente atualizado | MRR correto |

---

## MÓDULO 13 — Validações e Permissões por Role

### TC-ROLE-001 — Permissões de operacional
**Pré-condição:** Criar usuário operacional e logar com ele
**Status:** ⬜

| # | Ação | Permitido? | Resultado Esperado |
|---|------|-----------|-------------------|
| 1 | Criar cliente | ✅ Sim | Cliente criado |
| 2 | Editar dados do cliente | ✅ Sim | Dados salvos |
| 3 | Adicionar contato | ✅ Sim | Contato adicionado |
| 4 | Registrar NPS | ✅ Sim | NPS registrado |
| 5 | Registrar pagamento | ✅ Sim | Pagamento salvo |
| 6 | Upload de documento | ✅ Sim | Upload realizado |
| 7 | Criar produto (catálogo) | ❌ Não | Acesso negado |
| 8 | Convidar usuário | ❌ Não | Acesso negado |
| 9 | Alterar configurações agência | ❌ Não | Acesso negado |
| 10 | Adicionar produto com valor especial | ❌ Não | Campo não visível |

---

### TC-ROLE-002 — Permissões de gestor
**Status:** ⬜

| # | Ação | Permitido? | Resultado Esperado |
|---|------|-----------|-------------------|
| 1 | Adicionar produto com valor especial | ✅ Sim | Campo visível e funcional |
| 2 | Alterar produto (upsell/downsell) | ✅ Sim | Ação disponível |
| 3 | Criar acordo | ✅ Sim | Acordo criado |
| 4 | Aprovar desconto | ✅ Sim | Desconto aprovado |
| 5 | Convidar usuário | ❌ Não | Acesso negado |
| 6 | Alterar role de usuário | ❌ Não | Acesso negado |

---

## Checklist Final de Regressão

Após executar todos os testes, verificar:

- [ ] Nenhum erro 500 no console do servidor
- [ ] Nenhum erro em vermelho no console do browser
- [ ] Todos os KPIs do dashboard com valores coerentes
- [ ] MRR reflete corretamente os contratos ativos
- [ ] Health Score calculado para todos os clientes com dados suficientes
- [ ] Signed URLs de documentos funcionando
- [ ] Exportação CSV de inadimplentes íntegra
- [ ] Timeline de eventos dos clientes completa
- [ ] Audit trail consistente nas operações críticas

---

## Registro de Execução

| Data | Executor | Versão | TCs Passaram | TCs Falharam | Observações |
|------|----------|--------|-------------|-------------|-------------|
| | | | | | |

---

*Plano gerado por @qa (Quinn) — Bastion CRM v1.0 — 2026-04-01*
