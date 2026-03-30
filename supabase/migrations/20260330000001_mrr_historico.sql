-- Migration: mrr_historico table (Story 5.3)
CREATE TABLE IF NOT EXISTS mrr_historico (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id        UUID           NOT NULL REFERENCES agencias(id),
  competencia       TEXT           NOT NULL,  -- YYYY-MM
  mrr               NUMERIC(12,2)  NOT NULL,
  arr               NUMERIC(12,2)  NOT NULL,
  clientes_ativos   INTEGER        NOT NULL,
  custo_total       NUMERIC(12,2),
  margem_percentual NUMERIC(5,2),
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE (agencia_id, competencia)
);

ALTER TABLE mrr_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON mrr_historico
  USING (agencia_id = fn_agencia_id());

CREATE POLICY "tenant_insert" ON mrr_historico
  FOR INSERT WITH CHECK (agencia_id = fn_agencia_id());

CREATE POLICY "tenant_update" ON mrr_historico
  FOR UPDATE USING (agencia_id = fn_agencia_id());

-- nota_financeira for clients (Story 5.2)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nota_financeira TEXT;
