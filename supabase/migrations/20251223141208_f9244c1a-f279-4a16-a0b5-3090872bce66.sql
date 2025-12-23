-- Create enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Create units table (barbershop locations)
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create barbers table
CREATE TABLE public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  phone TEXT,
  calendar_color TEXT DEFAULT '#FF6B00',
  commission_rate INTEGER DEFAULT 50 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status public.appointment_status DEFAULT 'pending' NOT NULL,
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for units
CREATE POLICY "Users can view their own units" ON public.units
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own units" ON public.units
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own units" ON public.units
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own units" ON public.units
  FOR DELETE USING (auth.uid() = user_id);

-- Helper function to check unit ownership
CREATE OR REPLACE FUNCTION public.user_owns_unit(unit_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.units
    WHERE id = unit_id AND user_id = auth.uid()
  )
$$;

-- RLS Policies for barbers
CREATE POLICY "Users can view barbers from their units" ON public.barbers
  FOR SELECT USING (public.user_owns_unit(unit_id));

CREATE POLICY "Users can create barbers in their units" ON public.barbers
  FOR INSERT WITH CHECK (public.user_owns_unit(unit_id));

CREATE POLICY "Users can update barbers in their units" ON public.barbers
  FOR UPDATE USING (public.user_owns_unit(unit_id));

CREATE POLICY "Users can delete barbers from their units" ON public.barbers
  FOR DELETE USING (public.user_owns_unit(unit_id));

-- RLS Policies for services
CREATE POLICY "Users can view services from their units" ON public.services
  FOR SELECT USING (public.user_owns_unit(unit_id));

CREATE POLICY "Users can create services in their units" ON public.services
  FOR INSERT WITH CHECK (public.user_owns_unit(unit_id));

CREATE POLICY "Users can update services in their units" ON public.services
  FOR UPDATE USING (public.user_owns_unit(unit_id));

CREATE POLICY "Users can delete services from their units" ON public.services
  FOR DELETE USING (public.user_owns_unit(unit_id));

-- RLS Policies for appointments
CREATE POLICY "Users can view appointments from their units" ON public.appointments
  FOR SELECT USING (public.user_owns_unit(unit_id));

CREATE POLICY "Users can create appointments in their units" ON public.appointments
  FOR INSERT WITH CHECK (public.user_owns_unit(unit_id));

CREATE POLICY "Users can update appointments in their units" ON public.appointments
  FOR UPDATE USING (public.user_owns_unit(unit_id));

CREATE POLICY "Users can delete appointments from their units" ON public.appointments
  FOR DELETE USING (public.user_owns_unit(unit_id));

-- Create indexes for better performance
CREATE INDEX idx_barbers_unit_id ON public.barbers(unit_id);
CREATE INDEX idx_services_unit_id ON public.services(unit_id);
CREATE INDEX idx_appointments_unit_id ON public.appointments(unit_id);
CREATE INDEX idx_appointments_barber_id ON public.appointments(barber_id);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);