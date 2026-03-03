
-- 1. Fix admin assignment: Only shreeadsmall@gmail.com can be admin
CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email = 'shreeadsmall@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

-- Remove any existing admin roles that aren't the designated email
-- (We'll handle this via insert tool separately if needed)

-- 2. Analytics: User sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer DEFAULT 0
);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. Analytics: Feature usage
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature_name text NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own usage" ON public.feature_usage
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all usage" ON public.feature_usage
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Analytics: Page visits
CREATE TABLE IF NOT EXISTS public.page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page_name text NOT NULL,
  visited_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own visits" ON public.page_visits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all visits" ON public.page_visits
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Ad analytics
CREATE TABLE IF NOT EXISTS public.ad_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id uuid,
  event_type text NOT NULL, -- 'impression', 'click', 'skip', 'complete'
  view_duration_seconds integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert ad analytics" ON public.ad_analytics
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can view ad analytics" ON public.ad_analytics
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ad_analytics_ad_id ON public.ad_analytics(ad_id);
CREATE INDEX idx_ad_analytics_event ON public.ad_analytics(event_type);

-- 6. Paid promotions
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  duration_days integer NOT NULL DEFAULT 7,
  budget numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected, active, expired
  admin_notes text,
  cost_per_day numeric(10,2) DEFAULT 0,
  cost_per_1000_impressions numeric(10,2) DEFAULT 0,
  is_featured boolean DEFAULT false,
  approved_at timestamptz,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own promotions" ON public.promotions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own promotions" ON public.promotions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all promotions" ON public.promotions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Revenue tracking
CREATE TABLE IF NOT EXISTS public.revenue_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL,
  ad_id uuid REFERENCES public.ads(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'promotion', -- promotion, ad_revenue
  description text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);
ALTER TABLE public.revenue_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage revenue" ON public.revenue_records
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 8. Add approval status to ads table
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved';
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS submitted_by uuid;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS impressions integer DEFAULT 0;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS clicks integer DEFAULT 0;

-- 9. Pricing config table
CREATE TABLE IF NOT EXISTS public.platform_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read config" ON public.platform_config
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage config" ON public.platform_config
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insert default pricing config
INSERT INTO public.platform_config (key, value) VALUES
  ('ad_pricing', '{"cost_per_day": 50, "cost_per_1000_impressions": 10, "featured_multiplier": 2}'::jsonb),
  ('ad_settings', '{"delay_seconds": 3, "skip_after_seconds": 5, "max_duration": 15, "max_views_per_day": 3}'::jsonb)
ON CONFLICT (key) DO NOTHING;
