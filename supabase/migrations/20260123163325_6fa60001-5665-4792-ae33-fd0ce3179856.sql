-- Drop the existing trigger that creates duplicate in-app notifications
-- (Edge function now handles both in-app and push notifications)
DROP TRIGGER IF EXISTS on_new_user_notify_admins ON public.profiles;
DROP FUNCTION IF EXISTS public.notify_admins_on_new_user();