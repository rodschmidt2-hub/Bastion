-- Biblioteca de modelos de documentos da agência
CREATE TABLE IF NOT EXISTS modelos_documento (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id  UUID        NOT NULL REFERENCES agencias(id) ON DELETE CASCADE,
  nome        TEXT        NOT NULL,
  descricao   TEXT,
  tipo        TEXT        NOT NULL
    CHECK (tipo IN ('contrato', 'proposta', 'autorizacao', 'termo', 'outro')),
  arquivo_url TEXT        NOT NULL,
  criado_por  UUID        REFERENCES profiles(id),
  ativo       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE modelos_documento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modelos_select" ON modelos_documento
  FOR SELECT TO authenticated
  USING (agencia_id = (SELECT agencia_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "modelos_insert" ON modelos_documento
  FOR INSERT TO authenticated
  WITH CHECK (
    agencia_id = (SELECT agencia_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "modelos_delete" ON modelos_documento
  FOR DELETE TO authenticated
  USING (
    agencia_id = (SELECT agencia_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Associação de modelo padrão ao produto do catálogo
ALTER TABLE produtos_agencia
  ADD COLUMN IF NOT EXISTS modelo_id UUID REFERENCES modelos_documento(id) ON DELETE SET NULL;

-- Índice para lookup por agência
CREATE INDEX IF NOT EXISTS idx_modelos_agencia ON modelos_documento (agencia_id);
