-- Create storage bucket for app assets (logo, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read app assets (public bucket)
CREATE POLICY "Anyone can read app assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-assets');

-- Only admins can upload/update/delete app assets
CREATE POLICY "Admins can upload app assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'app-assets' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update app assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'app-assets' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete app assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'app-assets' AND is_admin(auth.uid()));

-- Insert logo_url setting if it doesn't exist
INSERT INTO public.app_settings (key, value)
VALUES ('logo_url', '')
ON CONFLICT (key) DO NOTHING;