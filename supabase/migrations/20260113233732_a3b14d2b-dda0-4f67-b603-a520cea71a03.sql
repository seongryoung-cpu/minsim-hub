-- Create storage bucket for candidate images
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-images', 'candidate-images', true);

-- Allow anyone to view candidate images (public bucket)
CREATE POLICY "Anyone can view candidate images"
ON storage.objects FOR SELECT
USING (bucket_id = 'candidate-images');

-- Only admins can upload candidate images
CREATE POLICY "Admins can upload candidate images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-images' 
  AND is_admin(auth.uid())
);

-- Only admins can update candidate images
CREATE POLICY "Admins can update candidate images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'candidate-images' 
  AND is_admin(auth.uid())
);

-- Only admins can delete candidate images
CREATE POLICY "Admins can delete candidate images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'candidate-images' 
  AND is_admin(auth.uid())
);