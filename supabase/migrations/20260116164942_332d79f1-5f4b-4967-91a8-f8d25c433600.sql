-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'news',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (via trigger)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create function to notify followers when new news is added
CREATE OR REPLACE FUNCTION public.notify_followers_on_news()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
  candidate_name TEXT;
BEGIN
  -- Only proceed if candidate_id is set
  IF NEW.candidate_id IS NOT NULL THEN
    -- Get candidate name from candidates table
    SELECT name INTO candidate_name
    FROM public.candidates
    WHERE slug = NEW.candidate_id;

    -- If candidate found, notify all followers
    IF candidate_name IS NOT NULL THEN
      FOR follower_record IN 
        SELECT ufc.user_id 
        FROM public.user_followed_candidates ufc
        JOIN public.candidates c ON c.id = ufc.candidate_id
        WHERE c.slug = NEW.candidate_id
      LOOP
        INSERT INTO public.notifications (user_id, type, title, body, data)
        VALUES (
          follower_record.user_id,
          'news',
          candidate_name || ' 관련 새 뉴스',
          NEW.title,
          jsonb_build_object(
            'news_id', NEW.id,
            'candidate_id', NEW.candidate_id,
            'article_url', NEW.article_url
          )
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for news notifications
CREATE TRIGGER trigger_notify_followers_on_news
AFTER INSERT ON public.news_articles
FOR EACH ROW
EXECUTE FUNCTION public.notify_followers_on_news();

-- Create push_subscriptions table for web push notifications
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (auth.uid() = user_id);