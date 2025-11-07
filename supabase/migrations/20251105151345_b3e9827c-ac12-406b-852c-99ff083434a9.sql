-- Create pending_admins table for admin approval workflow
CREATE TABLE IF NOT EXISTS public.pending_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.pending_admins ENABLE ROW LEVEL SECURITY;

-- Policies for pending_admins
CREATE POLICY "Users can view their own admin request"
  ON public.pending_admins
  FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own admin request"
  ON public.pending_admins
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins can view all pending requests"
  ON public.pending_admins
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pending requests"
  ON public.pending_admins
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Update app_role enum to ensure admin is included (if not already)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'donor', 'ngo', 'volunteer');
  END IF;
END $$;