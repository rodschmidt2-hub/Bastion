-- Migration: Story C — Tabela de alterações de produto (upsell/downsell/lateral)

CREATE TABLE IF NOT EXISTS alteracoes_produto (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id        UUID        NOT NULL,
  cliente_id        UUID        NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  contrato_id       UUID        NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  item_anterior_id  UUID        REFERENCES contrato_itens(id) ON DELETE SET NULL,
  item_novo_id      UUID        REFERENCES contrato_itens(id) ON DELETE SET NULL,
  produto_anterior  TEXT        NOT NULL,
  produto_novo      TEXT        NOT NULL,
  valor_anterior    NUMERIC(12,2) NOT NULL,
  valor_novo        NUMERIC(12,2) NOT NULL,
  delta             NUMERIC(12,2) NOT NULL GENERATED ALWAYS AS (valor_novo - valor_anterior) STORED,
  tipo              TEXT        NOT NULL CHECK (tipo IN ('upsell', 'downsell', 'lateral')),
  motivo            TEXT,
  alterado_por      UUID        REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de busca por cliente
CREATE INDEX IF NOT EXISTS idx_alteracoes_produto_cliente ON alteracoes_produto (cliente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alteracoes_produto_agencia ON alteracoes_produto (agencia_id);

-- RLS
ALTER TABLE alteracoes_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agência vê suas próprias alterações" ON alteracoes_produto
  FOR SELECT USING (
    agencia_id IN (
      SELECT agencia_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Agência insere suas próprias alterações" ON alteracoes_produto
  FOR INSERT WITH CHECK (
    agencia_id IN (
      SELECT agencia_id FROM profiles WHERE id = auth.uid()
    )
  );

COMMENT ON TABLE alteracoes_produto IS 'Histórico de upsell, downsell e trocas laterais de produto por cliente.';
COMMENT ON COLUMN alteracoes_produto.tipo IS 'upsell = novo valor > anterior, downsell = novo valor < anterior, lateral = mesmo valor, produto diferente.';
COMMENT ON COLUMN alteracoes_produto.delta IS 'Diferença de valor (calculada automaticamente: valor_novo - valor_anterior).';
