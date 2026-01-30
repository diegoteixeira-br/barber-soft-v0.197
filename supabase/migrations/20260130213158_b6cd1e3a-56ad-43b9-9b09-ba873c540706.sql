-- Adicionar colunas para senha de exclusão de agendamentos
ALTER TABLE public.business_settings 
  ADD COLUMN IF NOT EXISTS deletion_password_hash TEXT,
  ADD COLUMN IF NOT EXISTS deletion_password_enabled BOOLEAN DEFAULT false;