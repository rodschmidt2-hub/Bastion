-- ================================================================
-- BASTION — SEED DE DEMONSTRAÇÃO
-- Agência fictícia: Dental Growth Agency
-- 8 clientes, 4 produtos, 6 meses de faturas, NPS, MRR histórico
-- ================================================================

-- UUIDs fixos para rastreabilidade
-- Agência:   a0a0a0a0-0000-0000-0000-000000000001
-- Users:     u1..u3 → aaaaaaaa-0000-0000-0000-00000000000x
-- Clientes:  c1..c8 → cccccccc-0000-0000-0000-00000000000x
-- Produtos:  p1..p4 → pppppppp-0000-0000-0000-00000000000x
-- Ofertas:   o1..o4 → oooooooo-0000-0000-0000-00000000000x
-- Contratos: k1..k7 → kkkkkkkk-0000-0000-0000-00000000000x

-- ================================================================
-- 1. AUTH USERS (necessário antes de profiles)
-- Desabilita triggers do Supabase que conflitam com nosso schema
-- ================================================================
DO $$
BEGIN
  -- Desabilita o trigger padrão do Supabase (usa full_name, não nome)
  ALTER TABLE auth.users DISABLE TRIGGER ALL;

  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES
    (
      'aaaaaaaa-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'carlos@dentalgrowth.com.br',
      crypt('Demo@1234', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"nome":"Carlos Mendes","agencia_id":"a0a0a0a0-0000-0000-0000-000000000001","role":"admin"}',
      FALSE, '', '', '', ''
    ),
    (
      'aaaaaaaa-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'ana@dentalgrowth.com.br',
      crypt('Demo@1234', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"nome":"Ana Lima","agencia_id":"a0a0a0a0-0000-0000-0000-000000000001","role":"gestor"}',
      FALSE, '', '', '', ''
    ),
    (
      'aaaaaaaa-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'pedro@dentalgrowth.com.br',
      crypt('Demo@1234', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"nome":"Pedro Costa","agencia_id":"a0a0a0a0-0000-0000-0000-000000000001","role":"gestor"}',
      FALSE, '', '', '', ''
    )
  ON CONFLICT (id) DO NOTHING;

  ALTER TABLE auth.users ENABLE TRIGGER ALL;
END $$;

-- ================================================================
-- 2. AGÊNCIA
-- ================================================================
INSERT INTO agencias (id, nome, slug, plano) VALUES
  ('a0a0a0a0-0000-0000-0000-000000000001', 'Dental Growth Agency', 'dental-growth', 'profissional')
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- 3. PROFILES
-- ================================================================
INSERT INTO profiles (id, agencia_id, nome, email, role, nivel_desconto) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a0a0a0a0-0000-0000-0000-000000000001', 'Carlos Mendes', 'carlos@dentalgrowth.com.br', 'admin',    30),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'a0a0a0a0-0000-0000-0000-000000000001', 'Ana Lima',      'ana@dentalgrowth.com.br',    'gestor',   15),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'a0a0a0a0-0000-0000-0000-000000000001', 'Pedro Costa',   'pedro@dentalgrowth.com.br',  'gestor',   10)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- 4. PRODUTOS DO CATÁLOGO
-- ================================================================
INSERT INTO produtos_agencia (id, agencia_id, codigo_produto, nome, categoria, tipo, periodicidade, valor_padrao, custo_base) VALUES
  ('pppppppp-0000-0000-0000-000000000001', 'a0a0a0a0-0000-0000-0000-000000000001', 'SEO-001',    'SEO Local',         'SEO',           'recorrente', 'mensal', 800.00,  200.00),
  ('pppppppp-0000-0000-0000-000000000002', 'a0a0a0a0-0000-0000-0000-000000000001', 'ADS-001',    'Google Ads',        'Tráfego Pago',  'recorrente', 'mensal', 1200.00, 300.00),
  ('pppppppp-0000-0000-0000-000000000003', 'a0a0a0a0-0000-0000-0000-000000000001', 'SOC-001',    'Social Media',      'Redes Sociais', 'recorrente', 'mensal', 900.00,  220.00),
  ('pppppppp-0000-0000-0000-000000000004', 'a0a0a0a0-0000-0000-0000-000000000001', 'SITE-001',   'Site Institucional','Website',       'pontual',    NULL,     3500.00, 800.00)
ON CONFLICT (agencia_id, codigo_produto) DO NOTHING;

-- ================================================================
-- 5. OFERTAS
-- ================================================================
INSERT INTO produto_ofertas (id, agencia_id, produto_id, nome, valor, periodicidade, renovacao_automatica, dias_geracao_fatura, multa_atraso_perc, juros_atraso_diario) VALUES
  ('oooooooo-0000-0000-0000-000000000001', 'a0a0a0a0-0000-0000-0000-000000000001', 'pppppppp-0000-0000-0000-000000000001', 'SEO Local Mensal',    800.00,  'mensal', TRUE, 7, 2.00, 0.0330),
  ('oooooooo-0000-0000-0000-000000000002', 'a0a0a0a0-0000-0000-0000-000000000001', 'pppppppp-0000-0000-0000-000000000002', 'Google Ads Mensal',   1200.00, 'mensal', TRUE, 7, 2.00, 0.0330),
  ('oooooooo-0000-0000-0000-000000000003', 'a0a0a0a0-0000-0000-0000-000000000001', 'pppppppp-0000-0000-0000-000000000003', 'Social Media Mensal', 900.00,  'mensal', TRUE, 7, 2.00, 0.0330),
  ('oooooooo-0000-0000-0000-000000000004', 'a0a0a0a0-0000-0000-0000-000000000001', 'pppppppp-0000-0000-0000-000000000004', 'Site Único',          3500.00, NULL,     FALSE, 0, 2.00, 0.0330)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 6. CLIENTES
-- ================================================================
INSERT INTO clientes (id, agencia_id, codigo_cliente, razao_social, nome_fantasia, cnpj, cidade, uf, status, segmento, responsavel_id, custo_aquisicao, data_inicio_relac, dia_vencimento) VALUES
  -- C1: Sorriso Pleno — ativo, solo, 18 meses, SEO+Ads
  ('cccccccc-0000-0000-0000-000000000001', 'a0a0a0a0-0000-0000-0000-000000000001', 'CLI-001', 'Clínica Sorriso Pleno Ltda',    'Sorriso Pleno',   '12.345.678/0001-90', 'São Paulo',     'SP', 'ativo',       'solo',         'aaaaaaaa-0000-0000-0000-000000000002', 1500.00, (CURRENT_DATE - INTERVAL '18 months')::DATE, 10),
  -- C2: Dental Premium — ativo, rede, 30 meses, Ads+Social+SEO
  ('cccccccc-0000-0000-0000-000000000002', 'a0a0a0a0-0000-0000-0000-000000000001', 'CLI-002', 'Dental Premium SP S/A',         'Dental Premium',  '23.456.789/0001-01', 'São Paulo',     'SP', 'ativo',       'rede',         'aaaaaaaa-0000-0000-0000-000000000002', 3200.00, (CURRENT_DATE - INTERVAL '30 months')::DATE, 15),
  -- C3: Odonto Express — ativo, especialidade, 8 meses, Social
  ('cccccccc-0000-0000-0000-000000000003', 'a0a0a0a0-0000-0000-0000-000000000001', 'CLI-003', 'Odonto Express Clínica Dental', 'Odonto Express',  '34.567.890/0001-12', 'Campinas',      'SP', 'ativo',       'especialidade','aaaaaaaa-0000-0000-0000-000000000003', 800.00,  (CURRENT_DATE - INTERVAL '8 months')::DATE,  5),
  -- C4: Instituto Oral — ativo, solo, 14 meses, SEO+Social
  ('cccccccc-0000-0000-0000-000000000004', 'a0a0a0a0-0000-0000-0000-000000000001', 'CLI-004', 'Instituto Oral de SP Ltda',     'Instituto Oral',  '45.678.901/0001-23', 'São Paulo',     'SP', 'ativo',       'solo',         'aaaaaaaa-0000-0000-0000-000000000003', 1200.00, (CURRENT_DATE - INTERVAL '14 months')::DATE, 20),
  -- C5: Smile Center — inadimplente, rede, 22 meses, Ads+Social
  ('cccccccc-0000-0000-0000-000000000005', 'a0a0a0a0-0000-0000-0000-000000000001', 'CLI-005', 'Smile Center Odontologia S/A',  'Smile Center',    '56.789.012/0001-34', 'Guarulhos',     'SP', 'inadimplente','rede',         'aaaaaaaa-0000-0000-0000-000000000002', 2500.00, (CURRENT_DATE - INTERVAL '22 months')::DATE, 5),
  -- C6: Bela Smile — ativo, solo, 6 meses, SEO
  ('cccccccc-0000-0000-0000-000000000006', 'a0a0a0a0-0000-0000-0000-000000000001', 'CLI-006', 'Clínica Bela Smile Ltda',       'Bela Smile',      '67.890.123/0001-45', 'Santo André',   'SP', 'ativo',       'solo',         'aaaaaaaa-0000-0000-0000-000000000003', 700.00,  (CURRENT_DATE - INTERVAL '6 months')::DATE,  10),
  -- C7: Ortodontia Santos — inativo, especialidade
  ('cccccccc-0000-0000-0000-000000000007', 'a0a0a0a0-0000-0000-0000-000000000001', 'CLI-007', 'Ortodontia Santos Clínica',     'Ortodontia Santos','78.901.234/0001-56', 'Santos',       'SP', 'inativo',     'especialidade','aaaaaaaa-0000-0000-0000-000000000002', 1000.00, (CURRENT_DATE - INTERVAL '12 months')::DATE, 15),
  -- C8: Dental Arts — ativo, solo, 36 meses (mais antigo), SEO
  ('cccccccc-0000-0000-0000-000000000008', 'a0a0a0a0-0000-0000-0000-000000000001', 'CLI-008', 'Dental Arts Odontologia Ltda',  'Dental Arts',     '89.012.345/0001-67', 'São Bernardo',  'SP', 'ativo',       'solo',         'aaaaaaaa-0000-0000-0000-000000000002', 900.00,  (CURRENT_DATE - INTERVAL '36 months')::DATE, 10)
ON CONFLICT (agencia_id, codigo_cliente) DO NOTHING;

-- ================================================================
-- 7. CONTATOS PRINCIPAIS
-- ================================================================
INSERT INTO contatos_cliente (agencia_id, cliente_id, nome, cargo, email, whatsapp, is_principal) VALUES
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Dra. Fernanda Silva',  'Diretora',      'fernanda@sorrisopleno.com.br',    '11987650001', TRUE),
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002', 'Dr. Ricardo Alves',   'CEO',           'ricardo@dentalpremium.com.br',    '11987650002', TRUE),
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003', 'Dra. Camila Torres',  'Proprietária',  'camila@odoexpress.com.br',        '19987650003', TRUE),
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000004', 'Dr. Marcos Pereira',  'Sócio',         'marcos@institutooral.com.br',     '11987650004', TRUE),
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000005', 'Dra. Juliana Ramos',  'Financeiro',    'juliana@smilecenter.com.br',      '11987650005', TRUE),
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000006', 'Dr. André Souza',     'Proprietário',  'andre@belasmile.com.br',          '11987650006', TRUE),
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000008', 'Dra. Patricia Nunes', 'Diretora',      'patricia@dentalarts.com.br',      '13987650008', TRUE)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 8. CONTRATOS
-- ================================================================
INSERT INTO contratos (id, agencia_id, numero_contrato, cliente_id, tipo, status, data_assinatura, data_ativacao, forma_pagamento, prazo_pagamento) VALUES
  ('kkkkkkkk-0000-0000-0000-000000000001', 'a0a0a0a0-0000-0000-0000-000000000001', 'CTR-2024-001', 'cccccccc-0000-0000-0000-000000000001', 'servico', 'ativo', (CURRENT_DATE - INTERVAL '18 months')::DATE, (CURRENT_DATE - INTERVAL '18 months')::DATE, 'pix',             5),
  ('kkkkkkkk-0000-0000-0000-000000000002', 'a0a0a0a0-0000-0000-0000-000000000001', 'CTR-2023-002', 'cccccccc-0000-0000-0000-000000000002', 'servico', 'ativo', (CURRENT_DATE - INTERVAL '30 months')::DATE, (CURRENT_DATE - INTERVAL '30 months')::DATE, 'boleto',          5),
  ('kkkkkkkk-0000-0000-0000-000000000003', 'a0a0a0a0-0000-0000-0000-000000000001', 'CTR-2025-003', 'cccccccc-0000-0000-0000-000000000003', 'servico', 'ativo', (CURRENT_DATE - INTERVAL '8 months')::DATE,  (CURRENT_DATE - INTERVAL '8 months')::DATE,  'pix',             5),
  ('kkkkkkkk-0000-0000-0000-000000000004', 'a0a0a0a0-0000-0000-0000-000000000001', 'CTR-2025-004', 'cccccccc-0000-0000-0000-000000000004', 'servico', 'ativo', (CURRENT_DATE - INTERVAL '14 months')::DATE, (CURRENT_DATE - INTERVAL '14 months')::DATE, 'transferencia',   5),
  ('kkkkkkkk-0000-0000-0000-000000000005', 'a0a0a0a0-0000-0000-0000-000000000001', 'CTR-2024-005', 'cccccccc-0000-0000-0000-000000000005', 'servico', 'ativo', (CURRENT_DATE - INTERVAL '22 months')::DATE, (CURRENT_DATE - INTERVAL '22 months')::DATE, 'boleto',          5),
  ('kkkkkkkk-0000-0000-0000-000000000006', 'a0a0a0a0-0000-0000-0000-000000000001', 'CTR-2025-006', 'cccccccc-0000-0000-0000-000000000006', 'servico', 'ativo', (CURRENT_DATE - INTERVAL '6 months')::DATE,  (CURRENT_DATE - INTERVAL '6 months')::DATE,  'pix',             5),
  ('kkkkkkkk-0000-0000-0000-000000000007', 'a0a0a0a0-0000-0000-0000-000000000001', 'CTR-2023-008', 'cccccccc-0000-0000-0000-000000000008', 'servico', 'ativo', (CURRENT_DATE - INTERVAL '36 months')::DATE, (CURRENT_DATE - INTERVAL '36 months')::DATE, 'pix',             5)
ON CONFLICT (agencia_id, numero_contrato) DO NOTHING;

-- ================================================================
-- 9. CONTRATO ITENS (produtos contratados)
-- ================================================================
INSERT INTO contrato_itens (id, agencia_id, contrato_id, produto_id, oferta_id, valor_negociado, data_inicio_item, status) VALUES
  -- C1: SEO + Ads
  ('iiiiiiii-0000-0000-0000-000000000001', 'a0a0a0a0-0000-0000-0000-000000000001', 'kkkkkkkk-0000-0000-0000-000000000001', 'pppppppp-0000-0000-0000-000000000001', 'oooooooo-0000-0000-0000-000000000001', 800.00,  (CURRENT_DATE - INTERVAL '18 months')::DATE, 'ativo'),
  ('iiiiiiii-0000-0000-0000-000000000002', 'a0a0a0a0-0000-0000-0000-000000000001', 'kkkkkkkk-0000-0000-0000-000000000001', 'pppppppp-0000-0000-0000-000000000002', 'oooooooo-0000-0000-0000-000000000002', 900.00,  (CURRENT_DATE - INTERVAL '18 months')::DATE, 'ativo'),
  -- C2: Ads + Social + SEO
  ('iiiiiiii-0000-0000-0000-000000000003', 'a0a0a0a0-0000-0000-0000-000000000001', 'kkkkkkkk-0000-0000-0000-000000000002', 'pppppppp-0000-0000-0000-000000000002', 'oooooooo-0000-0000-0000-000000000002', 1200.00, (CURRENT_DATE - INTERVAL '30 months')::DATE, 'ativo'),
  ('iiiiiiii-0000-0000-0000-000000000004', 'a0a0a0a0-0000-0000-0000-000000000001', 'kkkkkkkk-0000-0000-0000-000000000002', 'pppppppp-0000-0000-0000-000000000003', 'oooooooo-0000-0000-0000-000000000003', 900.00,  (CURRENT_DATE - INTERVAL '30 months')::DATE, 'ativo'),
  ('iiiiiiii-0000-0000-0000-000000000005', 'a0a0a0a0-0000-0000-0000-000000000001', 'kkkkkkkk-0000-0000-0000-000000000002', 'pppppppp-0000-0000-0000-000000000001', 'oooooooo-0000-0000-0000-000000000001', 1500.00, (CURRENT_DATE - INTERVAL '30 months')::DATE, 'ativo'),
  -- C3: Social
  ('iiiiiiii-0000-0000-0000-000000000006', 'a0a0a0a0-0000-0000-0000-000000000001', 'kkkkkkkk-0000-0000-0000-000000000003', 'pppppppp-0000-0000-0000-000000000003', 'oooooooo-0000-0000-0000-000000000003', 900.00,  (CURRENT_DATE - INTERVAL '8 months')::DATE,  'ativo'),
  -- C4: SEO + Social
  ('iiiiiiii-0000-0000-0000-000000000007', 'a0a0a0a0-0000-0000-0000-000000000001', 'kkkkkkkk-0000-0000-0000-000000000004', 'pppppppp-0000-0000-0000-000000000001', 'oooooooo-0000-0000-0000-000000000001', 800.00,  (CURRENT_DATE - INTERVAL '14 months')::DATE, 'ativo'),
  ('iiiiiiii-0000-0000-0000-000000000008', 'a0a0a0a0-0000-0000-0000-000000000001', 'kkkkkkkk-0000-0000-0000-000000000004', 'pppppppp-0000-0000-0000-000000000003', 'oooooooo-0000-0000-0000-000000000003', 1200.00, (CURRENT_DATE - INTERVAL '14 months')::DATE, 'ativo'),
  -- C5: Ads + Social (inadimplente)
  ('iiiiiiii-0000-0000-0000-000000000009', 'a0a0a0a0-0000-0000-0000-000000000001', 'kkkkkkkk-0000-0000-0000-000000000005', 'pppppppp-0000-0000-0000-000000000002', 'oooooooo-0000-0000-0000-000000000002', 1200.00, (CURRENT_DATE - INTERVAL '22 months')::DATE, 'ativo'),
  ('iiiiiiii-0000-0000-0000-000000000010', 'a0a0a0a0-0000-0000-0000-000000000001', 'kkkkkkkk-0000-0000-0000-000000000005', 'pppppppp-0000-0000-0000-000000000003', 'oooooooo-0000-0000-0000-000000000003', 900.00,  (CURRENT_DATE - INTERVAL '22 months')::DATE, 'ativo'),
  -- C6: SEO
  ('iiiiiiii-0000-0000-0000-000000000011', 'a0a0a0a0-0000-0000-0000-000000000001', 'kkkkkkkk-0000-0000-0000-000000000006', 'pppppppp-0000-0000-0000-000000000001', 'oooooooo-0000-0000-0000-000000000001', 800.00,  (CURRENT_DATE - INTERVAL '6 months')::DATE,  'ativo'),
  -- C8: SEO (mais antigo)
  ('iiiiiiii-0000-0000-0000-000000000012', 'a0a0a0a0-0000-0000-0000-000000000001', 'kkkkkkkk-0000-0000-0000-000000000007', 'pppppppp-0000-0000-0000-000000000001', 'oooooooo-0000-0000-0000-000000000001', 800.00,  (CURRENT_DATE - INTERVAL '36 months')::DATE, 'ativo')
ON CONFLICT DO NOTHING;

-- ================================================================
-- 10. FATURAS — 6 meses por cliente (função auxiliar com DO block)
-- ================================================================
DO $$
DECLARE
  ag UUID := 'a0a0a0a0-0000-0000-0000-000000000001';
  m  INTEGER;
  comp TEXT;
  venc DATE;
  fid UUID;
  -- [cliente_id, valor_total, dia_venc, paga_pontual, numero_base]
  clientes JSONB[] := ARRAY[
    '{"id":"cccccccc-0000-0000-0000-000000000001","valor":1700,"dia":10,"pontual":true,"cod":"CLI001"}',
    '{"id":"cccccccc-0000-0000-0000-000000000002","valor":3600,"dia":15,"pontual":true,"cod":"CLI002"}',
    '{"id":"cccccccc-0000-0000-0000-000000000003","valor":900, "dia":5, "pontual":true,"cod":"CLI003"}',
    '{"id":"cccccccc-0000-0000-0000-000000000004","valor":2000,"dia":20,"pontual":true,"cod":"CLI004"}',
    '{"id":"cccccccc-0000-0000-0000-000000000005","valor":2100,"dia":5, "pontual":false,"cod":"CLI005"}',
    '{"id":"cccccccc-0000-0000-0000-000000000006","valor":800, "dia":10,"pontual":true,"cod":"CLI006"}',
    '{"id":"cccccccc-0000-0000-0000-000000000008","valor":800, "dia":10,"pontual":true,"cod":"CLI008"}'
  ]::JSONB[];
  cl JSONB;
  dias_atraso INTEGER;
  data_pag DATE;
  v_total NUMERIC;
  num TEXT;
BEGIN
  FOREACH cl IN ARRAY clientes LOOP
    FOR m IN 1..6 LOOP
      comp := TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) - ((m) * INTERVAL '1 month'), 'YYYY-MM');
      venc := (DATE_TRUNC('month', CURRENT_DATE) - ((m) * INTERVAL '1 month') + ((cl->>'dia')::INTEGER - 1) * INTERVAL '1 day')::DATE;
      v_total := (cl->>'valor')::NUMERIC;
      num := 'FAT-' || comp || '-' || (cl->>'cod') || '-' || LPAD(m::TEXT, 2, '0');
      fid := gen_random_uuid();

      -- mês atual-1 a atual-5 = pagos, atual-6 = apenas pago se pontual
      IF (cl->>'pontual')::BOOLEAN OR m <= 4 THEN
        -- pago
        IF (cl->>'pontual')::BOOLEAN THEN
          dias_atraso := CASE WHEN m = 2 THEN 3 ELSE 0 END; -- 1 atraso leve esporádico no mês 2
        ELSE
          dias_atraso := CASE m WHEN 1 THEN 15 WHEN 2 THEN 22 ELSE 0 END;
        END IF;
        data_pag := venc + (dias_atraso * INTERVAL '1 day')::INTERVAL;

        INSERT INTO faturas (id, agencia_id, numero_fatura, cliente_id, competencia, data_emissao, data_vencimento, valor_total, valor_pago, status)
        VALUES (fid, ag, num, (cl->>'id')::UUID, comp, venc - INTERVAL '7 days', venc, v_total, v_total, 'pago')
        ON CONFLICT DO NOTHING;

        INSERT INTO fatura_itens (agencia_id, fatura_id, descricao, valor)
        VALUES (ag, fid, 'Serviços de marketing digital — ' || comp, v_total)
        ON CONFLICT DO NOTHING;

        INSERT INTO pagamentos (agencia_id, fatura_id, data_pagamento, valor_pago, forma_pagamento, status, registrado_por)
        VALUES (ag, fid, data_pag, v_total, 'pix', 'confirmado', 'aaaaaaaa-0000-0000-0000-000000000001')
        ON CONFLICT DO NOTHING;

      ELSE
        -- pendente/atrasado (inadimplente: meses 5 e 6 sem pagamento)
        INSERT INTO faturas (id, agencia_id, numero_fatura, cliente_id, competencia, data_emissao, data_vencimento, valor_total, valor_pago, status)
        VALUES (fid, ag, num, (cl->>'id')::UUID, comp, venc - INTERVAL '7 days', venc, v_total, 0, 'atrasado')
        ON CONFLICT DO NOTHING;

        INSERT INTO fatura_itens (agencia_id, fatura_id, descricao, valor)
        VALUES (ag, fid, 'Serviços de marketing digital — ' || comp, v_total)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ================================================================
-- 11. NPS REGISTROS
-- ================================================================
INSERT INTO nps_registros (agencia_id, cliente_id, score, comentario, data_registro, responsavel_id) VALUES
  -- C1: promotor consistente
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 9,  'Excelente trabalho! Aumentamos 40% nas consultas online.',  (CURRENT_DATE - INTERVAL '3 months')::DATE,  'aaaaaaaa-0000-0000-0000-000000000002'),
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 10, 'Melhor investimento que fizemos. Super recomendo!',          (CURRENT_DATE - INTERVAL '9 months')::DATE,  'aaaaaaaa-0000-0000-0000-000000000002'),
  -- C2: promotor forte
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002', 10, 'Resultados excepcionais. ROI acima das expectativas.',       (CURRENT_DATE - INTERVAL '2 months')::DATE,  'aaaaaaaa-0000-0000-0000-000000000002'),
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002', 9,  'Equipe muito dedicada e resultados constantes.',             (CURRENT_DATE - INTERVAL '8 months')::DATE,  'aaaaaaaa-0000-0000-0000-000000000002'),
  -- C3: neutro/crescendo
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003', 7,  'Ainda no começo, mas já vendo engajamento crescer.',         (CURRENT_DATE - INTERVAL '2 months')::DATE,  'aaaaaaaa-0000-0000-0000-000000000003'),
  -- C4: promotor
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000004', 9,  'Ótima comunicação e relatórios claros.',                     (CURRENT_DATE - INTERVAL '1 month')::DATE,   'aaaaaaaa-0000-0000-0000-000000000003'),
  -- C5: detrator (inadimplente)
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000005', 4,  'Resultados abaixo do esperado nos últimos meses.',           (CURRENT_DATE - INTERVAL '4 months')::DATE,  'aaaaaaaa-0000-0000-0000-000000000002'),
  -- C6: neutro (novo)
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000006', 8,  'Boa organização e equipe atenciosa. Aguardando resultados.', (CURRENT_DATE - INTERVAL '2 months')::DATE,  'aaaaaaaa-0000-0000-0000-000000000003'),
  -- C8: promotor (mais antigo)
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000008', 10, 'Parceiros há 3 anos. Triplicamos a captação de pacientes!', (CURRENT_DATE - INTERVAL '1 month')::DATE,   'aaaaaaaa-0000-0000-0000-000000000002'),
  ('a0a0a0a0-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000008', 9,  'Consistency perfeita ao longo dos anos.',                   (CURRENT_DATE - INTERVAL '13 months')::DATE, 'aaaaaaaa-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- ================================================================
-- 12. MRR HISTÓRICO — 12 meses (crescimento gradual)
-- ================================================================
INSERT INTO mrr_historico (agencia_id, competencia, mrr, arr, clientes_ativos) VALUES
  ('a0a0a0a0-0000-0000-0000-000000000001', TO_CHAR(CURRENT_DATE - INTERVAL '11 months', 'YYYY-MM'), 7200.00,  86400.00,  5),
  ('a0a0a0a0-0000-0000-0000-000000000001', TO_CHAR(CURRENT_DATE - INTERVAL '10 months', 'YYYY-MM'), 7200.00,  86400.00,  5),
  ('a0a0a0a0-0000-0000-0000-000000000001', TO_CHAR(CURRENT_DATE - INTERVAL '9 months',  'YYYY-MM'), 8900.00,  106800.00, 6),
  ('a0a0a0a0-0000-0000-0000-000000000001', TO_CHAR(CURRENT_DATE - INTERVAL '8 months',  'YYYY-MM'), 8900.00,  106800.00, 6),
  ('a0a0a0a0-0000-0000-0000-000000000001', TO_CHAR(CURRENT_DATE - INTERVAL '7 months',  'YYYY-MM'), 9700.00,  116400.00, 6),
  ('a0a0a0a0-0000-0000-0000-000000000001', TO_CHAR(CURRENT_DATE - INTERVAL '6 months',  'YYYY-MM'), 9700.00,  116400.00, 6),
  ('a0a0a0a0-0000-0000-0000-000000000001', TO_CHAR(CURRENT_DATE - INTERVAL '5 months',  'YYYY-MM'), 10500.00, 126000.00, 7),
  ('a0a0a0a0-0000-0000-0000-000000000001', TO_CHAR(CURRENT_DATE - INTERVAL '4 months',  'YYYY-MM'), 11300.00, 135600.00, 7),
  ('a0a0a0a0-0000-0000-0000-000000000001', TO_CHAR(CURRENT_DATE - INTERVAL '3 months',  'YYYY-MM'), 11300.00, 135600.00, 7),
  ('a0a0a0a0-0000-0000-0000-000000000001', TO_CHAR(CURRENT_DATE - INTERVAL '2 months',  'YYYY-MM'), 12100.00, 145200.00, 8),
  ('a0a0a0a0-0000-0000-0000-000000000001', TO_CHAR(CURRENT_DATE - INTERVAL '1 month',   'YYYY-MM'), 12100.00, 145200.00, 8),
  ('a0a0a0a0-0000-0000-0000-000000000001', TO_CHAR(CURRENT_DATE,                         'YYYY-MM'), 12100.00, 145200.00, 8)
ON CONFLICT (agencia_id, competencia) DO UPDATE
  SET mrr = EXCLUDED.mrr, arr = EXCLUDED.arr, clientes_ativos = EXCLUDED.clientes_ativos;
