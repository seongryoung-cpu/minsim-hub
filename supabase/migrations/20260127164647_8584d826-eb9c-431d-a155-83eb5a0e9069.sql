-- Fix permissive RLS policies flagged by linter

-- 1) activity_logs: replace INSERT policy that had WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can insert activity logs" ON public.activity_logs;

CREATE POLICY "Users can insert activity logs (no spoofing)"
ON public.activity_logs
FOR INSERT
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR
  (auth.uid() = user_id)
);

-- 2) notifications: remove permissive INSERT policy (clients should not insert notifications)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;