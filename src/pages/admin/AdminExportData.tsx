import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, 
  Database, 
  Table2, 
  Loader2,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Copy,
  Code,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const DATABASE_TABLES = [
  { name: "appointment_deletions", description: "Histórico de agendamentos deletados", category: "Agendamentos" },
  { name: "appointments", description: "Agendamentos", category: "Agendamentos" },
  { name: "automation_logs", description: "Logs de automações", category: "Marketing" },
  { name: "barbers", description: "Profissionais/Barbeiros", category: "Equipe" },
  { name: "business_hours", description: "Horários de funcionamento", category: "Configurações" },
  { name: "business_settings", description: "Configurações do negócio", category: "Configurações" },
  { name: "campaign_message_logs", description: "Logs de mensagens de campanhas", category: "Marketing" },
  { name: "cancellation_history", description: "Histórico de cancelamentos", category: "Agendamentos" },
  { name: "client_dependents", description: "Dependentes de clientes", category: "Clientes" },
  { name: "clients", description: "Clientes", category: "Clientes" },
  { name: "companies", description: "Empresas/Barbearias", category: "Sistema" },
  { name: "expenses", description: "Despesas", category: "Financeiro" },
  { name: "feedbacks", description: "Feedbacks dos usuários", category: "Sistema" },
  { name: "holidays", description: "Feriados", category: "Configurações" },
  { name: "marketing_campaigns", description: "Campanhas de marketing", category: "Marketing" },
  { name: "message_templates", description: "Templates de mensagens", category: "Marketing" },
  { name: "page_visits", description: "Visitas de páginas", category: "Analytics" },
  { name: "partnership_terms", description: "Termos de parceria", category: "Sistema" },
  { name: "plan_features", description: "Recursos dos planos", category: "Sistema" },
  { name: "product_sales", description: "Vendas de produtos", category: "Financeiro" },
  { name: "products", description: "Produtos", category: "Financeiro" },
  { name: "saas_settings", description: "Configurações do SaaS", category: "Sistema" },
  { name: "services", description: "Serviços oferecidos", category: "Serviços" },
  { name: "term_acceptances", description: "Aceites de termos", category: "Sistema" },
  { name: "units", description: "Unidades/Filiais", category: "Sistema" },
  { name: "user_roles", description: "Roles de usuários", category: "Sistema" },
];

// SQL definitions for all tables
const TABLE_SQL: Record<string, string> = {
  appointment_deletions: `CREATE TABLE public.appointment_deletions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id),
  company_id UUID REFERENCES public.companies(id),
  appointment_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  barber_name TEXT NOT NULL,
  service_name TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_price NUMERIC NOT NULL DEFAULT 0,
  original_status TEXT NOT NULL,
  payment_method TEXT,
  deleted_by TEXT NOT NULL,
  deletion_reason TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointment_deletions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create deletions in their units" ON public.appointment_deletions
  FOR INSERT WITH CHECK (user_owns_unit(unit_id));
CREATE POLICY "Users can view deletions from their units" ON public.appointment_deletions
  FOR SELECT USING (user_owns_unit(unit_id));`,

  appointments: `CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id),
  company_id UUID REFERENCES public.companies(id),
  barber_id UUID REFERENCES public.barbers(id),
  service_id UUID REFERENCES public.services(id),
  dependent_id UUID REFERENCES public.client_dependents(id),
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_birth_date DATE,
  is_dependent BOOLEAN DEFAULT false,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  total_price NUMERIC NOT NULL,
  payment_method TEXT,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create appointments in their units" ON public.appointments
  FOR INSERT WITH CHECK (user_owns_unit(unit_id));
CREATE POLICY "Users can view appointments from their units" ON public.appointments
  FOR SELECT USING (user_owns_unit(unit_id));
CREATE POLICY "Users can update appointments in their units" ON public.appointments
  FOR UPDATE USING (user_owns_unit(unit_id));
CREATE POLICY "Users can delete appointments from their units" ON public.appointments
  FOR DELETE USING (user_owns_unit(unit_id));`,

  automation_logs: `CREATE TABLE public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  client_id UUID REFERENCES public.clients(id),
  appointment_id UUID REFERENCES public.appointments(id),
  automation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert automation logs for their company" ON public.automation_logs
  FOR INSERT WITH CHECK (user_owns_company(company_id));
CREATE POLICY "Users can view their company automation logs" ON public.automation_logs
  FOR SELECT USING (user_owns_company(company_id));`,

  barbers: `CREATE TABLE public.barbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id),
  company_id UUID REFERENCES public.companies(id),
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  calendar_color TEXT DEFAULT '#FF6B00',
  commission_rate INTEGER DEFAULT 50,
  debit_card_fee_percent NUMERIC,
  credit_card_fee_percent NUMERIC,
  lunch_break_enabled BOOLEAN DEFAULT false,
  lunch_break_start TIME DEFAULT '12:00:00',
  lunch_break_end TIME DEFAULT '13:00:00',
  is_active BOOLEAN DEFAULT true,
  invite_token UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create barbers in their units" ON public.barbers
  FOR INSERT WITH CHECK (user_owns_unit(unit_id));
CREATE POLICY "Users can view barbers from their units" ON public.barbers
  FOR SELECT USING (user_owns_unit(unit_id));
CREATE POLICY "Users can update barbers in their units" ON public.barbers
  FOR UPDATE USING (user_owns_unit(unit_id));
CREATE POLICY "Users can delete barbers from their units" ON public.barbers
  FOR DELETE USING (user_owns_unit(unit_id));`,

  business_hours: `CREATE TABLE public.business_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL,
  is_open BOOLEAN DEFAULT true,
  opening_time TIME,
  closing_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their own business hours" ON public.business_hours
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own business hours" ON public.business_hours
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own business hours" ON public.business_hours
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own business hours" ON public.business_hours
  FOR DELETE USING (auth.uid() = user_id);`,

  business_settings: `CREATE TABLE public.business_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_name TEXT,
  logo_url TEXT,
  opening_time TIME DEFAULT '09:00:00',
  closing_time TIME DEFAULT '19:00:00',
  webhook_url TEXT,
  -- Fidelity settings
  fidelity_program_enabled BOOLEAN DEFAULT false,
  fidelity_cuts_threshold INTEGER DEFAULT 10,
  fidelity_min_value NUMERIC DEFAULT 30.00,
  -- Commission settings
  commission_calculation_base TEXT DEFAULT 'gross',
  debit_card_fee_percent NUMERIC DEFAULT 1.50,
  credit_card_fee_percent NUMERIC DEFAULT 3.00,
  -- Cancellation settings
  cancellation_time_limit_minutes INTEGER DEFAULT 60,
  late_cancellation_fee_percent INTEGER DEFAULT 50,
  no_show_fee_percent INTEGER DEFAULT 100,
  -- Automation settings
  birthday_automation_enabled BOOLEAN DEFAULT false,
  birthday_message_template TEXT,
  rescue_automation_enabled BOOLEAN DEFAULT false,
  rescue_days_threshold INTEGER DEFAULT 30,
  rescue_message_template TEXT,
  automation_send_hour INTEGER DEFAULT 11,
  automation_send_minute INTEGER DEFAULT 30,
  -- Reminder settings
  appointment_reminder_enabled BOOLEAN DEFAULT false,
  appointment_reminder_minutes INTEGER DEFAULT 30,
  appointment_reminder_template TEXT,
  -- Vocal settings
  vocal_notification_enabled BOOLEAN DEFAULT true,
  vocal_confirmation_enabled BOOLEAN DEFAULT true,
  vocal_cancellation_enabled BOOLEAN DEFAULT true,
  -- Deletion password
  deletion_password_enabled BOOLEAN DEFAULT false,
  deletion_password_hash TEXT,
  deletion_password_reset_token TEXT,
  deletion_password_reset_expires TIMESTAMP WITH TIME ZONE,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their own settings" ON public.business_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own settings" ON public.business_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.business_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON public.business_settings
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Super admin can read all business_settings" ON public.business_settings
  FOR SELECT USING (is_super_admin());`,

  campaign_message_logs: `CREATE TABLE public.campaign_message_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id),
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  recipient_type TEXT NOT NULL DEFAULT 'client',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_message_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create logs for their campaigns" ON public.campaign_message_logs
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM marketing_campaigns mc
    WHERE mc.id = campaign_id AND user_owns_company(mc.company_id)
  ));
CREATE POLICY "Users can view logs from their campaigns" ON public.campaign_message_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM marketing_campaigns mc
    WHERE mc.id = campaign_id AND user_owns_company(mc.company_id)
  ));`,

  cancellation_history: `CREATE TABLE public.cancellation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id),
  company_id UUID REFERENCES public.companies(id),
  appointment_id UUID,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  barber_name TEXT NOT NULL,
  service_name TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cancellation_source TEXT NOT NULL DEFAULT 'manual',
  minutes_before INTEGER NOT NULL DEFAULT 0,
  is_late_cancellation BOOLEAN NOT NULL DEFAULT false,
  is_no_show BOOLEAN NOT NULL DEFAULT false,
  total_price NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cancellation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create cancellation history in their units" ON public.cancellation_history
  FOR INSERT WITH CHECK (user_owns_unit(unit_id));
CREATE POLICY "Users can view cancellation history from their units" ON public.cancellation_history
  FOR SELECT USING (user_owns_unit(unit_id));
CREATE POLICY "Users can delete cancellation history from their units" ON public.cancellation_history
  FOR DELETE USING (user_owns_unit(unit_id));`,

  client_dependents: `CREATE TABLE public.client_dependents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  unit_id UUID NOT NULL REFERENCES public.units(id),
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  relationship TEXT,
  birth_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_dependents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create dependents in their units" ON public.client_dependents
  FOR INSERT WITH CHECK (user_owns_unit(unit_id));
CREATE POLICY "Users can view dependents from their units" ON public.client_dependents
  FOR SELECT USING (user_owns_unit(unit_id));
CREATE POLICY "Users can update dependents in their units" ON public.client_dependents
  FOR UPDATE USING (user_owns_unit(unit_id));
CREATE POLICY "Users can delete dependents from their units" ON public.client_dependents
  FOR DELETE USING (user_owns_unit(unit_id));`,

  clients: `CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id),
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  birth_date DATE,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  -- Visit tracking
  total_visits INTEGER DEFAULT 0,
  last_visit_at TIMESTAMP WITH TIME ZONE,
  -- Fidelity program
  loyalty_cuts INTEGER DEFAULT 0,
  available_courtesies INTEGER DEFAULT 0,
  total_courtesies_earned INTEGER DEFAULT 0,
  -- Marketing opt-out
  marketing_opt_out BOOLEAN DEFAULT false,
  opted_out_at TIMESTAMP WITH TIME ZONE,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create clients in their units" ON public.clients
  FOR INSERT WITH CHECK (user_owns_unit(unit_id));
CREATE POLICY "Users can view clients from their units" ON public.clients
  FOR SELECT USING (user_owns_unit(unit_id));
CREATE POLICY "Users can update clients in their units" ON public.clients
  FOR UPDATE USING (user_owns_unit(unit_id));
CREATE POLICY "Users can delete clients from their units" ON public.clients
  FOR DELETE USING (user_owns_unit(unit_id));`,

  companies: `CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  -- Subscription
  plan_status TEXT DEFAULT 'trial',
  plan_type TEXT DEFAULT 'professional',
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  monthly_price NUMERIC DEFAULT 0,
  -- Stripe
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  -- Evolution API (WhatsApp)
  evolution_instance_name TEXT,
  evolution_api_key TEXT,
  -- Partner program
  is_partner BOOLEAN DEFAULT false,
  partner_started_at TIMESTAMP WITH TIME ZONE,
  partner_ends_at TIMESTAMP WITH TIME ZONE,
  partner_renewed_count INTEGER DEFAULT 0,
  partner_notes TEXT,
  -- Status
  is_blocked BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP WITH TIME ZONE,
  signup_source TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their own companies" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can view their own companies" ON public.companies
  FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can update their own companies" ON public.companies
  FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete their own companies" ON public.companies
  FOR DELETE USING (auth.uid() = owner_user_id);
CREATE POLICY "Super admin can read all companies" ON public.companies
  FOR SELECT USING (is_super_admin());
CREATE POLICY "Super admin can update all companies" ON public.companies
  FOR UPDATE USING (is_super_admin());
CREATE POLICY "Super admin can delete companies" ON public.companies
  FOR DELETE USING (is_super_admin());`,

  expenses: `CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id),
  company_id UUID REFERENCES public.companies(id),
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create expenses in their units" ON public.expenses
  FOR INSERT WITH CHECK (user_owns_unit(unit_id));
CREATE POLICY "Users can view expenses from their units" ON public.expenses
  FOR SELECT USING (user_owns_unit(unit_id));
CREATE POLICY "Users can update expenses in their units" ON public.expenses
  FOR UPDATE USING (user_owns_unit(unit_id));
CREATE POLICY "Users can delete expenses from their units" ON public.expenses
  FOR DELETE USING (user_owns_unit(unit_id));`,

  feedbacks: `CREATE TABLE public.feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id),
  type TEXT NOT NULL DEFAULT 'feedback',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create feedbacks" ON public.feedbacks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own feedbacks" ON public.feedbacks
  FOR SELECT USING (auth.uid() = user_id OR is_super_admin());
CREATE POLICY "Super admin can update feedbacks" ON public.feedbacks
  FOR UPDATE USING (is_super_admin());`,

  holidays: `CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their own holidays" ON public.holidays
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own holidays" ON public.holidays
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own holidays" ON public.holidays
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own holidays" ON public.holidays
  FOR DELETE USING (auth.uid() = user_id);`,

  marketing_campaigns: `CREATE TABLE public.marketing_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  unit_id UUID REFERENCES public.units(id),
  message_template TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create campaigns for their company" ON public.marketing_campaigns
  FOR INSERT WITH CHECK (user_owns_company(company_id));
CREATE POLICY "Users can view their company campaigns" ON public.marketing_campaigns
  FOR SELECT USING (user_owns_company(company_id));
CREATE POLICY "Users can update their company campaigns" ON public.marketing_campaigns
  FOR UPDATE USING (user_owns_company(company_id));`,

  message_templates: `CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'personalizado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their own templates" ON public.message_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own templates" ON public.message_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON public.message_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.message_templates
  FOR DELETE USING (auth.uid() = user_id);`,

  page_visits: `CREATE TABLE public.page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path VARCHAR NOT NULL,
  referrer VARCHAR,
  user_agent VARCHAR,
  ip_hash TEXT,
  session_id VARCHAR,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can insert visits" ON public.page_visits
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert page visits with validation" ON public.page_visits
  FOR INSERT WITH CHECK (
    page_path IS NOT NULL 
    AND length(page_path) > 0 
    AND length(page_path) <= 500
  );
CREATE POLICY "Super admin can read visits" ON public.page_visits
  FOR SELECT USING (is_super_admin());`,

  partnership_terms: `CREATE TABLE public.partnership_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partnership_terms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Owners can manage their company terms" ON public.partnership_terms
  FOR ALL USING (user_owns_company(company_id));
CREATE POLICY "Barbers can view active terms from their company" ON public.partnership_terms
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM barbers b
      WHERE b.user_id = auth.uid() AND b.company_id = partnership_terms.company_id
    )
  );`,

  plan_features: `CREATE TABLE public.plan_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  feature_type TEXT NOT NULL,
  inicial_value TEXT,
  profissional_value TEXT,
  franquias_value TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can view plan features" ON public.plan_features
  FOR SELECT USING (is_super_admin());
CREATE POLICY "Super admins can insert plan features" ON public.plan_features
  FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY "Super admins can update plan features" ON public.plan_features
  FOR UPDATE USING (is_super_admin());
CREATE POLICY "Super admins can delete plan features" ON public.plan_features
  FOR DELETE USING (is_super_admin());`,

  product_sales: `CREATE TABLE public.product_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id),
  company_id UUID REFERENCES public.companies(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  barber_id UUID REFERENCES public.barbers(id),
  appointment_id UUID REFERENCES public.appointments(id),
  client_name TEXT,
  client_phone TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  payment_method TEXT,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create product_sales in their units" ON public.product_sales
  FOR INSERT WITH CHECK (user_owns_unit(unit_id));
CREATE POLICY "Users can view product_sales from their units" ON public.product_sales
  FOR SELECT USING (user_owns_unit(unit_id));
CREATE POLICY "Users can update product_sales in their units" ON public.product_sales
  FOR UPDATE USING (user_owns_unit(unit_id));
CREATE POLICY "Users can delete product_sales from their units" ON public.product_sales
  FOR DELETE USING (user_owns_unit(unit_id));`,

  products: `CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id),
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create products in their units" ON public.products
  FOR INSERT WITH CHECK (user_owns_unit(unit_id));
CREATE POLICY "Users can view products from their units" ON public.products
  FOR SELECT USING (user_owns_unit(unit_id));
CREATE POLICY "Users can update products in their units" ON public.products
  FOR UPDATE USING (user_owns_unit(unit_id));
CREATE POLICY "Users can delete products from their units" ON public.products
  FOR DELETE USING (user_owns_unit(unit_id));`,

  saas_settings: `CREATE TABLE public.saas_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Trial settings
  default_trial_days INTEGER DEFAULT 14,
  -- Plan pricing (monthly)
  inicial_plan_price NUMERIC DEFAULT 99.00,
  profissional_plan_price NUMERIC DEFAULT 199.00,
  franquias_plan_price NUMERIC DEFAULT 499.00,
  -- Plan pricing (annual)
  inicial_plan_annual_price NUMERIC DEFAULT 79.00,
  profissional_plan_annual_price NUMERIC DEFAULT 159.00,
  franquias_plan_annual_price NUMERIC DEFAULT 399.00,
  annual_discount_percent INTEGER DEFAULT 20,
  -- Legacy pricing
  professional_plan_price NUMERIC DEFAULT 149.90,
  elite_plan_price NUMERIC DEFAULT 249.90,
  empire_plan_price NUMERIC DEFAULT 449.90,
  -- Stripe settings
  stripe_mode TEXT DEFAULT 'test',
  stripe_test_publishable_key TEXT,
  stripe_test_secret_key TEXT,
  stripe_live_publishable_key TEXT,
  stripe_live_secret_key TEXT,
  stripe_webhook_secret TEXT,
  -- Tracking pixels
  meta_pixel_id TEXT,
  meta_access_token TEXT,
  google_tag_id TEXT,
  google_conversion_id TEXT,
  tiktok_pixel_id TEXT,
  -- Maintenance mode
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT,
  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.saas_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admin full access on saas_settings" ON public.saas_settings
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());`,

  services: `CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id),
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create services in their units" ON public.services
  FOR INSERT WITH CHECK (user_owns_unit(unit_id));
CREATE POLICY "Users can view services from their units" ON public.services
  FOR SELECT USING (user_owns_unit(unit_id));
CREATE POLICY "Users can update services in their units" ON public.services
  FOR UPDATE USING (user_owns_unit(unit_id));
CREATE POLICY "Users can delete services from their units" ON public.services
  FOR DELETE USING (user_owns_unit(unit_id));`,

  term_acceptances: `CREATE TABLE public.term_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES public.barbers(id),
  term_id UUID NOT NULL REFERENCES public.partnership_terms(id),
  user_id UUID NOT NULL,
  commission_rate_snapshot INTEGER NOT NULL,
  content_snapshot TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.term_acceptances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Barbers can create their own acceptances" ON public.term_acceptances
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Barbers can view their own acceptances" ON public.term_acceptances
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can view acceptances from their company" ON public.term_acceptances
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM barbers b JOIN companies c ON b.company_id = c.id
    WHERE b.id = term_acceptances.barber_id AND c.owner_user_id = auth.uid()
  ));`,

  units: `CREATE TABLE public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  manager_name TEXT,
  is_headquarters BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  -- Fidelity settings (per unit)
  fidelity_program_enabled BOOLEAN DEFAULT false,
  fidelity_cuts_threshold INTEGER DEFAULT 10,
  fidelity_min_value NUMERIC DEFAULT 30.00,
  -- Evolution API (WhatsApp per unit)
  evolution_instance_name TEXT,
  evolution_api_key TEXT,
  whatsapp_name TEXT,
  whatsapp_phone TEXT,
  whatsapp_picture_url TEXT,
  -- Agenda API
  agenda_api_key TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their own units" ON public.units
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own units" ON public.units
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own units" ON public.units
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own units" ON public.units
  FOR DELETE USING (auth.uid() = user_id);`,

  user_roles: `CREATE TYPE public.app_role AS ENUM ('owner', 'barber', 'super_admin');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage roles" ON public.user_roles
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');`,
};

// Helper functions SQL
const HELPER_FUNCTIONS_SQL = `-- ========================================
-- FUNÇÕES AUXILIARES (criar primeiro)
-- ========================================

-- Função para verificar se usuário é dono da unidade
CREATE OR REPLACE FUNCTION public.user_owns_unit(unit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.units
    WHERE id = unit_id 
    AND user_id = auth.uid()
    AND auth.uid() IS NOT NULL
  )
$$;

-- Função para verificar se usuário é dono da empresa
CREATE OR REPLACE FUNCTION public.user_owns_company(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = p_company_id AND owner_user_id = auth.uid()
  )
$$;

-- Função para verificar se é super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
$$;

-- Função para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;`;

const CATEGORIES = [...new Set(DATABASE_TABLES.map(t => t.category))];

export default function AdminExportData() {
  const { toast } = useToast();
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [loadingTable, setLoadingTable] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);
  const [openSqlTables, setOpenSqlTables] = useState<string[]>([]);

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const selectAll = () => {
    setSelectedTables(DATABASE_TABLES.map(t => t.name));
  };

  const deselectAll = () => {
    setSelectedTables([]);
  };

  const selectCategory = (category: string) => {
    const categoryTables = DATABASE_TABLES.filter(t => t.category === category).map(t => t.name);
    const allSelected = categoryTables.every(t => selectedTables.includes(t));
    
    if (allSelected) {
      setSelectedTables(prev => prev.filter(t => !categoryTables.includes(t)));
    } else {
      setSelectedTables(prev => [...new Set([...prev, ...categoryTables])]);
    }
  };

  const toggleSqlTable = (tableName: string) => {
    setOpenSqlTables(prev => 
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: `SQL de ${label} copiado para a área de transferência.`,
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  const copyAllSql = async () => {
    let fullSql = HELPER_FUNCTIONS_SQL + "\n\n";
    fullSql += "-- ========================================\n";
    fullSql += "-- TABELAS DO SISTEMA\n";
    fullSql += "-- ========================================\n\n";
    
    for (const table of DATABASE_TABLES) {
      if (TABLE_SQL[table.name]) {
        fullSql += `-- ========== ${table.name.toUpperCase()} ==========\n`;
        fullSql += TABLE_SQL[table.name] + "\n\n";
      }
    }
    
    await copyToClipboard(fullSql, "todas as tabelas");
  };

  const convertToCSV = (data: any[], tableName: string): string => {
    if (!data || data.length === 0) {
      return `# Tabela: ${tableName}\n# Sem dados disponíveis\n`;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTable = async (tableName: string) => {
    setLoadingTable(tableName);
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .limit(50000);

      if (error) throw error;

      const csv = convertToCSV(data || [], tableName);
      const timestamp = new Date().toISOString().split("T")[0];
      downloadCSV(csv, `${tableName}_${timestamp}.csv`);

      toast({
        title: "Exportação concluída",
        description: `Tabela ${tableName} exportada com ${data?.length || 0} registros.`,
      });
    } catch (error: any) {
      console.error(`Error exporting ${tableName}:`, error);
      toast({
        title: "Erro na exportação",
        description: error.message || `Não foi possível exportar a tabela ${tableName}`,
        variant: "destructive",
      });
    } finally {
      setLoadingTable(null);
    }
  };

  const exportSelected = async () => {
    if (selectedTables.length === 0) {
      toast({
        title: "Nenhuma tabela selecionada",
        description: "Selecione pelo menos uma tabela para exportar.",
        variant: "destructive",
      });
      return;
    }

    setExportingAll(true);
    const timestamp = new Date().toISOString().split("T")[0];
    let combinedCSV = "";
    let totalRecords = 0;
    let exportedTables = 0;

    for (const tableName of selectedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName as any)
          .select("*")
          .limit(50000);

        if (error) {
          console.error(`Error exporting ${tableName}:`, error);
          combinedCSV += `\n\n# ========== TABELA: ${tableName} ==========\n`;
          combinedCSV += `# ERRO: ${error.message}\n`;
          continue;
        }

        combinedCSV += `\n\n# ========== TABELA: ${tableName} (${data?.length || 0} registros) ==========\n`;
        combinedCSV += convertToCSV(data || [], tableName);
        totalRecords += data?.length || 0;
        exportedTables++;
      } catch (err: any) {
        combinedCSV += `\n\n# ========== TABELA: ${tableName} ==========\n`;
        combinedCSV += `# ERRO: ${err.message}\n`;
      }
    }

    downloadCSV(combinedCSV, `barbersoft_export_${timestamp}.csv`);

    toast({
      title: "Exportação concluída",
      description: `${exportedTables} tabelas exportadas com ${totalRecords} registros no total.`,
    });

    setExportingAll(false);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Agendamentos": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Marketing": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "Equipe": "bg-green-500/20 text-green-400 border-green-500/30",
      "Configurações": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      "Clientes": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      "Sistema": "bg-slate-500/20 text-slate-400 border-slate-500/30",
      "Financeiro": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "Analytics": "bg-pink-500/20 text-pink-400 border-pink-500/30",
      "Serviços": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return colors[category] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-400" />
              Exportar Dados
            </h1>
            <p className="text-slate-400 mt-1">
              Exporte os dados do banco de dados em formato CSV ou copie o SQL das tabelas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
              {selectedTables.length} de {DATABASE_TABLES.length} selecionadas
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="export" className="data-[state=active]:bg-blue-600">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </TabsTrigger>
            <TabsTrigger value="sql" className="data-[state=active]:bg-blue-600">
              <Code className="h-4 w-4 mr-2" />
              SQL das Tabelas
            </TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6 mt-6">
            {/* Actions Card */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-400" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Selecionar Todas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Limpar Seleção
                  </Button>
                  <div className="border-l border-slate-600 mx-2" />
                  {CATEGORIES.map(category => (
                    <Button
                      key={category}
                      variant="outline"
                      size="sm"
                      onClick={() => selectCategory(category)}
                      className={`border-slate-600 hover:bg-slate-700 ${
                        DATABASE_TABLES.filter(t => t.category === category)
                          .every(t => selectedTables.includes(t.name))
                          ? "bg-blue-600/20 border-blue-500/50"
                          : ""
                      }`}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <Button
                    onClick={exportSelected}
                    disabled={selectedTables.length === 0 || exportingAll}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {exportingAll ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar {selectedTables.length} Tabela(s) Selecionada(s)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DATABASE_TABLES.map(table => (
                <Card 
                  key={table.name}
                  className={`bg-slate-800/50 border-slate-700 transition-all cursor-pointer hover:border-blue-500/50 ${
                    selectedTables.includes(table.name) ? "border-blue-500 bg-blue-500/10" : ""
                  }`}
                  onClick={() => toggleTable(table.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedTables.includes(table.name)}
                          onCheckedChange={() => toggleTable(table.name)}
                          className="mt-1"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Table2 className="h-4 w-4 text-slate-400" />
                            <span className="font-mono text-sm text-white">{table.name}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{table.description}</p>
                          <Badge 
                            variant="outline" 
                            className={`mt-2 text-[10px] ${getCategoryColor(table.category)}`}
                          >
                            {table.category}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportTable(table.name);
                        }}
                        disabled={loadingTable === table.name}
                        className="text-slate-400 hover:text-white hover:bg-slate-700"
                      >
                        {loadingTable === table.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Info Card */}
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-400">Informações sobre a exportação</h4>
                    <ul className="text-sm text-amber-300/80 mt-2 space-y-1 list-disc list-inside">
                      <li>Os dados são exportados em formato CSV (compatível com Excel)</li>
                      <li>Limite de 50.000 registros por tabela</li>
                      <li>Algumas tabelas podem ter dados restritos por políticas de segurança (RLS)</li>
                      <li>A exportação múltipla combina todas as tabelas em um único arquivo</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SQL Tab */}
          <TabsContent value="sql" className="space-y-6 mt-6">
            {/* Copy All Button */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Code className="h-5 w-5 text-purple-400" />
                  SQL de Migração
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-4">
                  Copie o SQL de criação das tabelas para migrar a estrutura do banco de dados para outro ambiente.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={copyAllSql}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Todo o SQL (Funções + Tabelas)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(HELPER_FUNCTIONS_SQL, "funções auxiliares")}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Apenas Funções Auxiliares
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Helper Functions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <CardTitle className="text-md text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-yellow-400" />
                        <span className="font-mono">Funções Auxiliares (RLS)</span>
                        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">
                          Executar Primeiro
                        </Badge>
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(HELPER_FUNCTIONS_SQL, "funções auxiliares")}
                        className="absolute top-2 right-2 text-slate-400 hover:text-white hover:bg-slate-700 z-10"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <ScrollArea className="h-[300px] w-full rounded-md border border-slate-700 bg-slate-900/50 p-4">
                        <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                          {HELPER_FUNCTIONS_SQL}
                        </pre>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Tables SQL */}
            <div className="space-y-3">
              {DATABASE_TABLES.map(table => (
                <Card key={table.name} className="bg-slate-800/50 border-slate-700">
                  <Collapsible
                    open={openSqlTables.includes(table.name)}
                    onOpenChange={() => toggleSqlTable(table.name)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-slate-700/50 transition-colors py-3">
                        <CardTitle className="text-sm text-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {openSqlTables.includes(table.name) ? (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                            <Table2 className="h-4 w-4 text-slate-400" />
                            <span className="font-mono">{table.name}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] ${getCategoryColor(table.category)}`}
                            >
                              {table.category}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (TABLE_SQL[table.name]) {
                                copyToClipboard(TABLE_SQL[table.name], table.name);
                              }
                            }}
                            className="text-slate-400 hover:text-white hover:bg-slate-700"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <ScrollArea className="h-[300px] w-full rounded-md border border-slate-700 bg-slate-900/50 p-4">
                          <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                            {TABLE_SQL[table.name] || "-- SQL não disponível para esta tabela"}
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>

            {/* Info Card */}
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Code className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-400">Como usar o SQL de migração</h4>
                    <ol className="text-sm text-blue-300/80 mt-2 space-y-1 list-decimal list-inside">
                      <li>Primeiro, execute as <strong>Funções Auxiliares</strong> para criar as funções RLS</li>
                      <li>Em seguida, execute o SQL das tabelas na ordem de dependência</li>
                      <li>Tabelas como <code>units</code> e <code>companies</code> devem ser criadas primeiro</li>
                      <li>Tabelas com foreign keys devem ser criadas após suas dependências</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
