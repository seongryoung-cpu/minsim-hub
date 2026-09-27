-- Leaderboard: view runs with owner rights so quiz_stats can be locked down (view exposes no user_id)
ALTER VIEW public.leaderboard_view SET (security_invoker = off);
GRANT SELECT ON public.leaderboard_view TO anon, authenticated;

DROP POLICY IF EXISTS "Authenticated users can view all quiz stats for leaderboard" ON public.quiz_stats;
CREATE POLICY "Users can view own quiz stats" ON public.quiz_stats
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Storage: public buckets serve files by URL without SELECT policies; stop open listing
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Users can list their own avatars" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Anyone can view candidate images" ON storage.objects;
CREATE POLICY "Admins can list candidate images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'candidate-images' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read app assets" ON storage.objects;
CREATE POLICY "Admins can list app assets" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'app-assets' AND public.is_admin(auth.uid()));