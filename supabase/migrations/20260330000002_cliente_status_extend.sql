-- Migration: extend cliente_status enum and add story 1.2 support
-- Add 'inativo' and 'suspenso' to the enum
ALTER TYPE cliente_status ADD VALUE IF NOT EXISTS 'inativo';
ALTER TYPE cliente_status ADD VALUE IF NOT EXISTS 'suspenso';
