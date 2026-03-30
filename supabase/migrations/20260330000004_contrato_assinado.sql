-- Migration: Story A — Contrato Assinado + Gate de Ativação
-- Adiciona contrato_pendente ao enum de status do cliente
-- Adiciona campos de assinatura e ClickSign à tabela contratos

-- 1. Novo status de cliente
ALTER TYPE cliente_status ADD VALUE IF NOT EXISTS 'contrato_pendente';

-- 2. Campos de assinatura no contrato
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS is_assinado      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS assinado_em      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assinado_por     UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS clicksign_key    TEXT,
  ADD COLUMN IF NOT EXISTS clicksign_status TEXT,
  ADD COLUMN IF NOT EXISTS clicksign_webhook JSONB;

-- Índice para consultas de contratos assinados
CREATE INDEX IF NOT EXISTS idx_contratos_is_assinado ON contratos(is_assinado) WHERE is_assinado = TRUE;
