import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, MapPin, Building2, Home, X, Map, List } from 'lucide-react';
import { SIDO_LIST, SIGUNGU_MAP, type Region, type SidoType } from '@/types/region';
import { KoreaMap } from './KoreaMap';

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
  '강원도': '🏔️',
  '충청북도': '🌾',
  '충청남도': '🌻',
  '전라북도': '🎋',
  '전라남도': '🌿',
  '경상북도': '🏯',
  '경상남도': '🌸',
  '제주특별자치도': '🍊',
};

type ViewMode = 'map' | 'list';

export function RegionSheet({ isOpen, onClose, onSelect, currentRegion }: RegionSheetProps) {
  const [step, setStep] = useState<'sido' | 'sigungu'>('sido');
  const [selectedSido, setSelectedSido] = useState<SidoType | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  useEffect(() => {
    if (isOpen) {
      setStep('sido');
      setSelectedSido(null);
    }
  }, [isOpen]);

  const handleSidoSelect = (sido: SidoType) => {
    setSelectedSido(sido);
    setStep('sigungu');
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
  };

  const sigunguList = selectedSido ? (SIGUNGU_MAP[selectedSido] || []) : [];

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
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-sheet max-h-[92vh] overflow-hidden"
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
                          {step === 'sido' ? '지도에서 시/도를 선택하세요' : '시/군/구를 선택해주세요'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* View Toggle - only show in sido step */}
                    {step === 'sido' && (
                      <div className="flex bg-secondary/50 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('map')}
                          className={`p-2 rounded-md transition-all ${
                            viewMode === 'map' 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Map size={16} />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-md transition-all ${
                            viewMode === 'list' 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <List size={16} />
                        </button>
                      </div>
                    )}
                    <motion.button
                      onClick={onClose}
                      className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
                      whileTap={{ scale: 0.9 }}
                    >
                      <X size={18} className="text-muted-foreground" />
                    </motion.button>
                  </div>
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
              <div className="overflow-y-auto max-h-[60vh] px-4 pb-4">
                <AnimatePresence mode="wait">
                  {step === 'sido' ? (
                    viewMode === 'map' ? (
                      /* Map View */
                      <motion.div
                        key="map"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center"
                      >
                        <KoreaMap
                          selectedSido={selectedSido}
                          currentSido={currentRegion?.sido as SidoType}
                          onSelect={handleSidoSelect}
                        />
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          지도를 터치하여 지역을 선택하세요
                        </p>
                      </motion.div>
                    ) : (
                      /* List View */
                      <motion.div
                        key="list"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-2"
                      >
                        {SIDO_LIST.map((sido, index) => {
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
                        })}
                      </motion.div>
                    )
                  ) : (
                    /* Sigungu Selection - 3 columns, compact */
                    <motion.div
                      key="sigungu"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="grid grid-cols-3 gap-1.5"
                    >
                      {sigunguList.map((sigungu, index) => {
                        const isSelected =
                          currentRegion?.sido === selectedSido &&
                          currentRegion?.sigungu === sigungu;
                          return (
                            <motion.button
                              key={sigungu}
                              onClick={() => handleSigunguSelect(sigungu)}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.015 }}
                              className={`relative px-2 py-2.5 rounded-xl text-center transition-all overflow-hidden ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground shadow-md'
                                  : 'bg-secondary/50 hover:bg-secondary'
                              }`}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span className={`text-xs font-medium truncate block ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                                {sigungu}
                              </span>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary-foreground/20 flex items-center justify-center"
                                >
                                  <Check size={8} className="text-primary-foreground" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
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
