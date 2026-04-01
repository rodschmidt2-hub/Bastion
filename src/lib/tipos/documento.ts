export const VARIAVEIS_TEMPLATE: Record<string, string> = {
  nome_cliente:           'Razão social do cliente',
  nome_fantasia:          'Nome fantasia',
  cnpj:                   'CNPJ',
  codigo_cliente:         'Código do cliente',
  cidade:                 'Cidade',
  uf:                     'Estado (UF)',
  cep:                    'CEP',
  logradouro:             'Logradouro',
  numero:                 'Número',
  bairro:                 'Bairro',
  responsavel_nome:       'Responsável da agência',
  decisor_nome:           'Nome do decisor',
  decisor_email:          'E-mail do decisor',
  resp_financeiro_nome:   'Responsável financeiro',
  resp_financeiro_email:  'E-mail financeiro',
  contato_email:          'E-mail principal do contato',
  contato_telefone:       'Telefone principal do contato',
  produto_nome:           'Nome do produto ativo',
  valor_mensal:           'Valor mensal (MRR)',
  data_hoje:              'Data de hoje (dd/mm/aaaa)',
  mes_atual:              'Mês e ano por extenso',
  ano_atual:              'Ano atual',
}

export interface ModeloItem {
  id:       string
  nome:     string
  tipo:     string
  descricao: string | null
}
