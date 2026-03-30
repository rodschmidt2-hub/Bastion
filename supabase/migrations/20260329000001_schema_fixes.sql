-- ================================================================
-- BASTION — Schema Fixes v1.1
-- @data-engineer: Dara | 2026-03-29
-- Corrige discrepâncias entre DDL v1.0 e schema real do Bastion:
--   1. Converte colunas TEXT+CHECK para os ENUM types já existentes
--   2. Adiciona colunas ausentes em clientes (porte, contatos, obs)
--   3. Expande user_role para incluir todos os 5 papéis
-- ================================================================

BEGIN;

-- ================================================================
-- 1. USER_ROLE ENUM — adiciona papéis comercial, financeiro, operacional
-- ================================================================
-- ALTER TYPE ADD VALUE não pode rodar dentro de transaction em PG < 12
-- mas Supabase usa PG 15+, então é seguro (idempotente via IF NOT EXISTS)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'comercial';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'financeiro';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operacional';

COMMIT;

-- ALTER TYPE ADD VALUE requer commit antes de usar os novos valores.
-- O restante da migration abre nova transação.

BEGIN;

-- ================================================================
-- 2. CLIENTES — converte status TEXT → cliente_status ENUM
-- ================================================================

-- 2a. Remove o CHECK antigo e o DEFAULT (necessário antes de mudar o tipo)
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_status_check;
ALTER TABLE clientes ALTER COLUMN status DROP DEFAULT;

-- 2b. Mapeia valores legados para os valores corretos do ENUM
--     antes de converter o tipo (seguro mesmo com dados)
UPDATE clientes SET status = 'ativo'   WHERE status = 'inativo';
UPDATE clientes SET status = 'pausado' WHERE status = 'suspenso';

-- 2c. Converte coluna para o tipo ENUM
ALTER TABLE clientes
  ALTER COLUMN status TYPE cliente_status
  USING status::cliente_status;

-- 2d. Restaura o DEFAULT correto
ALTER TABLE clientes
  ALTER COLUMN status SET DEFAULT 'ativo'::cliente_status;


-- ================================================================
-- 3. CLIENTES — converte segmento TEXT → cliente_segmento ENUM
-- ================================================================

ALTER TABLE clientes
  ALTER COLUMN segmento TYPE cliente_segmento
  USING segmento::cliente_segmento;


-- ================================================================
-- 4. CLIENTES — adiciona colunas ausentes
-- ================================================================

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS porte                    cliente_porte,
  ADD COLUMN IF NOT EXISTS observacoes              TEXT,
  ADD COLUMN IF NOT EXISTS resp_financeiro_nome     TEXT,
  ADD COLUMN IF NOT EXISTS resp_financeiro_email    TEXT,
  ADD COLUMN IF NOT EXISTS resp_financeiro_telefone TEXT,
  ADD COLUMN IF NOT EXISTS decisor_nome             TEXT,
  ADD COLUMN IF NOT EXISTS decisor_email            TEXT,
  ADD COLUMN IF NOT EXISTS decisor_telefone         TEXT;

COMMENT ON COLUMN clientes.porte                    IS 'Porte da clínica: pequeno / médio / grande';
COMMENT ON COLUMN clientes.observacoes              IS 'Observações internas (visível apenas para a agência)';
COMMENT ON COLUMN clientes.resp_financeiro_nome     IS 'Responsável financeiro — nome completo';
COMMENT ON COLUMN clientes.resp_financeiro_email    IS 'Responsável financeiro — e-mail';
COMMENT ON COLUMN clientes.resp_financeiro_telefone IS 'Responsável financeiro — WhatsApp/telefone';
COMMENT ON COLUMN clientes.decisor_nome             IS 'Dono / decisor — nome completo';
COMMENT ON COLUMN clientes.decisor_email            IS 'Dono / decisor — e-mail';
COMMENT ON COLUMN clientes.decisor_telefone         IS 'Dono / decisor — WhatsApp/telefone';


-- ================================================================
-- 5. DOCUMENTOS_CLIENTE — converte tipo TEXT → documento_tipo ENUM
-- ================================================================

-- 5a. Normaliza valores legados para os valores corretos do ENUM
ALTER TABLE documentos_cliente DROP CONSTRAINT IF EXISTS documentos_cliente_tipo_check;

UPDATE documentos_cliente SET tipo = 'outro' WHERE tipo IN ('aditivo','proposta','nf');

-- 5b. Converte para ENUM
ALTER TABLE documentos_cliente
  ALTER COLUMN tipo TYPE documento_tipo
  USING tipo::documento_tipo;


-- ================================================================
-- 6. PAGAMENTOS — converte status TEXT → pagamento_status ENUM
-- ================================================================

-- 6a. Drop da policy que referencia a coluna status (obrigatório antes de mudar tipo)
DROP POLICY IF EXISTS "estorno_somente_financeiro" ON pagamentos;

ALTER TABLE pagamentos DROP CONSTRAINT IF EXISTS pagamentos_status_check;
ALTER TABLE pagamentos ALTER COLUMN status DROP DEFAULT;

ALTER TABLE pagamentos
  ALTER COLUMN status TYPE pagamento_status
  USING status::pagamento_status;

ALTER TABLE pagamentos
  ALTER COLUMN status SET DEFAULT 'confirmado'::pagamento_status;

-- 6b. Recria a policy com o tipo correto (ENUM já é comparável com text literal)
CREATE POLICY "estorno_somente_financeiro" ON pagamentos
  AS RESTRICTIVE FOR UPDATE
  WITH CHECK (
    status != 'estornado'::pagamento_status
    OR fn_user_role() IN ('admin','financeiro')
  );


-- ================================================================
-- 7. PAGAMENTOS — converte forma_pagamento TEXT → pagamento_forma ENUM
-- ================================================================

ALTER TABLE pagamentos DROP CONSTRAINT IF EXISTS pagamentos_forma_pagamento_check;

-- Normaliza valores legados
UPDATE pagamentos
  SET forma_pagamento = 'outro'
  WHERE forma_pagamento NOT IN ('pix','boleto','cartao','transferencia','outro');

ALTER TABLE pagamentos
  ALTER COLUMN forma_pagamento TYPE pagamento_forma
  USING forma_pagamento::pagamento_forma;


-- ================================================================
-- 8. CONTRATOS — converte status TEXT → contrato_status ENUM
-- ================================================================

-- 8a. Drop da materialized view e da view que referenciam contratos.status / contrato_itens.status
DROP MATERIALIZED VIEW IF EXISTS mrr_snapshot;
DROP VIEW IF EXISTS produtos_contratados;

ALTER TABLE contratos DROP CONSTRAINT IF EXISTS contratos_status_check;
ALTER TABLE contratos ALTER COLUMN status DROP DEFAULT;

-- 'em_cancelamento' não existe no ENUM (foi renomeado para 'em_renovacao')
-- mapeia para 'pausado' como valor mais próximo para dados legados
UPDATE contratos SET status = 'pausado' WHERE status = 'em_cancelamento';

ALTER TABLE contratos
  ALTER COLUMN status TYPE contrato_status
  USING status::contrato_status;

ALTER TABLE contratos
  ALTER COLUMN status SET DEFAULT 'ativo'::contrato_status;


-- ================================================================
-- 9. CONTRATO_ITENS — adiciona coluna status (ausente no banco real)
-- ================================================================
-- A coluna não existe no banco: usa ADD COLUMN em vez de ALTER TYPE

ALTER TABLE contrato_itens
  ADD COLUMN IF NOT EXISTS status produto_status NOT NULL DEFAULT 'ativo'::produto_status;

COMMENT ON COLUMN contrato_itens.status IS 'Status do item: ativo / pausado / cancelado';


-- ================================================================
-- 10. PROFILES — converte role TEXT → user_role ENUM
--     (agora que adicionamos os 3 novos valores no passo 1)
-- ================================================================

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- Normaliza valor padrão 'operacional' se vier de auth signup
UPDATE profiles SET role = 'operacional' WHERE role NOT IN (
  'admin','gestor','comercial','financeiro','operacional'
);

ALTER TABLE profiles
  ALTER COLUMN role TYPE user_role
  USING role::user_role;

ALTER TABLE profiles
  ALTER COLUMN role SET DEFAULT 'operacional'::user_role;


-- ================================================================
-- 11. Atualiza fn_create_profile_on_signup com DEFAULT correto
-- ================================================================

CREATE OR REPLACE FUNCTION fn_create_profile_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, agencia_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    (NEW.raw_user_meta_data->>'agencia_id')::uuid,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'operacional'::user_role
    )
  );
  RETURN NEW;
END;
$$;


-- ================================================================
-- 12. Recriar VIEW produtos_contratados + MATERIALIZED VIEW mrr_snapshot
-- ================================================================

CREATE OR REPLACE VIEW produtos_contratados AS
  SELECT
    ci.id,
    ci.agencia_id,
    ci.contrato_id,
    ci.produto_id,
    ci.oferta_id,
    ci.valor_negociado,
    CASE
      WHEN ci.desconto_percentual IS NOT NULL
        THEN ROUND(ci.valor_negociado * (1 - ci.desconto_percentual / 100), 2)
      WHEN ci.desconto_valor_fixo IS NOT NULL
        THEN ci.valor_negociado - ci.desconto_valor_fixo
      ELSE ci.valor_negociado
    END                           AS valor_efetivo,
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
  JOIN contratos       c  ON c.id  = ci.contrato_id
  JOIN clientes        cl ON cl.id = c.cliente_id
  JOIN produtos_agencia p  ON p.id  = ci.produto_id
  WHERE c.status     = 'ativo'::contrato_status
    AND c.deleted_at IS NULL
    AND (ci.data_fim_item IS NULL OR ci.data_fim_item > CURRENT_DATE);

COMMENT ON VIEW produtos_contratados
  IS 'Itens de contrato ativos com valor_efetivo após descontos. Base para MRR.';

-- Recria materialized view (foi dropada antes para permitir ALTER TABLE)
CREATE MATERIALIZED VIEW mrr_snapshot AS
  SELECT
    pc.agencia_id,
    DATE_TRUNC('month', NOW())      AS competencia,
    SUM(pc.valor_efetivo)           AS mrr,
    SUM(pc.valor_efetivo * 12)      AS arr,
    COUNT(DISTINCT pc.cliente_id)   AS clientes_ativos,
    SUM(COALESCE(pc.custo_base, 0)) AS custo_total,
    ROUND(
      (1 - SUM(COALESCE(pc.custo_base, 0))
           / NULLIF(SUM(pc.valor_efetivo), 0)
      ) * 100, 2
    )                               AS margem_percentual
  FROM produtos_contratados pc
  WHERE pc.produto_tipo = 'recorrente'
  GROUP BY pc.agencia_id;

CREATE UNIQUE INDEX idx_mrr_snapshot_agencia ON mrr_snapshot (agencia_id);


COMMIT;
