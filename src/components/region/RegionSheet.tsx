import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, MapPin } from 'lucide-react';
import { SIDO_LIST, SIGUNGU_MAP, type Region, type SidoType } from '@/types/region';

interface RegionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (region: Region) => void;
  currentRegion?: Region | null;
}

export function RegionSheet({ isOpen, onClose, onSelect, currentRegion }: RegionSheetProps) {
  const [step, setStep] = useState<'sido' | 'sigungu'>('sido');
  const [selectedSido, setSelectedSido] = useState<SidoType | null>(null);

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
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-sheet max-h-[85vh] overflow-hidden"
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

              {/* Header */}
              <div className="flex items-center px-4 py-3 border-b border-border">
                {step === 'sigungu' && (
                  <motion.button
                    onClick={handleBack}
                    className="touch-target -ml-2 mr-1"
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <ChevronLeft size={24} className="text-foreground" />
                  </motion.button>
                )}
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {step === 'sido' ? '시/도 선택' : selectedSido}
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[60vh] p-4">
                <AnimatePresence mode="wait">
                  {step === 'sido' ? (
                    <motion.div
                      key="sido"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-2 gap-2"
                    >
                      {SIDO_LIST.map((sido) => {
                        const isSelected = currentRegion?.sido === sido;
                        return (
                          <motion.button
                            key={sido}
                            onClick={() => handleSidoSelect(sido)}
                            className={`p-4 rounded-2xl text-left transition-colors relative ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary hover:bg-secondary/80'
                            }`}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="text-sm font-medium">{sido}</span>
                            {isSelected && (
                              <Check size={16} className="absolute top-4 right-4" />
                            )}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sigungu"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="grid grid-cols-2 gap-2"
                    >
                      {selectedSido &&
                        SIGUNGU_MAP[selectedSido]?.map((sigungu) => {
                          const isSelected =
                            currentRegion?.sido === selectedSido &&
                            currentRegion?.sigungu === sigungu;
                          return (
                            <motion.button
                              key={sigungu}
                              onClick={() => handleSigunguSelect(sigungu)}
                              className={`p-4 rounded-2xl text-left transition-colors relative ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary hover:bg-secondary/80'
                              }`}
                              whileTap={{ scale: 0.98 }}
                            >
                              <span className="text-sm font-medium">{sigungu}</span>
                              {isSelected && (
                                <Check size={16} className="absolute top-4 right-4" />
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