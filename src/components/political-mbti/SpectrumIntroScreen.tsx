import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, Target, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SpectrumIntroScreenProps {
  onStart: () => void;
  questionCount: number;
}

export function SpectrumIntroScreen({ onStart, questionCount }: SpectrumIntroScreenProps) {
  const navigate = useNavigate();

  const features = [
    { icon: Brain, label: '5차원 분석', desc: '경제·안보·젠더·공정·미래' },
    { icon: Target, label: 'AI 최적화', desc: '맞춤형 질문 선택' },
    { icon: Zap, label: '빠른 진단', desc: `${questionCount}개 질문으로 완료` },
    { icon: BarChart3, label: '시각화', desc: '레이더 차트로 한눈에' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background flex flex-col"
    >
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 뒤로
        </button>
        <span className="text-sm text-muted-foreground">정치 성향 테스트</span>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Hero */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <div className="text-5xl">🧭</div>
          </div>
          <h1 className="text-3xl font-bold mb-3">
            나의 정치 성향은?
          </h1>
          <p className="text-muted-foreground max-w-xs mx-auto">
            5가지 차원에서 당신의 정치적 위치를<br />
            AI가 정밀하게 분석해 드립니다
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8"
        >
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-4 text-center"
            >
              <feature.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="font-medium text-sm">{feature.label}</div>
              <div className="text-xs text-muted-foreground">{feature.desc}</div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-sm space-y-3"
        >
          <Button
            size="lg"
            onClick={onStart}
            className="w-full h-14 rounded-xl text-lg font-semibold"
          >
            시작하기
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            약 2-3분 소요 · 로그인 시 결과 저장
          </p>
        </motion.div>
      </div>

      {/* Dimensions Preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="px-6 pb-8"
      >
        <div className="bg-secondary/50 rounded-xl p-4">
          <div className="text-center text-sm font-medium mb-3">분석 차원</div>
          <div className="flex justify-center gap-2 flex-wrap">
            {['경제', '안보', '젠더', '공정', '미래'].map((dim, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-background border border-border"
              >
                {dim}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
