CREATE TABLE public.elections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  election_date date NOT NULL,
  role text NOT NULL DEFAULT 'archived',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.election_schedule_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id uuid NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  short_label text,
  start_date date,
  end_date date,
  link_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.elections, public.election_schedule_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elections, public.election_schedule_items TO authenticated;
GRANT ALL ON public.elections, public.election_schedule_items TO service_role;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_schedule_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "elections public read" ON public.elections FOR SELECT USING (true);
CREATE POLICY "elections admin write" ON public.elections FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "schedule public read" ON public.election_schedule_items FOR SELECT USING (true);
CREATE POLICY "schedule admin write" ON public.election_schedule_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER elections_updated BEFORE UPDATE ON public.elections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER schedule_updated BEFORE UPDATE ON public.election_schedule_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX ON public.election_schedule_items(election_id, kind, sort_order);