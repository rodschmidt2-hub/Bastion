// ── Auth / Profiles ─────────────────────────────────────────
export type UserRole = 'admin' | 'gestor' | 'comercial' | 'financeiro' | 'operacional'

export interface Profile {
  id: string
  agencia_id: string
  nome: string
  email: string
  role: UserRole
  nivel_desconto: number
  ativo: boolean
  created_at: string
  updated_at: string
}

// ── Clientes ─────────────────────────────────────────────────
export type ClienteSegmento = 'solo' | 'rede' | 'especialidade'
export type ClientePorte = 'pequeno' | 'medio' | 'grande'
export type ClienteStatus = 'ativo' | 'inadimplente' | 'cancelado' | 'pausado'

export interface Cliente {
  id: string
  nome: string
  cnpj: string | null
  segmento: ClienteSegmento | null
  porte: ClientePorte | null
  endereco_logradouro: string | null
  endereco_cidade: string | null
  endereco_estado: string | null
  endereco_cep: string | null
  resp_financeiro_nome: string | null
  resp_financeiro_email: string | null
  resp_financeiro_telefone: string | null
  decisor_nome: string | null
  decisor_email: string | null
  decisor_telefone: string | null
  responsavel_interno_id: string | null
  status: ClienteStatus
  observacoes: string | null
  created_at: string
  updated_at: string
  responsavel_interno?: Pick<Profile, 'id' | 'nome' | 'email'> | null
}

// ── Produtos ─────────────────────────────────────────────────
export interface ProdutoAgencia {
  id: string
  nome: string
  descricao: string | null
  valor_base: number | null
  categoria: string | null
  ativo: boolean
  created_at: string
}

export type ProdutoStatus = 'ativo' | 'pausado' | 'cancelado'

export interface ProdutoContratado {
  id: string
  cliente_id: string
  produto_agencia_id: string | null
  nome: string
  valor_mensal: number
  data_inicio: string
  data_fim: string | null
  status: ProdutoStatus
  observacoes: string | null
  created_at: string
  updated_at: string
}

// ── Contratos ────────────────────────────────────────────────
export type ContratoStatus = 'ativo' | 'pausado' | 'cancelado' | 'em_renovacao' | 'encerrado'

export interface Contrato {
  id: string
  cliente_id: string
  tipo: string
  data_inicio: string
  data_fim: string | null
  valor: number | null
  status: ContratoStatus
  documento_url: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

// ── Pagamentos ───────────────────────────────────────────────
export type PagamentoForma = 'pix' | 'boleto' | 'cartao' | 'transferencia' | 'outro'
export type PagamentoStatus = 'confirmado' | 'pendente' | 'estornado'

export interface Pagamento {
  id: string
  cliente_id: string
  data: string
  valor: number
  forma: PagamentoForma
  referencia: string | null
  status: PagamentoStatus
  observacoes: string | null
  created_by: string | null
  created_at: string
}

// ── Documentos ───────────────────────────────────────────────
export type DocumentoTipo = 'contrato' | 'procuracao' | 'autorizacao' | 'nota_fiscal' | 'outro'

export interface Documento {
  id: string
  cliente_id: string
  nome: string
  tipo: DocumentoTipo
  storage_path: string
  tamanho_bytes: number | null
  created_by: string | null
  created_at: string
}

// ── Histórico de responsáveis ─────────────────────────────────
export interface HistoricoResponsavel {
  id: string
  agencia_id: string
  cliente_id: string
  responsavel_anterior_id: string | null
  responsavel_novo_id: string | null
  alterado_por_id: string | null
  created_at: string
  responsavel_anterior?: Pick<Profile, 'nome' | 'email'> | null
  responsavel_novo?: Pick<Profile, 'nome' | 'email'> | null
  alterado_por?: Pick<Profile, 'nome' | 'email'> | null
}
