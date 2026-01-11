import { motion } from 'framer-motion';
import { Brain, Heart, Sparkles, ChevronRight, Shield, Eye } from 'lucide-react';

interface GameIntroScreenProps {
  onStart: () => void;
}

export function GameIntroScreen({ onStart }: GameIntroScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col"
    >
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.8, delay: 0.2 }}
          className="relative mb-8"
        >
          {/* Outer glow rings */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 120, height: 120, marginLeft: -20, marginTop: -20 }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-accent/20"
            animate={{ 
              scale: [1, 1.8, 1],
              opacity: [0.3, 0, 0.3]
            }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
            style={{ width: 120, height: 120, marginLeft: -20, marginTop: -20 }}
          />
          
          {/* Main icon container */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg relative overflow-hidden">
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: [-100, 100] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            <div className="flex items-center gap-1">
              <Brain size={28} className="text-primary-foreground" />
              <Heart size={20} className="text-primary-foreground" />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold mb-2 tracking-tight">
            정책 밸런스 게임
          </h1>
          <p className="text-muted-foreground text-lg">
            나의 <span className="text-primary font-semibold">정치 성향</span>을 발견하는 여정
          </p>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-muted-foreground max-w-sm mb-10 leading-relaxed"
        >
          15개의 정책 질문에 답하고,<br/>
          알고리즘이 찾아낸 나의 정책 성향과<br/>
          <span className="text-foreground font-medium">가장 잘 맞는 후보</span>를 확인해보세요.
        </motion.p>

        {/* Journey Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-sm space-y-3 mb-10"
        >
          {[
            { icon: Sparkles, label: '정책 카드 스와이프', desc: '찬성/반대로 직관적 선택', color: 'text-indigo-500' },
            { icon: Heart, label: '나의 원픽 선택', desc: '결과 확인 전 마음 속 후보', color: 'text-rose-500' },
            { icon: Eye, label: '매칭 결과 분석', desc: '레이더 차트로 다각도 비교', color: 'text-emerald-500' },
            { icon: Shield, label: '표심 변화 확인', desc: '정책과 인물, 무엇이 중요한가', color: 'text-amber-500' },
          ].map((step, index) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center gap-4 p-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50"
            >
              <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${step.color}`}>
                <step.icon size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
              <span className="text-xs font-bold text-muted-foreground/50">
                {index + 1}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="p-6 pb-24 lg:pb-8"
      >
        <motion.button
          onClick={onStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-lg shadow-lg flex items-center justify-center gap-2 relative overflow-hidden group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Shimmer on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
            animate={{ x: [-200, 200] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span>시작하기</span>
          <ChevronRight size={20} />
        </motion.button>
        
        <p className="text-center text-xs text-muted-foreground mt-4">
          약 3~5분 소요 • 익명으로 진행됩니다
        </p>
      </motion.div>
    </motion.div>
  );
}
