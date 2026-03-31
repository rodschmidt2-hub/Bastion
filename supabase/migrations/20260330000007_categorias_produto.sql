-- Tabela de categorias de produto gerenciadas por agência
CREATE TABLE IF NOT EXISTS categorias_produto (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id UUID        NOT NULL REFERENCES agencias(id) ON DELETE CASCADE,
  nome       TEXT        NOT NULL,
  ativo      BOOLEAN     NOT NULL DEFAULT TRUE,
  ordem      INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agencia_id, nome)
);

ALTER TABLE categorias_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias_select" ON categorias_produto
  FOR SELECT TO authenticated
  USING (agencia_id = (SELECT agencia_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "categorias_insert" ON categorias_produto
  FOR INSERT TO authenticated
  WITH CHECK (
    agencia_id = (SELECT agencia_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "categorias_update" ON categorias_produto
  FOR UPDATE TO authenticated
  USING (agencia_id = (SELECT agencia_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "categorias_delete" ON categorias_produto
  FOR DELETE TO authenticated
  USING (
    agencia_id = (SELECT agencia_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Seed: migra categorias hardcoded para todas as agências existentes
INSERT INTO categorias_produto (agencia_id, nome, ordem)
SELECT a.id, cats.nome, cats.ordem
FROM agencias a
CROSS JOIN (VALUES
  ('Marketing Digital',   1),
  ('Redes Sociais',       2),
  ('Tráfego Pago',        3),
  ('SEO',                 4),
  ('Site / Landing Page', 5),
  ('Email Marketing',     6),
  ('Gestão de Reputação', 7),
  ('Consultoria',         8),
  ('Outro',               9)
) AS cats(nome, ordem)
ON CONFLICT (agencia_id, nome) DO NOTHING;
