-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- === profiles ===
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- === user_roles ===
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- === timetable_entries ===
DROP POLICY IF EXISTS "Users can view their own entries" ON public.timetable_entries;
DROP POLICY IF EXISTS "Users can insert their own entries" ON public.timetable_entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON public.timetable_entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON public.timetable_entries;

CREATE POLICY "Users can view their own entries" ON public.timetable_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own entries" ON public.timetable_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own entries" ON public.timetable_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own entries" ON public.timetable_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- === ads ===
DROP POLICY IF EXISTS "Admins can manage ads" ON public.ads;
DROP POLICY IF EXISTS "Anyone can view active ads" ON public.ads;

CREATE POLICY "Admins can manage ads" ON public.ads FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active ads" ON public.ads FOR SELECT TO authenticated USING (is_active = true);

-- === ad_analytics ===
DROP POLICY IF EXISTS "Admins can view ad analytics" ON public.ad_analytics;
DROP POLICY IF EXISTS "Authenticated users can insert ad analytics" ON public.ad_analytics;
DROP POLICY IF EXISTS "Users can view own ad analytics" ON public.ad_analytics;

CREATE POLICY "Admins can view ad analytics" ON public.ad_analytics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own ad analytics" ON public.ad_analytics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert ad analytics" ON public.ad_analytics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- === announcements ===
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;

CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active announcements" ON public.announcements FOR SELECT TO authenticated USING (is_active = true);

-- === promotions ===
DROP POLICY IF EXISTS "Admins can manage all promotions" ON public.promotions;
DROP POLICY IF EXISTS "Users can insert own promotions" ON public.promotions;
DROP POLICY IF EXISTS "Users can view own promotions" ON public.promotions;

CREATE POLICY "Admins can manage all promotions" ON public.promotions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own promotions" ON public.promotions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own promotions" ON public.promotions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- === revenue_records ===
DROP POLICY IF EXISTS "Admins can manage revenue" ON public.revenue_records;

CREATE POLICY "Admins can manage revenue" ON public.revenue_records FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- === feature_usage ===
DROP POLICY IF EXISTS "Admins can view all usage" ON public.feature_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.feature_usage;

CREATE POLICY "Admins can view all usage" ON public.feature_usage FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own usage" ON public.feature_usage FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- === page_visits ===
DROP POLICY IF EXISTS "Admins can view all visits" ON public.page_visits;
DROP POLICY IF EXISTS "Users can insert own visits" ON public.page_visits;

CREATE POLICY "Admins can view all visits" ON public.page_visits FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own visits" ON public.page_visits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- === user_sessions ===
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;

CREATE POLICY "Admins can view all sessions" ON public.user_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.user_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.user_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- === platform_config ===
DROP POLICY IF EXISTS "Admins can manage config" ON public.platform_config;
DROP POLICY IF EXISTS "Anyone can read config" ON public.platform_config;

CREATE POLICY "Admins can manage config" ON public.platform_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can read config" ON public.platform_config FOR SELECT TO authenticated USING (true);