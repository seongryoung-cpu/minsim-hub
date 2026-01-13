import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Candidate, CandidatePledge } from '@/types/election';

export interface DBCandidate {
  id: string;
  slug: string;
  name: string;
  party: string;
  party_color: string;
  image_url: string | null;
  summary: string;
  position: string;
  region_type: string;
  region_name: string;
  age: number | null;
  education: string | null;
  slogan: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface DBCandidatePledge {
  id: string;
  candidate_id: string;
  title: string;
  description: string;
  category: string;
  sort_order: number;
}

function transformToCandidate(db: DBCandidate, pledges: DBCandidatePledge[] = []): Candidate {
  return {
    id: db.slug,
    name: db.name,
    party: db.party,
    partyColor: db.party_color,
    image: db.image_url || undefined,
    summary: db.summary,
    position: db.position,
    age: db.age || undefined,
    education: db.education || undefined,
    slogan: db.slogan || undefined,
    pledges: pledges.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
    })),
  };
}

export function useCandidates(regionName?: string) {
  return useQuery({
    queryKey: ['candidates', regionName],
    queryFn: async () => {
      let query = supabase
        .from('candidates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (regionName) {
        query = query.eq('region_name', regionName);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch pledges for all candidates
      const candidateIds = (data || []).map(c => c.id);
      const { data: pledges } = await supabase
        .from('candidate_pledges')
        .select('*')
        .in('candidate_id', candidateIds)
        .order('sort_order', { ascending: true });

      const pledgesByCandidate = (pledges || []).reduce((acc, p) => {
        if (!acc[p.candidate_id]) acc[p.candidate_id] = [];
        acc[p.candidate_id].push(p);
        return acc;
      }, {} as Record<string, DBCandidatePledge[]>);

      return (data || []).map(c => transformToCandidate(c, pledgesByCandidate[c.id] || []));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCandidateBySlug(slug: string) {
  return useQuery({
    queryKey: ['candidate', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const { data: pledges } = await supabase
        .from('candidate_pledges')
        .select('*')
        .eq('candidate_id', data.id)
        .order('sort_order', { ascending: true });

      return transformToCandidate(data, pledges || []);
    },
    enabled: !!slug,
  });
}

// Admin functions
export function useAllCandidatesAdmin() {
  return useQuery({
    queryKey: ['candidates-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('region_name', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as DBCandidate[];
    },
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (candidate: Omit<DBCandidate, 'id'>) => {
      const { data, error } = await supabase
        .from('candidates')
        .insert(candidate)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidates-admin'] });
    },
  });
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DBCandidate> & { id: string }) => {
      const { data, error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidates-admin'] });
    },
  });
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidates-admin'] });
    },
  });
}
