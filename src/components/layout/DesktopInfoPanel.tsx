import { motion } from 'framer-motion';
import { Calendar, Users, TrendingUp, Bell, ExternalLink } from 'lucide-react';

interface QuickStatProps {
  icon: typeof Calendar;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

function QuickStat({ icon: Icon, label, value, trend, trendUp }: QuickStatProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={18} className="text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground">{value}</p>
          {trend && (
            <span className={`text-xs ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface NewsItemProps {
  title: string;
  time: string;
  category: string;
}

function NewsItem({ title, time, category }: NewsItemProps) {
  return (
    <motion.div 
      whileHover={{ x: 4 }}
      className="p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-start gap-2 mb-1">
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
          {category}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">{time}</span>
      </div>
      <p className="text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
        {title}
      </p>
    </motion.div>
  );
}

export function DesktopInfoPanel() {
  return (
    <aside className="hidden xl:flex flex-col w-80 bg-card border-l border-border h-screen sticky top-0 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="font-bold text-lg text-foreground">실시간 현황</h2>
        <p className="text-xs text-muted-foreground">최신 정치 소식과 통계</p>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-border">
        <p className="text-xs font-medium text-muted-foreground mb-3">주요 지표</p>
        <div className="space-y-2">
          <QuickStat 
            icon={Calendar} 
            label="대선까지" 
            value="D-158" 
          />
          <QuickStat 
            icon={Users} 
            label="등록 후보자" 
            value="12명" 
            trend="+2" 
            trendUp 
          />
          <QuickStat 
            icon={TrendingUp} 
            label="오늘 참여자" 
            value="3,482명" 
            trend="+15%" 
            trendUp 
          />
        </div>
      </div>

      {/* Recent News */}
      <div className="p-4 border-b border-border flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground">최신 소식</p>
          <button className="text-xs text-primary hover:underline flex items-center gap-1">
            전체보기 <ExternalLink size={12} />
          </button>
        </div>
        <div className="space-y-1">
          <NewsItem 
            category="선거" 
            title="중앙선거관리위원회, 사전투표 일정 확정 발표" 
            time="2시간 전"
          />
          <NewsItem 
            category="정책" 
            title="여야, 청년 주거 정책 공약 경쟁 본격화" 
            time="4시간 전"
          />
          <NewsItem 
            category="지역" 
            title="인천시, 제물포구 신설에 따른 행정 구역 재편 착수" 
            time="6시간 전"
          />
          <NewsItem 
            category="토론" 
            title="'기본소득 도입' 찬반 토론 참여자 급증" 
            time="8시간 전"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={14} className="text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">알림</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/10">
            <div className="w-2 h-2 rounded-full bg-accent mt-1.5" />
            <div>
              <p className="text-sm text-foreground">새로운 후보자 공약이 등록되었습니다.</p>
              <p className="text-xs text-muted-foreground mt-1">10분 전</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
            <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5" />
            <div>
              <p className="text-sm text-foreground">정책 매칭 결과를 확인해보세요.</p>
              <p className="text-xs text-muted-foreground mt-1">1시간 전</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
