// ─────────────────────────────────────────────────────────────────────────────
// database.ts — Tipos gerados do Supabase + aliases de conveniência
// Gerado via: supabase gen types typescript --linked --schema public
// Atualizar com: npx supabase gen types typescript --linked --schema public > src/types/database.generated.ts
// ─────────────────────────────────────────────────────────────────────────────

// Re-exporta os tipos base gerados automaticamente
export type { Database, Json, Tables, Enums } from './database.generated'

import type { Tables, Enums } from './database.generated'

// ── Auth / Profiles ──────────────────────────────────────────────────────────
export type UserRole = Enums<'user_role'>

export type Profile = Tables<'profiles'>

// ── Agências ─────────────────────────────────────────────────────────────────
export type Agencia = Tables<'agencias'>
export type SistemaConfig = Tables<'sistema_config'>

// ── Pessoas & Clientes ───────────────────────────────────────────────────────
export type ClienteSegmento = Enums<'cliente_segmento'>
export type ClientePorte = Enums<'cliente_porte'>
export type ClienteStatus = Enums<'cliente_status'>

export type Cliente = Tables<'clientes'>
export type Pessoa = Tables<'pessoas'>
export type ClienteSocio = Tables<'cliente_socios'>
export type ContatoCliente = Tables<'contatos_cliente'>
export type NpsRegistro = Tables<'nps_registros'>
export type HistoricoResponsavel = Tables<'historico_responsaveis'>
export type EventoCliente = Tables<'eventos_cliente'>

// ── Catálogo de Produtos ─────────────────────────────────────────────────────
export type ProdutoAgencia = Tables<'produtos_agencia'>
export type ProdutoOferta = Tables<'produto_ofertas'>

// ── Contratos ────────────────────────────────────────────────────────────────
export type ContratoStatus = Enums<'contrato_status'>
export type ProdutoStatus = Enums<'produto_status'>

export type Contrato = Tables<'contratos'>
export type ContratoItem = Tables<'contrato_itens'>

/** View: contrato_itens JOIN contratos JOIN produtos_agencia (com joins de cliente) */
export type ProdutoContratadoView = Tables<'produtos_contratados'>

export type Renovacao = Tables<'renovacoes'>

/**
 * @deprecated Use ContratoItem (contrato_itens) ou ProdutoContratadoView
 */
export type ProdutoContratado = ContratoItem

// ── Documentos ───────────────────────────────────────────────────────────────
export type DocumentoTipo = Enums<'documento_tipo'>
export type Documento = Tables<'documentos_cliente'>

// ── Financeiro ───────────────────────────────────────────────────────────────
export type PagamentoForma = Enums<'pagamento_forma'>
export type PagamentoStatus = Enums<'pagamento_status'>

export type Fatura = Tables<'faturas'>
export type FaturaItem = Tables<'fatura_itens'>
export type Pagamento = Tables<'pagamentos'>
export type Acordo = Tables<'acordos'>
export type AcordoOrigem = Tables<'acordo_origens'>
export type AcordoParcela = Tables<'acordo_parcelas'>
export type CreditoCliente = Tables<'creditos_cliente'>
export type CreditoAplicacao = Tables<'credito_aplicacoes'>

// ── Notificações ─────────────────────────────────────────────────────────────
export type NotificacaoConfig = Tables<'notificacoes_config'>
export type NotificacaoLog = Tables<'notificacoes_log'>

// ── Auditoria & Jobs ─────────────────────────────────────────────────────────
export type AuditLog = Tables<'audit_log'>
export type JobLog = Tables<'jobs_log'>
