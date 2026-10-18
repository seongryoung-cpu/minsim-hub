import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Region } from '@/types/region';
import { districtCovers, parseDistrict, type DistrictPlace } from '@/lib/districts';

/**
 * 정치인 탭 '우리를 대표하는 사람들'
 *  - 국회의원: assembly_members (열린국회정보, 매일 동기화)
 *  - 광역단체장: candidates 당선인
 * 정렬은 직책별 → 가나다. 인기·좋아요 순서는 쓰지 않는다 (중립).
 */

export interface AssemblyMember {
  mona_cd: string;
  name: string;
  party: string | null;
  district: string | null;
  elect_type: string | null;
  committees: string[];
  committee_role: string | null;
  reelection: string | null;
  units: string | null;
  tel: string | null;
  email: string | null;
  homepage: string | null;
  office: string | null;
  career: string | null;
  synced_at: string;
  /** 선거구 → 앱 지역 (화면에서 계산: src/lib/districts.ts) */
  place: DistrictPlace;
}

export interface MetroHead {
  id: string;
  slug: string;
  name: string;
  party: string | null;
  position: string | null;
  region_name: string | null;
  image_url: string | null;
}

export type PoliticianKind = 'metro_head' | 'assembly_district' | 'assembly_pr';

/** 목록에서 쓰는 한 사람 */
export interface PoliticianRow {
  key: string;            // 주소에 쓰는 값
  path: string;
  kind: PoliticianKind;
  name: string;
  party: string | null;
  title: string;          // 경기도지사 / 경기 수원시갑 / 비례대표
  sub: string | null;     // 재선 · 국토교통위원회
  sidos: string[];        // 앱 시·도 이름
  committees: string[];
  initial: string;
}

export const KIND_LABELS: Record<PoliticianKind, string> = {
  metro_head: '광역단체장',
  assembly_district: '지역구 국회의원',
  assembly_pr: '비례대표 국회의원',
};
export const KIND_ORDER: PoliticianKind[] = ['metro_head', 'assembly_district', 'assembly_pr'];

/** 통합 광역단체 → 앱 시·도 */
export function metroHeadSidos(regionName: string | null): string[] {
  if (!regionName) return [];
  if (regionName === '전남광주통합특별시') return ['광주광역시', '전라남도'];
  return [regionName];
}

const ko = new Intl.Collator('ko');
const byName = (a: { name: string }, b: { name: string }) => ko.compare(a.name, b.name);

export function memberToRow(m: AssemblyMember): PoliticianRow {
  const pr = m.elect_type === '비례대표' || !m.place.sido;
  const mainCommittee = m.committees.find((c) => !c.includes('특별위원회')) ?? m.committees[0] ?? null;
  return {
    key: m.mona_cd,
    path: `/politicians/m/${encodeURIComponent(m.mona_cd)}`,
    kind: pr ? 'assembly_pr' : 'assembly_district',
    name: m.name,
    party: m.party,
    title: pr ? '비례대표' : m.district ?? '',
    sub: [m.reelection, mainCommittee].filter(Boolean).join(' · ') || null,
    sidos: m.place.sido ? [m.place.sido] : [],
    committees: m.committees,
    initial: m.name.slice(0, 1),
  };
}

export function headToRow(h: MetroHead): PoliticianRow {
  return {
    key: h.id,
    path: `/politicians/c/${h.id}`,
    kind: 'metro_head',
    name: h.name,
    party: h.party,
    title: h.position ?? '광역단체장',
    sub: null,
    sidos: metroHeadSidos(h.region_name),
    committees: [],
    initial: h.name.slice(0, 1),
  };
}

/** 우리 동네 국회의원: 선거구에 우리 시·군·구가 들어 있는 사람 (시·군·구 '전체'면 시·도 전부) */
export function isLocalMember(m: AssemblyMember, region: Region | null | undefined) {
  return districtCovers(m.place, region);
}

export function sortRows(rows: PoliticianRow[]) {
  return [...rows].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || byName(a, b));
}

export function useAssemblyMembers() {
  return useQuery({
    queryKey: ['assembly-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assembly_members')
        .select('mona_cd, name, party, district, elect_type, committees, committee_role, reelection, units, tel, email, homepage, office, career, synced_at')
        .eq('is_current', true);
      if (error) throw error;
      return ((data ?? []) as Omit<AssemblyMember, 'place'>[])
        .map((m) => ({ ...m, place: parseDistrict(m.district) }))
        .sort(byName);
    },
    staleTime: 60 * 60_000,
  });
}

export function useMetroHeads() {
  return useQuery({
    queryKey: ['metro-heads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('id, slug, name, party, position, region_name, image_url')
        .eq('election_result', 'elected')
        .eq('region_type', 'metropolitan');
      if (error) throw error;
      return ((data ?? []) as MetroHead[]).sort(byName);
    },
    staleTime: 60 * 60_000,
  });
}

export interface PoliticianActivity {
  positions: {
    agenda_id: string; agenda_title: string; role_label: string | null; summary: string;
    source_url: string; source_kind: string; spoken_on: string;
  }[];
  votes: { agenda_id: string; agenda_title: string; bill_id: string; bill_name: string; vote: string; vote_date: string | null }[];
  sponsored: { agenda_id: string; agenda_title: string; bill_id: string; bill_name: string; stage: string; propose_dt: string | null }[];
}

export function usePoliticianActivity(p: { mona?: string; candidateId?: string }) {
  return useQuery({
    queryKey: ['politician-activity', p.mona ?? '', p.candidateId ?? ''],
    enabled: !!(p.mona || p.candidateId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_politician_activity', {
        p_mona_cd: p.mona ?? undefined,
        p_candidate_id: p.candidateId ?? undefined,
      });
      if (error) throw error;
      return data as unknown as PoliticianActivity;
    },
    staleTime: 5 * 60_000,
  });
}
