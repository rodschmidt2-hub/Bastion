-- Migration: Story B — Valor Especial em contrato_itens + atualização da view

-- 1. Campos de negociação especial
ALTER TABLE contrato_itens
  ADD COLUMN IF NOT EXISTS valor_especial         NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS valor_especial_motivo  TEXT,
  ADD COLUMN IF NOT EXISTS valor_especial_por     UUID REFERENCES auth.users(id);

-- 2. Atualiza view: valor_efetivo prioriza valor_especial se preenchido
CREATE OR REPLACE VIEW produtos_contratados AS
  SELECT
    ci.id,
    ci.agencia_id,
    ci.contrato_id,
    ci.produto_id,
    ci.oferta_id,
    ci.valor_negociado,
    ci.valor_especial,
    COALESCE(
      ci.valor_especial,
      CASE
        WHEN ci.desconto_percentual IS NOT NULL
          THEN ROUND(ci.valor_negociado * (1 - ci.desconto_percentual / 100), 2)
        WHEN ci.desconto_valor_fixo IS NOT NULL
          THEN ci.valor_negociado - ci.desconto_valor_fixo
        ELSE ci.valor_negociado
      END
    )                             AS valor_efetivo,
    ci.status                     AS item_status,
    ci.data_inicio_item,
    ci.data_fim_item,
    c.cliente_id,
    c.status                      AS contrato_status,
    cl.dia_vencimento,
    c.forma_pagamento,
    p.nome                        AS produto_nome,
    p.categoria,
    p.tipo                        AS produto_tipo,
    p.periodicidade,
    p.custo_base
  FROM contrato_itens ci
  JOIN contratos c        ON c.id  = ci.contrato_id
  JOIN clientes cl        ON cl.id = c.cliente_id
  JOIN produtos_agencia p ON p.id  = ci.produto_id
  WHERE c.status     = 'ativo'
    AND c.deleted_at IS NULL
    AND (ci.data_fim_item IS NULL OR ci.data_fim_item > CURRENT_DATE);

COMMENT ON VIEW produtos_contratados
  IS 'Itens de contrato ativos. valor_efetivo prioriza valor_especial (negociação restrita), depois descontos, depois valor_negociado.';
