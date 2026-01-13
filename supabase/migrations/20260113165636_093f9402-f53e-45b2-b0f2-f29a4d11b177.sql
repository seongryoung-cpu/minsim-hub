-- Create candidates table
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  party TEXT NOT NULL,
  party_color TEXT NOT NULL DEFAULT '#808080',
  image_url TEXT,
  summary TEXT NOT NULL,
  position TEXT NOT NULL,
  region_type TEXT NOT NULL DEFAULT 'metropolitan',
  region_name TEXT NOT NULL,
  age INTEGER,
  education TEXT,
  slogan TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create candidate pledges table
CREATE TABLE public.candidate_pledges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create candidate careers table
CREATE TABLE public.candidate_careers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_careers ENABLE ROW LEVEL SECURITY;

-- Public read access for active candidates
CREATE POLICY "Anyone can read active candidates"
ON public.candidates
FOR SELECT
USING (is_active = true);

CREATE POLICY "Anyone can read candidate pledges"
ON public.candidate_pledges
FOR SELECT
USING (true);

CREATE POLICY "Anyone can read candidate careers"
ON public.candidate_careers
FOR SELECT
USING (true);

-- Admin can manage all candidate data
CREATE POLICY "Admins can manage candidates"
ON public.candidates
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage candidate pledges"
ON public.candidate_pledges
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage candidate careers"
ON public.candidate_careers
FOR ALL
USING (is_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_candidates_region ON public.candidates(region_name);
CREATE INDEX idx_candidates_active ON public.candidates(is_active);
CREATE INDEX idx_candidate_pledges_candidate ON public.candidate_pledges(candidate_id);
CREATE INDEX idx_candidate_careers_candidate ON public.candidate_careers(candidate_id);