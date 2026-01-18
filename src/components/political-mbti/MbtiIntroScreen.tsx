import { motion } from 'framer-motion';
import { Brain, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MBTI_AXES } from '@/types/political-mbti';

interface MbtiIntroScreenProps {
  onStart: () => void;
  questionCount: number;
}

export function MbtiIntroScreen({ onStart, questionCount }: MbtiIntroScreenProps) {
  const axes = Object.entries(MBTI_AXES);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col"
    >
      {/* Header */}
      <header className="p-4 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-xl"
        >
          <Brain className="w-8 h-8 text-white" />
        </motion.div>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-4 mb-8"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-muted-foreground">정치 성향 테스트</span>
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            나의 정치 MBTI는?
          </h1>
          <p className="text-muted-foreground">
            {questionCount}개의 질문으로 알아보는<br />
            나만의 정치 성향 유형
          </p>
        </motion.div>

        {/* 4축 설명 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full space-y-3 mb-8"
        >
          {axes.map(([key, axis], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center font-bold text-primary">
                {key}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground">{axis.name}</div>
                <div className="text-sm text-muted-foreground">
                  {axis.left.label} ↔ {axis.right.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="w-full"
        >
          <Button
            size="lg"
            onClick={onStart}
            className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:opacity-90 transition-opacity shadow-xl"
          >
            <Zap className="mr-2" />
            테스트 시작하기
            <ArrowRight className="ml-2" />
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-4 text-xs text-muted-foreground text-center"
        >
          소요 시간: 약 2-3분
        </motion.p>
      </div>
    </motion.div>
  );
}
