import { describe, expect, test } from 'bun:test';
import { districtCovers, parseDistrict } from './districts';

describe('parseDistrict', () => {
  test('붙여 쓴 시·군·구를 실제 이름으로 나눈다', () => {
    expect(parseDistrict('대구 동구군위군을')).toEqual({ sido: '대구광역시', sigungu: ['동구', '군위군'] });
    expect(parseDistrict('강원 철원군화천군양구군인제군').sigungu).toEqual(['철원군', '화천군', '양구군', '인제군']);
    expect(parseDistrict('경기 안양시만안구').sigungu).toEqual(['안양시']);
    expect(parseDistrict('경북 포항시남구울릉군').sigungu).toEqual(['포항시', '울릉군']);
  });
  test('긴 이름을 먼저 찾는다 (강서구 ≠ 서구)', () => {
    expect(parseDistrict('부산 강서구').sigungu).toEqual(['강서구']);
    expect(parseDistrict('부산 서구동구').sigungu).toEqual(['서구', '동구']);
  });
  test('비례대표와 세종', () => {
    expect(parseDistrict('비례대표')).toEqual({ sido: null, sigungu: [] });
    expect(parseDistrict('세종특별자치시갑')).toEqual({ sido: '세종특별자치시', sigungu: ['세종시'] });
  });
  test('전남광주통합특별시 선거구는 시·군·구로 광주·전남을 가린다', () => {
    expect(parseDistrict('전남광주통합특별시 광산구갑')).toEqual({ sido: '광주광역시', sigungu: ['광산구'] });
    expect(parseDistrict('전남광주통합특별시 동구남구을')).toEqual({ sido: '광주광역시', sigungu: ['동구', '남구'] });
    expect(parseDistrict('전남광주통합특별시 순천시광양시곡성군구례군갑').sido).toBe('전라남도');
  });
});

describe('districtCovers', () => {
  test('인천 새 구 이름은 옛 선거구 이름으로 찾는다', () => {
    const p = parseDistrict('인천 서구갑');
    expect(districtCovers(p, { sido: '인천광역시', sigungu: '서해구' })).toBe(true);
    expect(districtCovers(p, { sido: '인천광역시', sigungu: '검단구' })).toBe(true);
    expect(districtCovers(p, { sido: '인천광역시', sigungu: '연수구' })).toBe(false);
  });
  test('시·군·구 전체면 시·도만 본다', () => {
    expect(districtCovers(parseDistrict('경기 수원시갑'), { sido: '경기도', sigungu: '전체' })).toBe(true);
    expect(districtCovers(parseDistrict('경기 수원시갑'), { sido: '서울특별시', sigungu: '전체' })).toBe(false);
  });
});
