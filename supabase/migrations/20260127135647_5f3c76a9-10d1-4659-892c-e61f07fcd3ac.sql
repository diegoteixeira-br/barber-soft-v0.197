-- Add new columns to saas_settings for plan pricing and tracking pixels
ALTER TABLE public.saas_settings
ADD COLUMN IF NOT EXISTS inicial_plan_price DECIMAL(10,2) DEFAULT 99.00,
ADD COLUMN IF NOT EXISTS inicial_plan_annual_price DECIMAL(10,2) DEFAULT 79.00,
ADD COLUMN IF NOT EXISTS profissional_plan_price DECIMAL(10,2) DEFAULT 199.00,
ADD COLUMN IF NOT EXISTS profissional_plan_annual_price DECIMAL(10,2) DEFAULT 159.00,
ADD COLUMN IF NOT EXISTS franquias_plan_price DECIMAL(10,2) DEFAULT 499.00,
ADD COLUMN IF NOT EXISTS franquias_plan_annual_price DECIMAL(10,2) DEFAULT 399.00,
ADD COLUMN IF NOT EXISTS annual_discount_percent INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT,
ADD COLUMN IF NOT EXISTS meta_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_tag_id TEXT,
ADD COLUMN IF NOT EXISTS google_conversion_id TEXT,
ADD COLUMN IF NOT EXISTS tiktok_pixel_id TEXT;

-- Create plan_features table
CREATE TABLE IF NOT EXISTS public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('limit', 'boolean')),
  inicial_value TEXT,
  profissional_value TEXT,
  franquias_value TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

-- RLS policies for super_admin only
CREATE POLICY "Super admins can view plan features"
ON public.plan_features FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Super admins can insert plan features"
ON public.plan_features FOR INSERT
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update plan features"
ON public.plan_features FOR UPDATE
USING (public.is_super_admin());

CREATE POLICY "Super admins can delete plan features"
ON public.plan_features FOR DELETE
USING (public.is_super_admin());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_plan_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_plan_features_updated_at
BEFORE UPDATE ON public.plan_features
FOR EACH ROW
EXECUTE FUNCTION public.update_plan_features_updated_at();

-- Insert default features
INSERT INTO public.plan_features (feature_key, feature_name, feature_type, inicial_value, profissional_value, franquias_value, display_order) VALUES
('max_units', 'Unidades', 'limit', '1', '1', 'unlimited', 1),
('max_professionals', 'Profissionais', 'limit', '5', '10', 'unlimited', 2),
('agenda', 'Agenda completa', 'boolean', 'true', 'true', 'true', 3),
('financial_dashboard', 'Dashboard financeiro', 'boolean', 'true', 'true', 'true', 4),
('client_management', 'Gestão de clientes', 'boolean', 'true', 'true', 'true', 5),
('services_control', 'Controle de serviços', 'boolean', 'true', 'true', 'true', 6),
('whatsapp_integration', 'Integração WhatsApp', 'boolean', 'false', 'true', 'true', 7),
('jackson_ai', 'Jackson IA', 'boolean', 'false', 'true', 'true', 8),
('marketing_automations', 'Marketing e automações', 'boolean', 'false', 'true', 'true', 9),
('auto_commissions', 'Comissões automáticas', 'boolean', 'false', 'true', 'true', 10),
('stock_control', 'Controle de estoque', 'boolean', 'false', 'true', 'true', 11),
('advanced_reports', 'Relatórios avançados', 'boolean', 'false', 'true', 'true', 12),
('consolidated_dashboard', 'Dashboard consolidado', 'boolean', 'false', 'false', 'true', 13)
ON CONFLICT (feature_key) DO NOTHING;