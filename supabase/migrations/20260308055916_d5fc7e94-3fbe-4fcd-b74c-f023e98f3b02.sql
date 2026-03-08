-- Fix: Users can only SELECT their own promotions (drop overly broad policy if exists)
-- The existing policy "Users can view own promotions" already has (auth.uid() = user_id), so it's fine.

-- Fix: ad_analytics - users should only read their own analytics
CREATE POLICY "Users can view own ad analytics"
ON public.ad_analytics
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fix: user_sessions - ensure users can only read their own sessions
-- Existing policies already have (auth.uid() = user_id) for SELECT, so no change needed there.