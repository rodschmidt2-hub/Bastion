-- ================================================================
-- MIGRATION: historico_responsaveis
-- Rastreia trocas de responsável interno por cliente
-- Story 2.4 — Responsável Interno
-- ================================================================

CREATE TABLE IF NOT EXISTS historico_responsaveis (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id              UUID        NOT NULL REFERENCES agencias(id),
  cliente_id              UUID        NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  responsavel_anterior_id UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  responsavel_novo_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  alterado_por_id         UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para consulta por cliente ordenada por data
CREATE INDEX idx_historico_resp_cliente
  ON historico_responsaveis(cliente_id, created_at DESC);

-- RLS: isolamento por agência
ALTER TABLE historico_responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historico_resp_select" ON historico_responsaveis
  FOR SELECT USING (agencia_id = fn_agencia_id());

CREATE POLICY "historico_resp_insert" ON historico_responsaveis
  FOR INSERT WITH CHECK (agencia_id = fn_agencia_id());
