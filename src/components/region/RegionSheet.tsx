import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, MapPin, Search, Building2, Home, X } from 'lucide-react';
import { SIDO_LIST, SIGUNGU_MAP, type Region, type SidoType } from '@/types/region';

interface RegionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (region: Region) => void;
  currentRegion?: Region | null;
}

// 시/도별 아이콘 매핑
const SIDO_ICONS: Record<string, string> = {
  '서울특별시': '🏛️',
  '부산광역시': '🌊',
  '대구광역시': '🍎',
  '인천광역시': '✈️',
  '광주광역시': '💡',
  '대전광역시': '🔬',
  '울산광역시': '🏭',
  '세종특별자치시': '🏢',
  '경기도': '🏙️',
  '강원특별자치도': '🏔️',
  '충청북도': '🌾',
  '충청남도': '🌻',
  '전북특별자치도': '🎋',
  '전라남도': '🌿',
  '경상북도': '🏯',
  '경상남도': '🌸',
  '제주특별자치도': '🍊',
};

export function RegionSheet({ isOpen, onClose, onSelect, currentRegion }: RegionSheetProps) {
  const [step, setStep] = useState<'sido' | 'sigungu'>('sido');
  const [selectedSido, setSelectedSido] = useState<SidoType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('sido');
      setSelectedSido(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSidoSelect = (sido: SidoType) => {
    setSelectedSido(sido);
    setStep('sigungu');
    setSearchQuery('');
  };

  const handleSigunguSelect = (sigungu: string) => {
    if (selectedSido) {
      onSelect({ sido: selectedSido, sigungu });
      onClose();
    }
  };

  const handleBack = () => {
    setStep('sido');
    setSelectedSido(null);
    setSearchQuery('');
  };

  // 필터링된 목록
  const filteredSidoList = useMemo(() => {
    if (!searchQuery.trim()) return SIDO_LIST;
    return SIDO_LIST.filter(sido => 
      sido.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredSigunguList = useMemo(() => {
    if (!selectedSido) return [];
    const list = SIGUNGU_MAP[selectedSido] || [];
    if (!searchQuery.trim()) return list;
    return list.filter(sigungu => 
      sigungu.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedSido, searchQuery]);

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
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-sheet max-h-[90vh] overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          >
            <div className="max-w-[448px] mx-auto">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Header with gradient */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
                <div className="relative flex items-center justify-between px-4 py-4">
                  <div className="flex items-center gap-3">
                    {step === 'sigungu' && (
                      <motion.button
                        onClick={handleBack}
                        className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                        whileTap={{ scale: 0.9 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <ChevronLeft size={20} className="text-foreground" />
                      </motion.button>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                        <MapPin size={20} className="text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">
                          {step === 'sido' ? '지역 선택' : selectedSido}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {step === 'sido' ? '시/도를 선택해주세요' : '시/군/구를 선택해주세요'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    onClick={onClose}
                    className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={18} className="text-muted-foreground" />
                  </motion.button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={step === 'sido' ? '시/도 검색...' : '시/군/구 검색...'}
                    className="w-full pl-10 pr-4 py-3 bg-secondary/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Current Selection Badge */}
              {currentRegion && (
                <div className="px-4 pb-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                    <Home size={14} className="text-primary" />
                    <span className="text-xs font-medium text-primary">
                      현재: {currentRegion.sido} {currentRegion.sigungu}
                    </span>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="overflow-y-auto max-h-[55vh] px-4 pb-4">
                <AnimatePresence mode="wait">
                  {step === 'sido' ? (
                    <motion.div
                      key="sido"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-2"
                    >
                      {filteredSidoList.length > 0 ? (
                        filteredSidoList.map((sido, index) => {
                          const isSelected = currentRegion?.sido === sido;
                          const icon = SIDO_ICONS[sido] || '📍';
                          return (
                            <motion.button
                              key={sido}
                              onClick={() => handleSidoSelect(sido)}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className={`w-full p-4 rounded-2xl text-left transition-all relative group ${
                                isSelected
                                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg'
                                  : 'bg-secondary/50 hover:bg-secondary hover:shadow-md'
                              }`}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{icon}</span>
                                <div className="flex-1">
                                  <span className={`font-medium ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                                    {sido}
                                  </span>
                                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {SIGUNGU_MAP[sido]?.length || 0}개 지역
                                  </p>
                                </div>
                                {isSelected ? (
                                  <div className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                                    <Check size={14} className="text-primary-foreground" />
                                  </div>
                                ) : (
                                  <ChevronLeft size={18} className="rotate-180 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                )}
                              </div>
                            </motion.button>
                          );
                        })
                      ) : (
                        <div className="text-center py-12">
                          <Search size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-muted-foreground text-sm">검색 결과가 없습니다</p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sigungu"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="grid grid-cols-2 gap-2"
                    >
                      {filteredSigunguList.length > 0 ? (
                        filteredSigunguList.map((sigungu, index) => {
                          const isSelected =
                            currentRegion?.sido === selectedSido &&
                            currentRegion?.sigungu === sigungu;
                          return (
                            <motion.button
                              key={sigungu}
                              onClick={() => handleSigunguSelect(sigungu)}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.02 }}
                              className={`relative p-4 rounded-2xl text-left transition-all overflow-hidden ${
                                isSelected
                                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg'
                                  : 'bg-secondary/50 hover:bg-secondary hover:shadow-md'
                              }`}
                              whileTap={{ scale: 0.96 }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Building2 size={14} className={isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'} />
                                  <span className={`text-sm font-medium ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                                    {sigungu}
                                  </span>
                                </div>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center"
                                  >
                                    <Check size={12} className="text-primary-foreground" />
                                  </motion.div>
                                )}
                              </div>
                            </motion.button>
                          );
                        })
                      ) : (
                        <div className="col-span-2 text-center py-12">
                          <Search size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-muted-foreground text-sm">검색 결과가 없습니다</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Safe area */}
              <div className="h-8 pb-safe" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
