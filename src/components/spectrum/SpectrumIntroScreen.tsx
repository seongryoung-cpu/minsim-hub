import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Brain, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SPECTRUM_DIMENSIONS } from '@/types/spectrum';

interface SpectrumIntroScreenProps {
  onStart: () => void;
  questionCount: number;
}

export function SpectrumIntroScreen({ onStart, questionCount }: SpectrumIntroScreenProps) {
  const features = [
    {
      icon: Brain,
      title: 'AI 기반 분석',
      description: '베이지안 능동 학습으로 정확한 성향 측정',
    },
    {
      icon: Target,
      title: '5차원 스펙트럼',
      description: '경제, 안보, 젠더, 공정, 환경 5개 축 분석',
    },
    {
      icon: Zap,
      title: '스마트 질문',
      description: '정보 이득이 큰 질문을 우선 선택',
    },
  ];

  const dimensions = Object.values(SPECTRUM_DIMENSIONS);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col"
    >
      {/* Header area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6"
        >
          <Sparkles size={40} className="text-primary-foreground" />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold mb-3"
        >
          정치 스펙트럼 테스트
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground max-w-sm"
        >
          베이지안 능동 학습 기반의 지능형 테스트로<br />
          당신의 정치 성향을 5차원으로 분석합니다
        </motion.p>
      </div>

      {/* Dimensions preview */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="px-6 mb-6"
      >
        <div className="flex justify-center gap-3 flex-wrap">
          {dimensions.map((dim, i) => (
            <motion.div
              key={dim.code}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: dim.color }}
            >
              {dim.name}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features */}
      <div className="px-6 space-y-3 mb-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Start button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="p-6 pb-12"
      >
        <Button 
          onClick={onStart} 
          size="lg" 
          className="w-full h-14 text-lg font-semibold"
        >
          테스트 시작하기
          <ArrowRight size={20} className="ml-2" />
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          총 {questionCount}개 질문 • 약 3-5분 소요
        </p>
      </motion.div>
    </motion.div>
  );
}
