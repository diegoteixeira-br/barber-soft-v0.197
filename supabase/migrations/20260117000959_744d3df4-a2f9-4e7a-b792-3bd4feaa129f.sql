-- Add lunch break fields to barbers table
ALTER TABLE public.barbers
ADD COLUMN lunch_break_enabled boolean DEFAULT false,
ADD COLUMN lunch_break_start time DEFAULT '12:00',
ADD COLUMN lunch_break_end time DEFAULT '13:00';