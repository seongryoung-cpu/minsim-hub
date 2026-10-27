import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useFollowedCandidates } from '@/hooks/useFollowedCandidates';
import { supabase } from '@/integrations/supabase/client';
import { headPhotoUrl } from '@/hooks/usePoliticians';
import { PersonPhoto } from '@/components/politicians/PersonPhoto';
import { ListPanel, Panel, SectionHeader, Tag } from '@/components/ds';

interface FollowedCandidate {
  id: string;
  slug: string;
  name: string;
  party: string;
  party_color: string;
  position: string;
  image_url: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 마이 '관심 정치인' — 인물 페이지에서 '관심'을 누른 사람들 */
export function FollowedCandidatesList() {
  const { followedIds, isLoaded } = useFollowedCandidates();

  const { data: candidates, isLoading } = useQuery({
    queryKey: ['followed-candidates-details', followedIds],
    queryFn: async () => {
      const ids = followedIds.filter((id) => UUID.test(id));
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('candidates')
        .select('id, slug, name, party, party_color, position, image_url')
        .in('id', ids)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as FollowedCandidate[];
    },
    enabled: isLoaded && followedIds.length > 0,
  });

  const loading = !isLoaded || (followedIds.length > 0 && isLoading);
  const list = candidates ?? [];

  return (
    <section aria-labelledby="followed-title" className="space-y-2.5">
      <SectionHeader id="followed-title" title="관심 정치인" />
      {loading ? (
        <div className="h-20 animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
      ) : list.length > 0 ? (
        <ListPanel>
          {list.map((c) => (
            <Link
              key={c.id}
              to={`/politicians/c/${c.slug}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50"
            >
              <PersonPhoto src={headPhotoUrl(c.image_url, 120)} initial={c.name.slice(0, 1)} width={40} />
              <span className="min-w-0 flex-1 space-y-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[15px] font-bold">{c.name}</span>
                  {c.party && <Tag>{c.party}</Tag>}
                </span>
                {c.position && <span className="block truncate text-[13px] text-muted-foreground">{c.position}</span>}
              </span>
              <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          ))}
        </ListPanel>
      ) : (
        <Panel className="flex flex-col items-center gap-1.5 px-4 py-5 text-center">
          <p className="text-[14px] font-semibold">아직 관심 정치인이 없어요</p>
          <p className="text-[13px] text-muted-foreground">인물 페이지에서 ‘관심’을 누르면 여기 모여요</p>
          <Link to="/politicians" className="mt-1.5 text-[13px] font-semibold text-primary hover:text-primary-strong">
            정치인 찾아보기
          </Link>
        </Panel>
      )}
    </section>
  );
}
