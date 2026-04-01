-- ================================================================
-- MIGRATION: RLS — Tabelas Core
-- Habilita Row Level Security em todas as tabelas do schema principal
-- que estavam sem proteção após o arquivo de schema original ser corrompido.
--
-- Padrão de isolamento: agencia_id = fn_agencia_id()
-- Funções helper já existentes: fn_agencia_id(), fn_user_role()
-- ================================================================

-- ================================================================
-- 1. AGENCIAS (sem agencia_id — é o próprio tenant)
-- Usuário vê apenas a própria agência
-- ================================================================
ALTER TABLE agencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agencias_select" ON agencias;
CREATE POLICY "agencias_select" ON agencias
  FOR SELECT TO authenticated
  USING (id = fn_agencia_id());

DROP POLICY IF EXISTS "agencias_update" ON agencias;
CREATE POLICY "agencias_update" ON agencias
  FOR UPDATE TO authenticated
  USING (id = fn_agencia_id() AND fn_user_role() = 'admin')
  WITH CHECK (id = fn_agencia_id());


-- ================================================================
-- 2. PROFILES
-- SELECT: todos da mesma agência (necessário para exibir responsáveis)
-- UPDATE: próprio perfil ou admin da agência
-- INSERT: via trigger fn_create_profile_on_signup (SECURITY DEFINER)
-- ================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id() AND fn_user_role() = 'admin');


-- ================================================================
-- 3. SISTEMA_CONFIG
-- Todos leem, apenas admin escreve
-- ================================================================
ALTER TABLE sistema_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sistema_config_select" ON sistema_config;
CREATE POLICY "sistema_config_select" ON sistema_config
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "sistema_config_insert" ON sistema_config;
CREATE POLICY "sistema_config_insert" ON sistema_config
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id() AND fn_user_role() = 'admin');

DROP POLICY IF EXISTS "sistema_config_update" ON sistema_config;
CREATE POLICY "sistema_config_update" ON sistema_config
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (fn_user_role() = 'admin');

DROP POLICY IF EXISTS "sistema_config_delete" ON sistema_config;
CREATE POLICY "sistema_config_delete" ON sistema_config
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id() AND fn_user_role() = 'admin');


-- ================================================================
-- 4. PESSOAS
-- ================================================================
ALTER TABLE pessoas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pessoas_select" ON pessoas;
CREATE POLICY "pessoas_select" ON pessoas
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "pessoas_insert" ON pessoas;
CREATE POLICY "pessoas_insert" ON pessoas
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "pessoas_update" ON pessoas;
CREATE POLICY "pessoas_update" ON pessoas
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "pessoas_delete" ON pessoas;
CREATE POLICY "pessoas_delete" ON pessoas
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id() AND fn_user_role() IN ('admin','gestor'));


-- ================================================================
-- 5. CLIENTES
-- ================================================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_select" ON clientes;
CREATE POLICY "clientes_select" ON clientes
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "clientes_insert" ON clientes;
CREATE POLICY "clientes_insert" ON clientes
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "clientes_update" ON clientes;
CREATE POLICY "clientes_update" ON clientes
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "clientes_delete" ON clientes;
CREATE POLICY "clientes_delete" ON clientes
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id() AND fn_user_role() = 'admin');


-- ================================================================
-- 6. CLIENTE_SOCIOS
-- ================================================================
ALTER TABLE cliente_socios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cliente_socios_select" ON cliente_socios;
CREATE POLICY "cliente_socios_select" ON cliente_socios
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "cliente_socios_insert" ON cliente_socios;
CREATE POLICY "cliente_socios_insert" ON cliente_socios
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "cliente_socios_update" ON cliente_socios;
CREATE POLICY "cliente_socios_update" ON cliente_socios
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "cliente_socios_delete" ON cliente_socios;
CREATE POLICY "cliente_socios_delete" ON cliente_socios
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id());


-- ================================================================
-- 7. CONTATOS_CLIENTE
-- ================================================================
ALTER TABLE contatos_cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contatos_select" ON contatos_cliente;
CREATE POLICY "contatos_select" ON contatos_cliente
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "contatos_insert" ON contatos_cliente;
CREATE POLICY "contatos_insert" ON contatos_cliente
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "contatos_update" ON contatos_cliente;
CREATE POLICY "contatos_update" ON contatos_cliente
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "contatos_delete" ON contatos_cliente;
CREATE POLICY "contatos_delete" ON contatos_cliente
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id());


-- ================================================================
-- 8. NPS_REGISTROS
-- DELETE: apenas admin
-- ================================================================
ALTER TABLE nps_registros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nps_select" ON nps_registros;
CREATE POLICY "nps_select" ON nps_registros
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "nps_insert" ON nps_registros;
CREATE POLICY "nps_insert" ON nps_registros
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "nps_delete" ON nps_registros;
CREATE POLICY "nps_delete" ON nps_registros
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id() AND fn_user_role() = 'admin');


-- ================================================================
-- 9. PRODUTOS_AGENCIA
-- Leitura: todos; Escrita: apenas admin
-- ================================================================
ALTER TABLE produtos_agencia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "produtos_select" ON produtos_agencia;
CREATE POLICY "produtos_select" ON produtos_agencia
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "produtos_insert" ON produtos_agencia;
CREATE POLICY "produtos_insert" ON produtos_agencia
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id() AND fn_user_role() = 'admin');

DROP POLICY IF EXISTS "produtos_update" ON produtos_agencia;
CREATE POLICY "produtos_update" ON produtos_agencia
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (fn_user_role() = 'admin');

DROP POLICY IF EXISTS "produtos_delete" ON produtos_agencia;
CREATE POLICY "produtos_delete" ON produtos_agencia
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id() AND fn_user_role() = 'admin');


-- ================================================================
-- 10. PRODUTO_OFERTAS
-- Leitura: todos; Escrita: apenas admin
-- ================================================================
ALTER TABLE produto_ofertas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ofertas_select" ON produto_ofertas;
CREATE POLICY "ofertas_select" ON produto_ofertas
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "ofertas_insert" ON produto_ofertas;
CREATE POLICY "ofertas_insert" ON produto_ofertas
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id() AND fn_user_role() = 'admin');

DROP POLICY IF EXISTS "ofertas_update" ON produto_ofertas;
CREATE POLICY "ofertas_update" ON produto_ofertas
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (fn_user_role() = 'admin');

DROP POLICY IF EXISTS "ofertas_delete" ON produto_ofertas;
CREATE POLICY "ofertas_delete" ON produto_ofertas
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id() AND fn_user_role() = 'admin');


-- ================================================================
-- 11. CONTRATOS
-- ================================================================
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contratos_select" ON contratos;
CREATE POLICY "contratos_select" ON contratos
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "contratos_insert" ON contratos;
CREATE POLICY "contratos_insert" ON contratos
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "contratos_update" ON contratos;
CREATE POLICY "contratos_update" ON contratos
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "contratos_delete" ON contratos;
CREATE POLICY "contratos_delete" ON contratos
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id() AND fn_user_role() IN ('admin','gestor'));


-- ================================================================
-- 12. CONTRATO_ITENS
-- ================================================================
ALTER TABLE contrato_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contrato_itens_select" ON contrato_itens;
CREATE POLICY "contrato_itens_select" ON contrato_itens
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "contrato_itens_insert" ON contrato_itens;
CREATE POLICY "contrato_itens_insert" ON contrato_itens
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "contrato_itens_update" ON contrato_itens;
CREATE POLICY "contrato_itens_update" ON contrato_itens
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "contrato_itens_delete" ON contrato_itens;
CREATE POLICY "contrato_itens_delete" ON contrato_itens
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id());


-- ================================================================
-- 13. DOCUMENTOS_CLIENTE
-- ================================================================
ALTER TABLE documentos_cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documentos_select" ON documentos_cliente;
CREATE POLICY "documentos_select" ON documentos_cliente
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "documentos_insert" ON documentos_cliente;
CREATE POLICY "documentos_insert" ON documentos_cliente
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "documentos_delete" ON documentos_cliente;
CREATE POLICY "documentos_delete" ON documentos_cliente
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id());


-- ================================================================
-- 14. FATURAS
-- ================================================================
ALTER TABLE faturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faturas_select" ON faturas;
CREATE POLICY "faturas_select" ON faturas
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "faturas_insert" ON faturas;
CREATE POLICY "faturas_insert" ON faturas
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "faturas_update" ON faturas;
CREATE POLICY "faturas_update" ON faturas
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "faturas_delete" ON faturas;
CREATE POLICY "faturas_delete" ON faturas
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id() AND fn_user_role() IN ('admin','financeiro'));


-- ================================================================
-- 15. FATURA_ITENS
-- ================================================================
ALTER TABLE fatura_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fatura_itens_select" ON fatura_itens;
CREATE POLICY "fatura_itens_select" ON fatura_itens
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "fatura_itens_insert" ON fatura_itens;
CREATE POLICY "fatura_itens_insert" ON fatura_itens
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "fatura_itens_delete" ON fatura_itens;
CREATE POLICY "fatura_itens_delete" ON fatura_itens
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id() AND fn_user_role() IN ('admin','financeiro'));


-- ================================================================
-- 16. PAGAMENTOS
-- Policy restritiva de estorno já existe (recriada em schema_fixes)
-- Adiciona policies básicas faltantes
-- ================================================================
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pagamentos_select" ON pagamentos;
CREATE POLICY "pagamentos_select" ON pagamentos
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "pagamentos_insert" ON pagamentos;
CREATE POLICY "pagamentos_insert" ON pagamentos
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "pagamentos_update" ON pagamentos;
CREATE POLICY "pagamentos_update" ON pagamentos
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (agencia_id = fn_agencia_id());


-- ================================================================
-- 17. ACORDOS
-- Criação: admin ou gestor
-- ================================================================
ALTER TABLE acordos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acordos_select" ON acordos;
CREATE POLICY "acordos_select" ON acordos
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "acordos_insert" ON acordos;
CREATE POLICY "acordos_insert" ON acordos
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id() AND fn_user_role() IN ('admin','gestor'));

DROP POLICY IF EXISTS "acordos_update" ON acordos;
CREATE POLICY "acordos_update" ON acordos
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (fn_user_role() IN ('admin','gestor'));


-- ================================================================
-- 18. ACORDO_ORIGENS
-- ================================================================
ALTER TABLE acordo_origens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acordo_origens_select" ON acordo_origens;
CREATE POLICY "acordo_origens_select" ON acordo_origens
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "acordo_origens_insert" ON acordo_origens;
CREATE POLICY "acordo_origens_insert" ON acordo_origens
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());


-- ================================================================
-- 19. ACORDO_PARCELAS
-- ================================================================
ALTER TABLE acordo_parcelas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acordo_parcelas_select" ON acordo_parcelas;
CREATE POLICY "acordo_parcelas_select" ON acordo_parcelas
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "acordo_parcelas_insert" ON acordo_parcelas;
CREATE POLICY "acordo_parcelas_insert" ON acordo_parcelas
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "acordo_parcelas_update" ON acordo_parcelas;
CREATE POLICY "acordo_parcelas_update" ON acordo_parcelas
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (agencia_id = fn_agencia_id());


-- ================================================================
-- 20. CREDITOS_CLIENTE
-- ================================================================
ALTER TABLE creditos_cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "creditos_select" ON creditos_cliente;
CREATE POLICY "creditos_select" ON creditos_cliente
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "creditos_insert" ON creditos_cliente;
CREATE POLICY "creditos_insert" ON creditos_cliente
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id() AND fn_user_role() IN ('admin','gestor','financeiro'));

DROP POLICY IF EXISTS "creditos_update" ON creditos_cliente;
CREATE POLICY "creditos_update" ON creditos_cliente
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (fn_user_role() IN ('admin','gestor','financeiro'));


-- ================================================================
-- 21. CREDITO_APLICACOES
-- ================================================================
ALTER TABLE credito_aplicacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credito_aplic_select" ON credito_aplicacoes;
CREATE POLICY "credito_aplic_select" ON credito_aplicacoes
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "credito_aplic_insert" ON credito_aplicacoes;
CREATE POLICY "credito_aplic_insert" ON credito_aplicacoes
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());


-- ================================================================
-- 22. NOTIFICACOES_CONFIG
-- Admin gerencia; todos leem
-- ================================================================
ALTER TABLE notificacoes_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_config_select" ON notificacoes_config;
CREATE POLICY "notif_config_select" ON notificacoes_config
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "notif_config_insert" ON notificacoes_config;
CREATE POLICY "notif_config_insert" ON notificacoes_config
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id() AND fn_user_role() = 'admin');

DROP POLICY IF EXISTS "notif_config_update" ON notificacoes_config;
CREATE POLICY "notif_config_update" ON notificacoes_config
  FOR UPDATE TO authenticated
  USING (agencia_id = fn_agencia_id())
  WITH CHECK (fn_user_role() = 'admin');

DROP POLICY IF EXISTS "notif_config_delete" ON notificacoes_config;
CREATE POLICY "notif_config_delete" ON notificacoes_config
  FOR DELETE TO authenticated
  USING (agencia_id = fn_agencia_id() AND fn_user_role() = 'admin');


-- ================================================================
-- 23. NOTIFICACOES_LOG
-- Apenas leitura para usuários (escrita via SECURITY DEFINER)
-- ================================================================
ALTER TABLE notificacoes_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_log_select" ON notificacoes_log;
CREATE POLICY "notif_log_select" ON notificacoes_log
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());


-- ================================================================
-- 24. AUDIT_LOG (sem agencia_id — particionada por mês)
-- Apenas admin lê; escrita via trigger SECURITY DEFINER
-- ================================================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_select" ON audit_log;
CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT TO authenticated
  USING (fn_user_role() = 'admin');


-- ================================================================
-- 25. EVENTOS_CLIENTE
-- Leitura: todos da agência; Escrita: via server actions
-- ================================================================
ALTER TABLE eventos_cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eventos_select" ON eventos_cliente;
CREATE POLICY "eventos_select" ON eventos_cliente
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id());

DROP POLICY IF EXISTS "eventos_insert" ON eventos_cliente;
CREATE POLICY "eventos_insert" ON eventos_cliente
  FOR INSERT TO authenticated
  WITH CHECK (agencia_id = fn_agencia_id());


-- ================================================================
-- 26. JOBS_LOG
-- Apenas admin lê; escrita via cron (service role)
-- ================================================================
ALTER TABLE jobs_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jobs_log_select" ON jobs_log;
CREATE POLICY "jobs_log_select" ON jobs_log
  FOR SELECT TO authenticated
  USING (agencia_id = fn_agencia_id() AND fn_user_role() = 'admin');
