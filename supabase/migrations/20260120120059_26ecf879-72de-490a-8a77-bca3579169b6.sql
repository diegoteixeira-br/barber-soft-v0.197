-- Create client_dependents table for family members
CREATE TABLE public.client_dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  birth_date DATE,
  relationship TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add dependent tracking to appointments
ALTER TABLE public.appointments 
ADD COLUMN dependent_id UUID REFERENCES public.client_dependents(id),
ADD COLUMN is_dependent BOOLEAN DEFAULT false;

-- Enable RLS on client_dependents
ALTER TABLE public.client_dependents ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_dependents (same pattern as clients table)
CREATE POLICY "Users can view dependents from their units"
ON public.client_dependents
FOR SELECT
USING (user_owns_unit(unit_id));

CREATE POLICY "Users can create dependents in their units"
ON public.client_dependents
FOR INSERT
WITH CHECK (user_owns_unit(unit_id));

CREATE POLICY "Users can update dependents in their units"
ON public.client_dependents
FOR UPDATE
USING (user_owns_unit(unit_id));

CREATE POLICY "Users can delete dependents from their units"
ON public.client_dependents
FOR DELETE
USING (user_owns_unit(unit_id));

-- Create index for faster lookups
CREATE INDEX idx_client_dependents_client_id ON public.client_dependents(client_id);
CREATE INDEX idx_client_dependents_unit_id ON public.client_dependents(unit_id);
CREATE INDEX idx_appointments_dependent_id ON public.appointments(dependent_id);