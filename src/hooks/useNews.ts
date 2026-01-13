import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { NewsArticle } from '@/types/news';

export function useNews(candidateIds?: string[]) {
  return useQuery({
    queryKey: ['news', candidateIds],
    queryFn: async () => {
      let query = supabase
        .from('news_articles')
        .select('*')
        .order('published_at', { ascending: false });

      if (candidateIds && candidateIds.length > 0) {
        query = query.in('candidate_id', candidateIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((article): NewsArticle => ({
        id: article.id,
        candidateId: article.candidate_id || '',
        title: article.title,
        summary: article.summary,
        source: article.source,
        publishedAt: article.published_at,
        category: article.category as NewsArticle['category'],
        imageUrl: article.image_url || undefined,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useNewsForCandidate(candidateId: string) {
  return useQuery({
    queryKey: ['news', 'candidate', candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('published_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((article): NewsArticle => ({
        id: article.id,
        candidateId: article.candidate_id || '',
        title: article.title,
        summary: article.summary,
        source: article.source,
        publishedAt: article.published_at,
        category: article.category as NewsArticle['category'],
        imageUrl: article.image_url || undefined,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}
