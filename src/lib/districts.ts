import { SIGUNGU_MAP, isSidoType, type Region } from '@/types/region';

/**
 * 국회 선거구 이름 → 앱 지역 (시·도, 시·군·구)
 *
 * 국회 선거구 이름은 시·군·구를 붙여 쓴다 ("대구 동구군위군을", "강원 철원군화천군양구군인제군").
 * 글자 규칙(…시/군/구로 끝나면 자르기)으로는 '양구군'·'강서구' 같은 이름이 잘못 잘려서,
 * 그 시·도의 실제 시·군·구 이름으로 앞에서부터 가장 긴 이름을 찾아 나눈다.
 */

const PREFIX_SIDO: Record<string, string> = {
  서울: '서울특별시', 부산: '부산광역시', 대구: '대구광역시', 인천: '인천광역시', 광주: '광주광역시',
  대전: '대전광역시', 울산: '울산광역시', 세종: '세종특별자치시', 경기: '경기도', 강원: '강원특별자치도',
  충북: '충청북도', 충남: '충청남도', 전북: '전북특별자치도', 전남: '전라남도', 경북: '경상북도',
  경남: '경상남도', 제주: '제주특별자치도',
};

// 2026-07-01 인천 행정체제 개편: 국회 선거구는 아직 옛 구 이름(중구·동구·서구)을 쓴다
export const SIGUNGU_ALIASES: Record<string, Record<string, string[]>> = {
  인천광역시: { 제물포구: ['중구', '동구'], 영종구: ['중구'], 서해구: ['서구'], 검단구: ['서구'] },
};

// 통합 광역단체 (2026 지방선거부터). 국회 선거구 앞머리가 이 이름으로 바뀌었다
const MERGED_PREFIX: Record<string, string[]> = {
  전남광주통합특별시: ['광주광역시', '전라남도'],
};

function knownNames(sido: string): string[] {
  const base = isSidoType(sido) ? SIGUNGU_MAP[sido] : [];
  const old = Object.values(SIGUNGU_ALIASES[sido] ?? {}).flat();
  return [...new Set([...base, ...old])].sort((a, b) => b.length - a.length);
}

/** 앞에서부터 가장 긴 시·군·구 이름을 찾아 나눈다. 모르는 글자(분당구 등 일반구, 갑·을)는 건너뛴다 */
function segment(rest: string, names: string[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < rest.length) {
    const hit = names.find((n) => rest.startsWith(n, i));
    if (hit) {
      out.push(hit);
      i += hit.length;
    } else {
      i += 1;
    }
  }
  return [...new Set(out)];
}

export interface DistrictPlace {
  sido: string | null;
  sigungu: string[];
}

export function parseDistrict(district: string | null | undefined): DistrictPlace {
  const s = (district ?? '').trim();
  if (!s || s.includes('비례')) return { sido: null, sigungu: [] };
  if (s.startsWith('세종')) return { sido: '세종특별자치시', sigungu: ['세종시'] };
  const sp = s.indexOf(' ');
  if (sp < 0) return { sido: null, sigungu: [] };
  const prefix = s.slice(0, sp);
  const rest = s.slice(sp + 1);

  const merged = MERGED_PREFIX[prefix];
  if (merged) {
    // 시·군·구 이름으로 어느 쪽인지 정한다 (광주 동구·서구·남구·북구·광산구 / 그 밖은 전남)
    for (const sido of merged) {
      const found = segment(rest, knownNames(sido));
      if (found.length > 0) return { sido, sigungu: found };
    }
    return { sido: null, sigungu: [] };
  }
  const sido = PREFIX_SIDO[prefix] ?? null;
  if (!sido) return { sido: null, sigungu: [] };
  return { sido, sigungu: segment(rest, knownNames(sido)) };
}

/** 우리 지역(시·도 + 시·군·구) 선거구인가. 시·군·구가 '전체'면 시·도만 본다 */
export function districtCovers(place: DistrictPlace, region: Region | null | undefined): boolean {
  if (!region?.sido || place.sido !== region.sido) return false;
  const sg = region.sigungu;
  if (!sg || sg === '전체' || region.sido === '세종특별자치시') return true;
  const names = SIGUNGU_ALIASES[region.sido]?.[sg] ?? [sg];
  return place.sigungu.some((t) => names.includes(t));
}
