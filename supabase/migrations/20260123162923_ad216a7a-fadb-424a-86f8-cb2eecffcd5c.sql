-- Create a function to notify admins when a new user signs up
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_record RECORD;
  user_display_name TEXT;
BEGIN
  -- Get the display name of the new user
  user_display_name := COALESCE(NEW.display_name, '새 사용자');

  -- Notify all admin users
  FOR admin_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      admin_record.user_id,
      'system',
      '새 사용자 가입',
      user_display_name || '님이 새로 가입했습니다.',
      jsonb_build_object(
        'new_user_id', NEW.user_id,
        'display_name', user_display_name,
        'created_at', NEW.created_at
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table for new user signups
DROP TRIGGER IF EXISTS on_new_user_notify_admins ON public.profiles;
CREATE TRIGGER on_new_user_notify_admins
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_user();