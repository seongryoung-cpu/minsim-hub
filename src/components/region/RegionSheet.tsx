import { useState, useEffect, useMemo, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, MapPin, Home, X, Search } from 'lucide-react';
import {
  SIDO_LIST,
  SIGUNGU_MAP,
  SIDO_SHORT,
  METRO_SIDO_LIST,
  PROVINCE_SIDO_LIST,
  isSidoType,
  type Region,
  type SidoType,
} from '@/types/region';
import { KoreaMap } from './KoreaMap';

interface RegionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (region: Region) => void;
  currentRegion?: Region | null;
}

// ── 검색 ─────────────────────────────────────────────────────────────

type SearchResult =
  | { kind: 'sido'; sido: SidoType }
  | { kind: 'sigungu'; sido: SidoType; sigungu: string };

const MAX_RESULTS = 30;

/**
 * "해운대", "중구", "부산 중구", "광주" 등으로 검색.
 * 시·도 이름 결과를 먼저, 그다음 앞글자가 일치하는 시·군·구, 나머지 순.
 */
function searchRegions(raw: string): SearchResult[] {
  const q = raw.replace(/\s+/g, '');
  if (!q) return [];

  const sidoHits: SearchResult[] = [];
  const prefixHits: SearchResult[] = [];
  const otherHits: SearchResult[] = [];

  for (const sido of SIDO_LIST) {
    const short = SIDO_SHORT[sido];
    if (sido.includes(q) || short.includes(q)) {
      sidoHits.push({ kind: 'sido', sido });
    }

    for (const sigungu of SIGUNGU_MAP[sido]) {
      const hit =
        sigungu.includes(q) ||
        // "부산중구", "서울특별시강남구"처럼 시·도 + 시·군·구로 입력한 경우
        (q.length > short.length && `${short}${sigungu}`.includes(q)) ||
        (q.length > sido.length && `${sido}${sigungu}`.includes(q));
      if (!hit) continue;
      (sigungu.startsWith(q) ? prefixHits : otherHits).push({ kind: 'sigungu', sido, sigungu });
    }
  }

  return [...sidoHits, ...prefixHits, ...otherHits].slice(0, MAX_RESULTS);
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.replace(/\s+/g, '');
  const i = q ? text.indexOf(q) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-primary">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

// ── 표시용 헬퍼 ──────────────────────────────────────────────────────

/** 서울 → "구를", 부산 → "구·군을", 경기 → "시·군을" */
function getSigunguUnitPhrase(list: string[]): string {
  const units = ['시', '구', '군'].filter(u => list.some(s => s.endsWith(u)));
  const label = units.join('·') || '지역';
  return label.endsWith('군') ? `${label}을` : `${label}를`;
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────

function SidoChip({ sido, isCurrent, onClick }: { sido: SidoType; isCurrent: boolean; onClick: () => void }) {
  const count = SIGUNGU_MAP[sido].length;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      aria-label={`${sido}, ${count}개 지역${isCurrent ? ', 현재 지역' : ''}`}
      className={`rounded-xl py-2 text-center transition-colors ${
        isCurrent
          ? 'bg-card ring-2 ring-primary'
          : 'bg-secondary/60 hover:bg-secondary'
      }`}
    >
      <span className={`block text-sm font-bold ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
        {SIDO_SHORT[sido]}
      </span>
      <span className="block text-[10px] text-muted-foreground mt-0.5">{count}개</span>
    </motion.button>
  );
}

export function RegionSheet({ isOpen, onClose, onSelect, currentRegion }: RegionSheetProps) {
  const [step, setStep] = useState<'sido' | 'sigungu'>('sido');
  const [selectedSido, setSelectedSido] = useState<SidoType | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('sido');
      setSelectedSido(null);
      setQuery('');
    }
  }, [isOpen]);

  const currentSido = currentRegion && isSidoType(currentRegion.sido) ? currentRegion.sido : null;
  const results = useMemo(() => searchRegions(query), [query]);
  const isSearching = step === 'sido' && query.trim().length > 0;

  const commit = (sido: SidoType, sigungu: string) => {
    onSelect({ sido, sigungu });
    onClose();
  };

  const handleSidoSelect = (sido: SidoType) => {
    const list = SIGUNGU_MAP[sido];
    // 세종처럼 하위 지역이 하나뿐이면 바로 선택
    if (list.length === 1) {
      commit(sido, list[0]);
      return;
    }
    setSelectedSido(sido);
    setStep('sigungu');
    setQuery('');
  };

  const handleResultSelect = (result: SearchResult) => {
    if (result.kind === 'sido') handleSidoSelect(result.sido);
    else commit(result.sido, result.sigungu);
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && results.length === 1) {
      handleResultSelect(results[0]);
    }
  };

  const handleBack = () => {
    setStep('sido');
    setSelectedSido(null);
  };

  const sigunguList = selectedSido ? SIGUNGU_MAP[selectedSido] : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-sheet max-h-[92vh] flex flex-col overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            role="dialog"
            aria-modal="true"
            aria-label="지역 선택"
          >
            <div className="w-full max-w-[448px] mx-auto flex flex-col min-h-0 flex-1">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {step === 'sigungu' ? (
                    <motion.button
                      type="button"
                      onClick={handleBack}
                      aria-label="시·도 다시 선택"
                      className="w-9 h-9 shrink-0 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                      whileTap={{ scale: 0.9 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <ChevronLeft size={20} className="text-foreground" />
                    </motion.button>
                  ) : (
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/15 flex items-center justify-center">
                      <MapPin size={20} className="text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-foreground truncate">
                      {step === 'sido' ? '지역 선택' : selectedSido}
                    </h2>
                    <p className="text-xs text-muted-foreground truncate">
                      {step === 'sido'
                        ? '내 동네의 선거 정보를 보여드려요'
                        : `${getSigunguUnitPhrase(sigunguList)} 선택해주세요 · ${sigunguList.length}개`}
                    </p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={onClose}
                  aria-label="닫기"
                  className="w-9 h-9 shrink-0 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={18} className="text-muted-foreground" />
                </motion.button>
              </div>

              {/* 현재 지역 + 검색 (시·도 단계) */}
              {step === 'sido' && (
                <div className="px-4 pb-3 shrink-0">
                  {currentRegion && !isSearching && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-3 bg-primary/10 rounded-full">
                      <Home size={13} className="text-primary" />
                      <span className="text-xs font-semibold text-primary">
                        현재: {currentRegion.sido} {currentRegion.sigungu}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex items-center gap-2 h-11 px-3.5 rounded-xl transition-colors ${
                      isSearching ? 'bg-card ring-2 ring-primary' : 'bg-secondary/70'
                    }`}
                  >
                    <Search size={16} className="text-muted-foreground shrink-0" />
                    <input
                      type="search"
                      inputMode="search"
                      enterKeyHint="search"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="구·시·군 이름 검색 (예: 해운대, 수원)"
                      aria-label="지역 이름 검색"
                      className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none [&::-webkit-search-cancel-button]:hidden"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        aria-label="검색어 지우기"
                        className="w-5 h-5 shrink-0 rounded-full bg-muted-foreground/35 flex items-center justify-center"
                      >
                        <X size={11} className="text-card" strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 ${isSearching ? 'min-h-[50vh]' : ''}`}>
                <AnimatePresence mode="wait" initial={false}>
                  {isSearching ? (
                    /* 검색 결과 */
                    <motion.div
                      key="search"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                    >
                      {results.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                          ‘{query.trim()}’에 해당하는 지역이 없어요
                        </p>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground mb-1 px-0.5">
                            검색 결과 {results.length}{results.length === MAX_RESULTS ? '+' : ''}개
                          </p>
                          <ul>
                            {results.map(result => {
                              const key = result.kind === 'sido' ? result.sido : `${result.sido}-${result.sigungu}`;
                              const isCurrent =
                                result.kind === 'sigungu' &&
                                currentRegion?.sido === result.sido &&
                                currentRegion?.sigungu === result.sigungu;
                              return (
                                <li key={key} className="border-b border-border last:border-0">
                                  <button
                                    type="button"
                                    onClick={() => handleResultSelect(result)}
                                    className="w-full flex items-center gap-3 py-3 px-0.5 text-left hover:bg-secondary/40 transition-colors rounded-lg"
                                  >
                                    <span className="w-9 h-9 shrink-0 rounded-xl bg-secondary flex items-center justify-center">
                                      <MapPin size={16} className={isCurrent ? 'text-primary' : 'text-muted-foreground'} />
                                    </span>
                                    <span className="flex-1 min-w-0">
                                      <span className="block text-[15px] font-semibold text-foreground truncate">
                                        <Highlight
                                          text={result.kind === 'sido' ? result.sido : result.sigungu}
                                          query={query}
                                        />
                                      </span>
                                      <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                                        {result.kind === 'sido'
                                          ? `시·도 전체 · ${SIGUNGU_MAP[result.sido].length}개 지역`
                                          : result.sido}
                                        {isCurrent && ' · 현재 지역'}
                                      </span>
                                    </span>
                                    <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                    </motion.div>
                  ) : step === 'sido' ? (
                    /* 시·도 선택: 지도 + 칩 */
                    <motion.div
                      key="sido"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className="relative h-[160px] mb-4 rounded-2xl bg-secondary/40 overflow-hidden flex items-center justify-center">
                        <KoreaMap
                          highlightSido={currentSido}
                          onSelect={handleSidoSelect}
                          className="h-[148px] w-full"
                        />
                        <div className="absolute right-2.5 bottom-2 flex items-center gap-1 text-[10px] text-muted-foreground pointer-events-none">
                          {currentSido && (
                            <>
                              <span className="w-2 h-2 rounded-full bg-primary" />
                              <span>현재 지역 ·</span>
                            </>
                          )}
                          <span>지도를 눌러도 선택돼요</span>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-muted-foreground mb-2 px-0.5">특별시 · 광역시</p>
                      <div className="grid grid-cols-4 gap-1.5 mb-4">
                        {METRO_SIDO_LIST.map(sido => (
                          <SidoChip
                            key={sido}
                            sido={sido}
                            isCurrent={currentSido === sido}
                            onClick={() => handleSidoSelect(sido)}
                          />
                        ))}
                      </div>

                      <p className="text-xs font-bold text-muted-foreground mb-2 px-0.5">도</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {PROVINCE_SIDO_LIST.map(sido => (
                          <SidoChip
                            key={sido}
                            sido={sido}
                            isCurrent={currentSido === sido}
                            onClick={() => handleSidoSelect(sido)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    /* 시·군·구 선택 */
                    <motion.div
                      key="sigungu"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.18 }}
                    >
                      {selectedSido && (
                        <div className="h-[120px] mb-3 rounded-2xl bg-secondary/40 overflow-hidden flex items-center justify-center">
                          <KoreaMap focusSido={selectedSido} className="h-[112px] w-full" />
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-1.5">
                        {sigunguList.map((sigungu, index) => {
                          const isSelected =
                            currentRegion?.sido === selectedSido &&
                            currentRegion?.sigungu === sigungu;
                          return (
                            <motion.button
                              type="button"
                              key={sigungu}
                              onClick={() => selectedSido && commit(selectedSido, sigungu)}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.012 }}
                              whileTap={{ scale: 0.95 }}
                              aria-label={`${selectedSido} ${sigungu}${isSelected ? ', 현재 지역' : ''}`}
                              className={`relative px-2 py-3 rounded-xl text-center transition-colors ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground shadow-md'
                                  : 'bg-secondary/50 hover:bg-secondary'
                              }`}
                            >
                              <span className={`text-xs font-medium truncate block ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                                {sigungu}
                              </span>
                              {isSelected && (
                                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                                  <Check size={8} className="text-primary-foreground" />
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Safe area */}
                <div className="h-6 pb-safe" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
