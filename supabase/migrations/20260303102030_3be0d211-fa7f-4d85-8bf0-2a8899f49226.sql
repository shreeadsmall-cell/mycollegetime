
-- Fix overly permissive ad_analytics insert policy
DROP POLICY IF EXISTS "Anyone can insert ad analytics" ON public.ad_analytics;
CREATE POLICY "Authenticated users can insert ad analytics" ON public.ad_analytics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
