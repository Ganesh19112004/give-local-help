-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE public.app_role AS ENUM ('donor', 'ngo', 'admin', 'volunteer');
CREATE TYPE public.donation_category AS ENUM ('stationary', 'books', 'clothes', 'electronics', 'money');
CREATE TYPE public.donation_status AS ENUM (
  'Requested', 'Accepted', 'Volunteer Assigned', 'Picked Up', 'Delivered', 'Cancelled', 'Rejected'
);
CREATE TYPE public.pickup_status AS ENUM ('Assigned', 'En route', 'Picked Up', 'Delivered', 'Cancelled');

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'donor',
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  lat NUMERIC,
  lng NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view all profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- USER ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- ROLE CHECK FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- ============================================
-- NGOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ngos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  registration_doc_path TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  lat NUMERIC,
  lng NUMERIC,
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  UNIQUE(profile_id)
);

ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active NGOs"
  ON public.ngos FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "NGO users can manage their NGO"
  ON public.ngos FOR ALL
  USING (profile_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============================================
-- DONATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ngo_id UUID REFERENCES public.ngos(id) ON DELETE CASCADE,
  category public.donation_category NOT NULL,
  description TEXT,
  amount NUMERIC,
  pickup_address TEXT NOT NULL,
  preferred_pickup_date TIMESTAMPTZ,
  status public.donation_status DEFAULT 'Requested',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all donations"
  ON public.donations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Donors can manage own donations"
  ON public.donations FOR ALL USING (donor_id = auth.uid());

CREATE POLICY "NGOs can view donations for their organization"
  ON public.donations FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id = donations.ngo_id AND ngos.profile_id = auth.uid()
    )
  );

-- ============================================
-- DONATION ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.donation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES public.donations(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  condition TEXT,
  image_path TEXT
);

ALTER TABLE public.donation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Linked users can view donation items"
  ON public.donation_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.donations
      WHERE donations.id = donation_items.donation_id
        AND (
          donations.donor_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
          OR EXISTS (
            SELECT 1 FROM public.ngos
            WHERE ngos.id = donations.ngo_id AND ngos.profile_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Donors can insert items for their donations"
  ON public.donation_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.donations
      WHERE donations.id = donation_items.donation_id
      AND donations.donor_id = auth.uid()
    )
  );

-- ============================================
-- VOLUNTEERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ngo_id UUID REFERENCES public.ngos(id) ON DELETE CASCADE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, ngo_id)
);

ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can access all volunteers"
  ON public.volunteers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Volunteers can view their own data"
  ON public.volunteers FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "NGOs can manage their volunteers"
  ON public.volunteers FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id = volunteers.ngo_id AND ngos.profile_id = auth.uid()
    )
  );

-- ============================================
-- PICKUPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES public.donations(id) ON DELETE CASCADE NOT NULL,
  volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  status public.pickup_status DEFAULT 'Assigned',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can access all pickups"
  ON public.pickups FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Donors can view pickups for their donations"
  ON public.pickups FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.donations
      WHERE donations.id = pickups.donation_id
      AND donations.donor_id = auth.uid()
    )
  );

CREATE POLICY "Volunteers can update their pickup status"
  ON public.pickups FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.volunteers
      WHERE volunteers.id = pickups.volunteer_id
      AND volunteers.profile_id = auth.uid()
    )
  );

-- ============================================
-- NGO POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ngo_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID REFERENCES public.ngos(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category public.donation_category,
  quantity_needed INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.ngo_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view NGO posts"
  ON public.ngo_posts FOR SELECT USING (true);

CREATE POLICY "NGOs and Admins can manage their posts"
  ON public.ngo_posts FOR ALL USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id = ngo_posts.ngo_id AND ngos.profile_id = auth.uid()
    )
  );

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs"
  ON public.audit_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('ngo-documents', 'ngo-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('donation-items', 'donation-items', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================
CREATE POLICY "NGOs and Admins can upload/view registration docs"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'ngo-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'ngo-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Authenticated users can upload donation item images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'donation-items' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view donation images"
  ON storage.objects FOR SELECT USING (bucket_id = 'donation-items');

-- ============================================
-- AUTO PROFILE CREATION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'donor'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'donor')
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pickups_updated_at
  BEFORE UPDATE ON public.pickups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ADMIN APPROVAL TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.pending_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE public.pending_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view/insert their admin requests"
  ON public.pending_admins FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can insert their own requests"
  ON public.pending_admins FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins can view and update all requests"
  ON public.pending_admins FOR ALL USING (public.has_role(auth.uid(), 'admin'));
