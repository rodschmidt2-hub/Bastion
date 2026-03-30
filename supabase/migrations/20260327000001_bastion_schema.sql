-- ================================================================
-- BASTION — DDL COMPLETO v1.0
-- @data-engineer: Dara | @architect review: Aria
-- 2026-03-27 | PostgreSQL 15+ / Supabase
-- ================================================================


-- ================================================================
-- SEÇÃO 1 — EXTENSÕES
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ================================================================
-- SEÇÃO 2 — FUNÇÕES AUXILIARES
-- ================================================================

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Escreve no audit_log via trigger
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_log (
    tabela, registro_id, operacao,
    dados_anteriores, dados_novos,
    campos_alterados, usuario_id
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END,
    CASE WHEN TG_OP = 'UPDATE' THEN
      ARRAY(
        SELECT key FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key
          AND key NOT IN ('updated_at')
      )
    END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Retorna agencia_id do usuário logado
CREATE OR REPLACE FUNCTION fn_agencia_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT agencia_id FROM profiles WHERE id = auth.uid()
$$;

-- Retorna role do usuário logado
CREATE OR REPLACE FUNCTION fn_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Cria profile automaticamente no Supabase Auth signup
CREATE OR REPLACE FUNCTION fn_create_profile_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, agencia_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    (NEW.raw_user_meta_data->>'agencia_id')::uuid,
    COALESCE(NEW.raw_user_meta_data->>'role', 'operacional')
  );
  RETURN NEW;
END;
$$;


-- ================================================================
-- SEÇÃO 3 — MULTI-TENANCY BASE
-- ================================================================

CREATE TABLE IF NOT EXISTS agencias (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  plano       TEXT        NOT NULL DEFAULT 'basico'
                CHECK (plano IN ('basico','profissional','enterprise')),
  ativo       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE agencias IS 'Tenants do Bastion — uma agência por conta';

CREATE TRIGGER tr_agencias_updated_at
  BEFORE UPDATE ON agencias
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agencia_id      UUID        NOT NULL REFERENCES agencias(id),
  nome            TEXT        NOT NULL,
  email           TEXT        NOT NULL,
  role            TEXT        NOT NULL DEFAULT 'operacional'
                    CHECK (role IN ('admin','gestor','comercial','financeiro','operacional')),
  nivel_desconto  NUMERIC(5,2) NOT NULL DEFAULT 0,
  ativo           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN profiles.nivel_desconto
  IS '% máximo de desconto que este usuário pode aprovar sem escalonamento';

CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE TRIGGER tr_create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_create_profile_on_signup();

CREATE TABLE IF NOT EXISTS sistema_config (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id  UUID        NOT NULL REFERENCES agencias(id),
  chave       TEXT        NOT NULL,
  valor       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agencia_id, chave)
);

COMMENT ON COLUMN sistema_config.chave IS
  'dias_geracao_fatura | alerta_renovacao_dias | dias_suspensao_inadimplencia | '
  'multa_atraso_default | juros_atraso_diario_default | base_proporcional_dias';


-- ================================================================
-- SEÇÃO 4 — CADASTRO
-- ================================================================

CREATE TABLE IF NOT EXISTS pessoas (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id  UUID        NOT NULL REFERENCES agencias(id),
  nome        TEXT        NOT NULL,
  cpf         TEXT,
  email       TEXT,
  telefone    TEXT,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agencia_id, cpf)
);

COMMENT ON TABLE pessoas IS
  'Pessoas físicas: sócios, cônjuges, terceiros. 1 CPF = 1 registro, vinculado a N clínicas via cliente_socios';

CREATE TABLE IF NOT EXISTS clientes (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id           UUID        NOT NULL REFERENCES agencias(id),
  codigo_cliente       TEXT        NOT NULL,
  razao_social         TEXT        NOT NULL,
  nome_fantasia        TEXT,
  cnpj                 TEXT,
  inscricao_municipal  TEXT,
  inscricao_estadual   TEXT,
  regime_tributario    TEXT
    CHECK (regime_tributario IN (
      'simples_nacional','lucro_presumido','lucro_real','mei','autonomo'
    )),
  optante_simples      BOOLEAN     NOT NULL DEFAULT FALSE,
  logradouro           TEXT,
  numero               TEXT,
  complemento          TEXT,
  bairro               TEXT,
  cidade               TEXT,
  uf                   CHAR(2),
  cep                  TEXT,
  dia_vencimento       INTEGER     CHECK (dia_vencimento BETWEEN 1 AND 28),
  status               TEXT        NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo','inativo','suspenso')),
  data_suspensao       DATE,
  dias_ate_suspensao   INTEGER     NOT NULL DEFAULT 30,
  motivo_inativacao    TEXT,
  data_inativacao      DATE,
  responsavel_id       UUID        REFERENCES profiles(id),
  custo_aquisicao      NUMERIC(12,2),
  data_inicio_relac    DATE,
  segmento             TEXT,
  canal_aquisicao      TEXT,
  external_ids         JSONB       NOT NULL DEFAULT '{}',
  deleted_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agencia_id, codigo_cliente),
  UNIQUE (agencia_id, cnpj)
);

COMMENT ON COLUMN clientes.dia_vencimento
  IS 'Definido no 1º contrato. Ancora todos os contratos seguintes.';
COMMENT ON COLUMN clientes.external_ids
  IS 'IDs externos: {"asaas":"cus_x","hubspot":"123"}';

CREATE TRIGGER tr_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS cliente_socios (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id              UUID        NOT NULL REFERENCES agencias(id),
  cliente_id              UUID        NOT NULL REFERENCES clientes(id),
  pessoa_id               UUID        NOT NULL REFERENCES pessoas(id),
  papel                   TEXT        NOT NULL DEFAULT 'socio'
    CHECK (papel IN ('socio','responsavel','terceiro')),
  motivo                  TEXT,
  percentual_participacao NUMERIC(5,2),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cliente_id, pessoa_id, papel)
);

COMMENT ON COLUMN cliente_socios.motivo
  IS 'Ex: "Livro caixa Dr. Marcos", "Holding familiar"';

CREATE TABLE IF NOT EXISTS contatos_cliente (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id    UUID        NOT NULL REFERENCES agencias(id),
  cliente_id    UUID        NOT NULL REFERENCES clientes(id),
  nome          TEXT        NOT NULL,
  cargo         TEXT,
  email         TEXT,
  whatsapp      TEXT,
  is_cobranca   BOOLEAN     NOT NULL DEFAULT FALSE,
  is_nfe        BOOLEAN     NOT NULL DEFAULT FALSE,
  is_principal  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nps_registros (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id      UUID        NOT NULL REFERENCES agencias(id),
  cliente_id      UUID        NOT NULL REFERENCES clientes(id),
  score           INTEGER     NOT NULL CHECK (score BETWEEN 0 AND 10),
  data_registro   DATE        NOT NULL DEFAULT CURRENT_DATE,
  responsavel_id  UUID        REFERENCES profiles(id),
  observacao      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ================================================================
-- SEÇÃO 5 — CATÁLOGO
-- ================================================================

CREATE TABLE IF NOT EXISTS produtos_agencia (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id      UUID        NOT NULL REFERENCES agencias(id),
  codigo_produto  TEXT        NOT NULL,
  nome            TEXT        NOT NULL,
  categoria       TEXT,
  tipo            TEXT        NOT NULL
    CHECK (tipo IN ('recorrente','pontual','hibrido')),
  periodicidade   TEXT
    CHECK (periodicidade IN ('mensal','trimestral','semestral','anual')),
  valor_padrao    NUMERIC(12,2),
  custo_base      NUMERIC(12,2),
  ativo           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agencia_id, codigo_produto)
);

CREATE TABLE IF NOT EXISTS produto_ofertas (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id               UUID         NOT NULL REFERENCES agencias(id),
  produto_id               UUID         NOT NULL REFERENCES produtos_agencia(id),
  nome                     TEXT         NOT NULL,
  valor                    NUMERIC(12,2) NOT NULL,
  periodicidade            TEXT
    CHECK (periodicidade IN ('mensal','trimestral','semestral','anual')),
  carencia_meses           INTEGER      NOT NULL DEFAULT 0,
  prazo_aviso_cancelamento INTEGER      NOT NULL DEFAULT 30,
  multa_tipo               TEXT
    CHECK (multa_tipo IN ('percentual','fixo','meses')),
  multa_valor              NUMERIC(12,2),
  indice_reajuste          TEXT
    CHECK (indice_reajuste IN ('igpm','ipca','inpc','fixo','nenhum')),
  perc_reajuste_fixo       NUMERIC(5,2),
  renovacao_automatica     BOOLEAN      NOT NULL DEFAULT TRUE,
  dias_geracao_fatura      INTEGER      NOT NULL DEFAULT 7,
  multa_atraso_perc        NUMERIC(5,2) NOT NULL DEFAULT 2.00,
  juros_atraso_diario      NUMERIC(8,4) NOT NULL DEFAULT 0.0330,
  ativo                    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN produto_ofertas.carencia_meses
  IS 'Meses após data_ativacao antes de aplicar multa de cancelamento';


-- ================================================================
-- SEÇÃO 6 — CONTRATOS
-- ================================================================

CREATE TABLE IF NOT EXISTS contratos (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id           UUID         NOT NULL REFERENCES agencias(id),
  numero_contrato      TEXT         NOT NULL,
  cliente_id           UUID         NOT NULL REFERENCES clientes(id),
  entid_contrat_tipo   TEXT
    CHECK (entid_contrat_tipo IN ('cliente','pessoa','terceiro')),
  entid_contrat_id     UUID,
  entid_contrat_nome   TEXT,
  entid_contrat_doc    TEXT,
  tipo                 TEXT         NOT NULL
    CHECK (tipo IN ('servico','produto','hibrido')),
  status               TEXT         NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo','pausado','em_cancelamento','encerrado','cancelado')),
  data_assinatura      DATE         NOT NULL,
  data_ativacao        DATE         NOT NULL,
  data_fim             DATE,
  data_encerramento    DATE,
  contrato_pai_id      UUID         REFERENCES contratos(id),
  tipo_vinculo         TEXT         CHECK (tipo_vinculo = 'aditivo'),
  forma_pagamento      TEXT         NOT NULL
    CHECK (forma_pagamento IN (
      'boleto','pix','cartao_credito','transferencia','debito_automatico'
    )),
  dados_pix            TEXT,
  prazo_pagamento      INTEGER      NOT NULL DEFAULT 5,
  multa_atraso_perc    NUMERIC(5,2),
  juros_atraso_diario  NUMERIC(8,4),
  cobrar_juros         BOOLEAN      NOT NULL DEFAULT TRUE,
  data_pausa           DATE,
  data_retomada        DATE,
  motivo_pausa         TEXT,
  pausado_por          UUID         REFERENCES profiles(id),
  cobrar_durante_pausa BOOLEAN      NOT NULL DEFAULT FALSE,
  documento_url        TEXT,
  observacao           TEXT,
  external_ids         JSONB        NOT NULL DEFAULT '{}',
  deleted_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (agencia_id, numero_contrato)
);

COMMENT ON COLUMN contratos.cliente_id
  IS 'Âncora comercial permanente — nunca muda independente de quem assinou';
COMMENT ON COLUMN contratos.multa_atraso_perc
  IS 'NULL = herda de produto_ofertas';

CREATE TRIGGER tr_contratos_updated_at
  BEFORE UPDATE ON contratos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS contrato_itens (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id            UUID         NOT NULL REFERENCES agencias(id),
  contrato_id           UUID         NOT NULL REFERENCES contratos(id),
  produto_id            UUID         NOT NULL REFERENCES produtos_agencia(id),
  oferta_id             UUID         REFERENCES produto_ofertas(id),
  valor_negociado       NUMERIC(12,2) NOT NULL,
  desconto_tipo         TEXT
    CHECK (desconto_tipo IN ('comercial','bonificacao','retencao')),
  desconto_percentual   NUMERIC(5,2),
  desconto_valor_fixo   NUMERIC(12,2),
  desconto_motivo       TEXT,
  desconto_aprovado_por UUID         REFERENCES profiles(id),
  desconto_valido_ate   DATE,
  isencao_tipo          TEXT,
  isencao_motivo        TEXT,
  isencao_aprovado_por  UUID         REFERENCES profiles(id),
  isencao_valido_ate    DATE,
  data_inicio_item      DATE         NOT NULL,
  data_fim_item         DATE,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documentos_cliente (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id   UUID        NOT NULL REFERENCES agencias(id),
  cliente_id   UUID        NOT NULL REFERENCES clientes(id),
  contrato_id  UUID        REFERENCES contratos(id),
  tipo         TEXT        NOT NULL
    CHECK (tipo IN ('contrato','aditivo','proposta','nf','outro')),
  nome         TEXT        NOT NULL,
  arquivo_url  TEXT        NOT NULL,
  enviado_por  UUID        REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ================================================================
-- SEÇÃO 7 — FATURAMENTO
-- ================================================================

CREATE TABLE IF NOT EXISTS faturas (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id      UUID         NOT NULL REFERENCES agencias(id),
  numero_fatura   TEXT         NOT NULL,
  cliente_id      UUID         NOT NULL REFERENCES clientes(id),
  competencia     TEXT         NOT NULL,
  tipo            TEXT         NOT NULL DEFAULT 'regular'
    CHECK (tipo IN ('regular','distrato','acordo','cortesia')),
  data_emissao    DATE         NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE         NOT NULL,
  valor_total     NUMERIC(12,2) NOT NULL,
  valor_pago      NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo_devedor   NUMERIC(12,2)
    GENERATED ALWAYS AS (valor_total - valor_pago) STORED,
  status          TEXT         NOT NULL DEFAULT 'pendente'
    CHECK (status IN (
      'pendente','parcial','pago','atrasado','suspenso',
      'cancelado','em_acordo','liquidado_por_acordo','cancelado_por_distrato'
    )),
  multa_aplicada  NUMERIC(12,2),
  juros_aplicado  NUMERIC(12,2),
  data_nfe        DATE,
  nfe_numero      TEXT,
  nfe_url         TEXT,
  external_ids    JSONB        NOT NULL DEFAULT '{}',
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (agencia_id, numero_fatura),
  UNIQUE (agencia_id, cliente_id, competencia, tipo)
);

COMMENT ON COLUMN faturas.competencia IS 'Mês de referência: YYYY-MM';
COMMENT ON COLUMN faturas.saldo_devedor IS 'GENERATED: valor_total - valor_pago';

CREATE TRIGGER tr_faturas_updated_at
  BEFORE UPDATE ON faturas
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS fatura_itens (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id        UUID         NOT NULL REFERENCES agencias(id),
  fatura_id         UUID         NOT NULL REFERENCES faturas(id),
  contrato_item_id  UUID         REFERENCES contrato_itens(id),
  descricao         TEXT         NOT NULL,
  valor             NUMERIC(12,2) NOT NULL,
  proporcional      BOOLEAN      NOT NULL DEFAULT FALSE,
  dias_proporcional INTEGER,
  isencao           BOOLEAN      NOT NULL DEFAULT FALSE,
  isencao_motivo    TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN fatura_itens.dias_proporcional
  IS 'Dias cobrados. Base fixa = 30. Proporcional = valor / 30 * dias';

CREATE TABLE IF NOT EXISTS pagamentos (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id       UUID         NOT NULL REFERENCES agencias(id),
  fatura_id        UUID         NOT NULL REFERENCES faturas(id),
  data_pagamento   DATE         NOT NULL,
  valor_pago       NUMERIC(12,2) NOT NULL,
  forma_pagamento  TEXT,
  comprovante_url  TEXT,
  status           TEXT         NOT NULL DEFAULT 'confirmado'
    CHECK (status IN ('confirmado','estornado')),
  estornado_por    UUID         REFERENCES profiles(id),
  motivo_estorno   TEXT,
  data_estorno     DATE,
  registrado_por   UUID         REFERENCES profiles(id),
  external_ids     JSONB        NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ================================================================
-- SEÇÃO 8 — ACORDOS E DISTRATOS
-- ================================================================

CREATE TABLE IF NOT EXISTS acordos (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id      UUID         NOT NULL REFERENCES agencias(id),
  cliente_id      UUID         NOT NULL REFERENCES clientes(id),
  tipo            TEXT         NOT NULL
    CHECK (tipo IN ('inadimplencia','distrato')),
  descricao       TEXT,
  valor_original  NUMERIC(12,2) NOT NULL,
  valor_acordado  NUMERIC(12,2) NOT NULL,
  status          TEXT         NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo','cumprido','quebrado')),
  criado_por      UUID         NOT NULL REFERENCES profiles(id),
  aprovado_por    UUID         REFERENCES profiles(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_acordos_updated_at
  BEFORE UPDATE ON acordos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE IF NOT EXISTS acordo_origens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id  UUID        NOT NULL REFERENCES agencias(id),
  acordo_id   UUID        NOT NULL REFERENCES acordos(id),
  fatura_id   UUID        NOT NULL REFERENCES faturas(id)
);

CREATE TABLE IF NOT EXISTS acordo_parcelas (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id      UUID         NOT NULL REFERENCES agencias(id),
  acordo_id       UUID         NOT NULL REFERENCES acordos(id),
  fatura_id       UUID         NOT NULL REFERENCES faturas(id),
  numero          INTEGER      NOT NULL,
  valor           NUMERIC(12,2) NOT NULL,
  data_vencimento DATE         NOT NULL,
  status          TEXT         NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','pago','atrasado')),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ================================================================
-- SEÇÃO 9 — CRÉDITOS
-- ================================================================

CREATE TABLE IF NOT EXISTS creditos_cliente (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id       UUID         NOT NULL REFERENCES agencias(id),
  cliente_id       UUID         NOT NULL REFERENCES clientes(id),
  origem           TEXT         NOT NULL
    CHECK (origem IN ('distrato','estorno','cortesia','ajuste_manual')),
  valor            NUMERIC(12,2) NOT NULL,
  saldo_disponivel NUMERIC(12,2) NOT NULL,
  fatura_origem_id UUID         REFERENCES faturas(id),
  motivo           TEXT,
  status           TEXT         NOT NULL DEFAULT 'disponivel'
    CHECK (status IN ('disponivel','aplicado','expirado')),
  criado_por       UUID         NOT NULL REFERENCES profiles(id),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credito_aplicacoes (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id      UUID         NOT NULL REFERENCES agencias(id),
  credito_id      UUID         NOT NULL REFERENCES creditos_cliente(id),
  fatura_id       UUID         NOT NULL REFERENCES faturas(id),
  valor_aplicado  NUMERIC(12,2) NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ================================================================
-- SEÇÃO 10 — NOTIFICAÇÕES
-- ================================================================

CREATE TABLE IF NOT EXISTS notificacoes_config (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id        UUID        NOT NULL REFERENCES agencias(id),
  cliente_id        UUID        REFERENCES clientes(id),
  canal             TEXT        NOT NULL
    CHECK (canal IN ('email','whatsapp','ambos')),
  evento            TEXT        NOT NULL
    CHECK (evento IN (
      'pre_vencimento','vencimento','atraso','suspensao','renovacao'
    )),
  dias_antecedencia INTEGER[],
  ativo             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notificacoes_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id  UUID        NOT NULL REFERENCES agencias(id),
  cliente_id  UUID        NOT NULL REFERENCES clientes(id),
  fatura_id   UUID        REFERENCES faturas(id),
  canal       TEXT        NOT NULL,
  evento      TEXT        NOT NULL,
  status      TEXT        NOT NULL
    CHECK (status IN ('enviado','falhou','ignorado')),
  enviado_em  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ================================================================
-- SEÇÃO 11 — AUDITORIA (PARTICIONADA POR MÊS)
-- ================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id                UUID        NOT NULL DEFAULT gen_random_uuid(),
  tabela            TEXT        NOT NULL,
  registro_id       UUID,
  operacao          TEXT        NOT NULL
    CHECK (operacao IN ('INSERT','UPDATE','DELETE')),
  dados_anteriores  JSONB,
  dados_novos       JSONB,
  campos_alterados  TEXT[],
  usuario_id        UUID,
  ip                TEXT,
  motivo            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

COMMENT ON TABLE audit_log
  IS 'Auditoria técnica via triggers. Particionada por mês.';

CREATE TABLE IF NOT EXISTS audit_log_2026_03 PARTITION OF audit_log FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_04 PARTITION OF audit_log FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_05 PARTITION OF audit_log FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_06 PARTITION OF audit_log FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_07 PARTITION OF audit_log FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_08 PARTITION OF audit_log FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_09 PARTITION OF audit_log FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_10 PARTITION OF audit_log FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_11 PARTITION OF audit_log FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE IF NOT EXISTS audit_log_2026_12 PARTITION OF audit_log FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_01 PARTITION OF audit_log FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_02 PARTITION OF audit_log FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_03 PARTITION OF audit_log FOR VALUES FROM ('2027-03-01') TO ('2027-04-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_04 PARTITION OF audit_log FOR VALUES FROM ('2027-04-01') TO ('2027-05-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_05 PARTITION OF audit_log FOR VALUES FROM ('2027-05-01') TO ('2027-06-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_06 PARTITION OF audit_log FOR VALUES FROM ('2027-06-01') TO ('2027-07-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_07 PARTITION OF audit_log FOR VALUES FROM ('2027-07-01') TO ('2027-08-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_08 PARTITION OF audit_log FOR VALUES FROM ('2027-08-01') TO ('2027-09-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_09 PARTITION OF audit_log FOR VALUES FROM ('2027-09-01') TO ('2027-10-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_10 PARTITION OF audit_log FOR VALUES FROM ('2027-10-01') TO ('2027-11-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_11 PARTITION OF audit_log FOR VALUES FROM ('2027-11-01') TO ('2027-12-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_12 PARTITION OF audit_log FOR VALUES FROM ('2027-12-01') TO ('2028-01-01');

CREATE TABLE IF NOT EXISTS eventos_cliente (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id     UUID        NOT NULL REFERENCES agencias(id),
  cliente_id     UUID        NOT NULL REFERENCES clientes(id),
  tipo           TEXT        NOT NULL,
  descricao      TEXT        NOT NULL,
  entidade_tipo  TEXT
    CHECK (entidade_tipo IN (
      'contrato','fatura','acordo','pagamento','credito','nps'
    )),
  entidade_id    UUID,
  dados          JSONB,
  usuario_id     UUID        REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE eventos_cliente
  IS 'Timeline de negócio legível por humano. Escrita pela aplicação.';


-- ================================================================
-- SEÇÃO 12 — JOBS
-- ================================================================

CREATE TABLE IF NOT EXISTS jobs_log (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id            UUID        REFERENCES agencias(id),
  job_nome              TEXT        NOT NULL,
  status                TEXT        NOT NULL
    CHECK (status IN ('sucesso','falhou','parcial')),
  registros_processados INTEGER     NOT NULL DEFAULT 0,
  registros_erro        INTEGER     NOT NULL DEFAULT 0,
  erro_detalhe          TEXT,
  iniciado_em           TIMESTAMPTZ NOT NULL,
  finalizado_em         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN jobs_log.job_nome IS
  'gerar-faturas | checar-suspensoes | alertas-renovacao | '
  'processar-reajustes | emitir-nfe | refresh-materialized-views';


-- ================================================================
-- SEÇÃO 13 — VIEWS
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
  IS 'Itens de contrato ativos com valor_efetivo após descontos. Base para MRR.';

CREATE OR REPLACE VIEW faturas_view AS
  SELECT
    f.*,
    CASE
      WHEN f.status IN (
        'pago','cancelado','cancelado_por_distrato',
        'em_acordo','liquidado_por_acordo'
      ) THEN 0
      ELSE GREATEST(0, (CURRENT_DATE - f.data_vencimento))
    END AS dias_atraso
  FROM faturas f
  WHERE f.deleted_at IS NULL;

COMMENT ON VIEW faturas_view
  IS 'Faturas com dias_atraso em tempo real. Use para leitura.';


-- ================================================================
-- SEÇÃO 14 — MATERIALIZED VIEWS
-- Refresh diário: REFRESH MATERIALIZED VIEW CONCURRENTLY <nome>
-- ================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mrr_snapshot AS
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_mrr_snapshot_agencia
  ON mrr_snapshot (agencia_id);

CREATE MATERIALIZED VIEW IF NOT EXISTS inadimplencia_snapshot AS
  SELECT
    f.agencia_id,
    COUNT(*)                        AS total_faturas_atrasadas,
    SUM(f.saldo_devedor)            AS valor_total_aberto,
    COUNT(DISTINCT f.cliente_id)    AS clientes_inadimplentes,
    ROUND(AVG(CURRENT_DATE - f.data_vencimento), 1) AS media_dias_atraso
  FROM faturas f
  WHERE f.status IN ('atrasado','parcial')
    AND f.deleted_at IS NULL
  GROUP BY f.agencia_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_inadimplencia_snapshot_agencia
  ON inadimplencia_snapshot (agencia_id);


-- ================================================================
-- SEÇÃO 15 — INDEXES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_clientes_agencia_status   ON clientes (agencia_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_responsavel       ON clientes (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_clientes_ext_asaas         ON clientes ((external_ids->>'asaas')) WHERE external_ids->>'asaas' IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contratos_cliente_status   ON contratos (agencia_id, cliente_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contratos_ativacao         ON contratos (data_ativacao);

CREATE INDEX IF NOT EXISTS idx_contrato_itens_contrato    ON contrato_itens (contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_itens_produto     ON contrato_itens (produto_id);
CREATE INDEX IF NOT EXISTS idx_contrato_itens_data_fim    ON contrato_itens (data_fim_item) WHERE data_fim_item IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_faturas_cliente_comp       ON faturas (agencia_id, cliente_id, competencia) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_faturas_status_venc        ON faturas (agencia_id, status, data_vencimento) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_faturas_pendentes          ON faturas (data_vencimento) WHERE status IN ('pendente','parcial','atrasado');
CREATE INDEX IF NOT EXISTS idx_faturas_ext_asaas          ON faturas ((external_ids->>'asaas')) WHERE external_ids->>'asaas' IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pagamentos_fatura          ON pagamentos (fatura_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data            ON pagamentos (agencia_id, data_pagamento DESC);

CREATE INDEX IF NOT EXISTS idx_acordos_cliente            ON acordos (agencia_id, cliente_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_registro         ON audit_log (tabela, registro_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_usuario          ON audit_log (usuario_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_eventos_timeline           ON eventos_cliente (agencia_id, cliente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nps_cliente_data           ON nps_registros (agencia_id, cliente_id, data_registro DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_nome_data             ON jobs_log (job_nome, iniciado_em DESC);


-- ================================================================
-- SEÇÃO 16 — RLS POLICIES
-- ================================================================

ALTER TABLE agencias             ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_socios       ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos_cliente     ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_cliente   ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_agencia     ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_ofertas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrato_itens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE faturas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE fatura_itens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE acordos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE acordo_origens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE acordo_parcelas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE creditos_cliente     ENABLE ROW LEVEL SECURITY;
ALTER TABLE credito_aplicacoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes_config  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_cliente      ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_registros        ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs_log             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log            ENABLE ROW LEVEL SECURITY;

-- Isolamento por agência (todas as tabelas com agencia_id)
CREATE POLICY "tenant_isolation" ON profiles             USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON sistema_config       USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON pessoas              USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON clientes             USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON cliente_socios       USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON contatos_cliente     USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON documentos_cliente   USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON produtos_agencia     USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON produto_ofertas      USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON contratos            USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON contrato_itens       USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON faturas              USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON fatura_itens         USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON pagamentos           USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON acordos              USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON acordo_origens       USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON acordo_parcelas      USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON creditos_cliente     USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON credito_aplicacoes   USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON notificacoes_config  USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON notificacoes_log     USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON eventos_cliente      USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON nps_registros        USING (agencia_id = fn_agencia_id());
CREATE POLICY "tenant_isolation" ON jobs_log             USING (agencia_id = fn_agencia_id() OR agencia_id IS NULL);

-- Desconto: apenas gestor/admin pode registrar aprovação
CREATE POLICY "desconto_somente_gestor" ON contrato_itens
  AS RESTRICTIVE FOR UPDATE
  WITH CHECK (
    desconto_aprovado_por IS NULL
    OR fn_user_role() IN ('admin','gestor')
  );

-- Estorno: apenas admin/financeiro
CREATE POLICY "estorno_somente_financeiro" ON pagamentos
  AS RESTRICTIVE FOR UPDATE
  WITH CHECK (
    status != 'estornado'
    OR fn_user_role() IN ('admin','financeiro')
  );

-- Audit log: leitura para todos (escrita via service role / trigger)
CREATE POLICY "audit_log_leitura" ON audit_log
  FOR SELECT USING (TRUE);


-- ================================================================
-- SEÇÃO 17 — TRIGGERS DE AUDITORIA
-- ================================================================

CREATE TRIGGER tr_audit_clientes
  AFTER INSERT OR UPDATE OR DELETE ON clientes
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER tr_audit_contratos
  AFTER INSERT OR UPDATE OR DELETE ON contratos
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER tr_audit_contrato_itens
  AFTER INSERT OR UPDATE OR DELETE ON contrato_itens
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER tr_audit_produto_ofertas
  AFTER INSERT OR UPDATE OR DELETE ON produto_ofertas
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER tr_audit_faturas
  AFTER INSERT OR UPDATE OR DELETE ON faturas
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER tr_audit_pagamentos
  AFTER INSERT OR UPDATE OR DELETE ON pagamentos
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER tr_audit_acordos
  AFTER INSERT OR UPDATE OR DELETE ON acordos
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER tr_audit_creditos_cliente
  AFTER INSERT OR UPDATE OR DELETE ON creditos_cliente
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();


-- ================================================================
-- STORAGE — bucket documentos
-- ================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  FALSE,
  52428800,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "storage_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documentos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "storage_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documentos'
    AND auth.uid() IS NOT NULL
  );


-- ================================================================
-- SEED — CONFIG PADRÃO
-- Descomentar e substituir :agencia_id após criar a primeira agência
-- ================================================================
-- INSERT INTO sistema_config (agencia_id, chave, valor) VALUES
--   (:agencia_id, 'dias_geracao_fatura',         '7'),
--   (:agencia_id, 'alerta_renovacao_dias',        '[30,10]'),
--   (:agencia_id, 'dias_suspensao_inadimplencia', '30'),
--   (:agencia_id, 'multa_atraso_default',         '2.00'),
--   (:agencia_id, 'juros_atraso_diario_default',  '0.0330'),
--   (:agencia_id, 'base_proporcional_dias',       '30');


-- ================================================================
-- FIM — BASTION DDL v1.0
-- 25 tabelas | 2 views | 2 materialized views
-- 22 indexes | 25+ RLS policies | 8 audit triggers
-- ================================================================
