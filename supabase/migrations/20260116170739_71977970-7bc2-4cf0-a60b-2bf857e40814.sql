-- Create notification_logs table to store push notification history
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'all', -- 'all' or 'selected'
  target_user_ids UUID[] DEFAULT NULL,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage notification logs
CREATE POLICY "Admins can view notification logs"
  ON public.notification_logs
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert notification logs"
  ON public.notification_logs
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_notification_logs_created_at ON public.notification_logs(created_at DESC);