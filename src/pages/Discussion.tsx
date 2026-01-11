import { motion } from 'framer-motion';
import { MessageSquare, TrendingUp, Clock, Users } from 'lucide-react';

const topics = [
  { id: 1, title: '지역 버스 노선 개편에 대한 의견', comments: 42, hot: true },
  { id: 2, title: '공원 주차장 확대 필요성', comments: 28, hot: false },
  { id: 3, title: '초등학교 앞 횡단보도 신호 시간', comments: 15, hot: false },
];

export function Discussion() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background pb-20"
    >
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="h-14 flex items-center px-4">
          <MessageSquare size={22} className="text-primary mr-2" />
          <h1 className="font-semibold text-lg text-foreground">토론</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 shadow-app-md"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-accent" />
            <h2 className="font-semibold text-foreground">인기 토론</h2>
          </div>
          <div className="space-y-3">
            {topics.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-secondary rounded-xl active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-foreground text-sm flex-1">{topic.title}</h3>
                  {topic.hot && (
                    <span className="ml-2 px-2 py-0.5 bg-accent text-accent-foreground text-xs font-medium rounded-full">
                      HOT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} />
                    {topic.comments}개 의견
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5 text-white"
        >
          <h3 className="font-semibold mb-2">💡 토론에 참여하세요</h3>
          <p className="text-sm text-white/80 mb-3">
            지역 이슈에 대한 여러분의 생각을 나눠주세요
          </p>
          <button className="bg-white text-primary px-4 py-2 rounded-xl font-medium text-sm">
            새 토론 시작하기
          </button>
        </motion.div>
      </main>
    </motion.div>
  );
}
