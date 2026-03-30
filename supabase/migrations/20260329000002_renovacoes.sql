-- Migration: criar tabela renovacoes para histórico de renovações de contrato_itens
-- Story 3.2 — Histórico de Renovações

CREATE TABLE IF NOT EXISTS renovacoes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id        UUID        NOT NULL REFERENCES agencias(id),
  contrato_item_id  UUID        NOT NULL REFERENCES contrato_itens(id),
  data_anterior     DATE        NOT NULL,
  data_nova         DATE        NOT NULL,
  valor_anterior    NUMERIC(12,2),
  valor_novo        NUMERIC(12,2),
  observacoes       TEXT,
  renovado_por      UUID        NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_renovacoes_item ON renovacoes (contrato_item_id);
CREATE INDEX IF NOT EXISTS idx_renovacoes_agencia ON renovacoes (agencia_id);

ALTER TABLE renovacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON renovacoes
  USING (agencia_id = fn_agencia_id());
