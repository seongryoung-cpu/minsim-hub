import { motion } from 'framer-motion';
import { Vote, Calendar, Users, TrendingUp } from 'lucide-react';

export function Election() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background pb-20"
    >
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="h-14 flex items-center px-4">
          <Vote size={22} className="text-primary mr-2" />
          <h1 className="font-semibold text-lg text-foreground">선거</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-app-md text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Calendar size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            2026 지방선거
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            D-143
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary rounded-xl p-3">
              <Users size={20} className="text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">후보자</p>
              <p className="font-semibold text-foreground">준비중</p>
            </div>
            <div className="bg-secondary rounded-xl p-3">
              <TrendingUp size={20} className="text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">여론조사</p>
              <p className="font-semibold text-foreground">준비중</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-5 shadow-app-md"
        >
          <h3 className="font-semibold text-foreground mb-3">📋 선거 준비 체크리스트</h3>
          <ul className="space-y-3">
            {['선거인명부 확인', '투표소 위치 확인', '후보자 정책 비교'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                  {i + 1}
                </div>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </main>
    </motion.div>
  );
}
