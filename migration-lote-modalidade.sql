-- Migration: Adicionar campos de modalidade e custo ao lote
-- Execute este script no seu banco de dados Supabase

ALTER TABLE lotes
  ADD COLUMN IF NOT EXISTS modalidade VARCHAR(20) DEFAULT 'consignado',
  ADD COLUMN IF NOT EXISTS custo_lote DECIMAL(10, 2) DEFAULT NULL;

-- Comentário: modalidade pode ser 'consignado' ou 'custo'
-- custo_lote: valor investido pelo vendedor no lote (apenas quando modalidade = 'custo')
