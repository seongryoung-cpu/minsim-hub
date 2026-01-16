-- Add unique constraint for upsert on push_subscriptions
ALTER TABLE public.push_subscriptions 
ADD CONSTRAINT push_subscriptions_user_endpoint_unique UNIQUE (user_id, endpoint);