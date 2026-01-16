import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, HelpCircle, ChevronRight, MapPin, FileText, Share2, Moon, Sun, LogOut, Shield, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { PQStatsCard } from '@/components/quiz/PQStatsCard';
import { PolicyMatchHistory, PolicyMatchResultModal } from '@/components/policy-match/PolicyMatchHistory';
import { ShareSheet } from '@/components/share/ShareSheet';
import { Switch } from '@/components/ui/switch';
import { AuthModal } from '@/components/auth/AuthModal';
import { VerificationBadge } from '@/components/auth/VerificationBadge';
import { IdentityVerificationModal } from '@/components/auth/IdentityVerificationModal';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import type { Region } from '@/types/region';
import type { PolicyMatchResult } from '@/hooks/usePolicyMatchResults';

interface MyPageProps {
  region: Region;
  onRegionChange: () => void;
}

const menuItems = [
  { icon: Bell, label: '알림 설정', description: '푸시 알림 관리', path: null },
  { icon: HelpCircle, label: '도움말', description: '자주 묻는 질문', path: null },
  { icon: FileText, label: '기획서', description: '앱 기능 명세 확인', path: '/app-info' },
];

export function MyPage({ region, onRegionChange }: MyPageProps) {
  const navigate = useNavigate();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<PolicyMatchResult | null>(null);
  const { user, isAuthenticated, isLoading, profile, signOut, refreshProfile } = useAuthContext();
  const { isAdmin } = useAdmin();
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('로그아웃 실패');
    } else {
      toast.success('로그아웃되었습니다');
    }
  };

  const handleVerificationSuccess = async () => {
    toast.success('본인 인증이 완료되었습니다!');
    await refreshProfile();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background pb-20"
    >
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="h-14 flex items-center px-4">
          <User size={22} className="text-primary mr-2" />
          <h1 className="font-semibold text-lg text-foreground">마이</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 shadow-app-md"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isAuthenticated ? (
            <>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="프로필" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-foreground text-lg">
                      {profile?.display_name || user?.email?.split('@')[0] || '시민'} 님
                    </h2>
                    <VerificationBadge level={profile?.verification_level ?? 'social'} size="sm" showLabel={false} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profile?.verification_level === 'identity' ? '본인 인증 완료' :
                     profile?.verification_level === 'phone' ? '휴대폰 인증 완료' :
                     '소셜 로그인 완료'}
                  </p>
                </div>
              </div>
              
              {/* 인증 레벨 업그레이드 안내 */}
              {(profile?.verification_level ?? 'social') !== 'identity' && (
                <div className="mt-4 p-3 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield size={16} className="text-primary" />
                    <span className="text-muted-foreground">
                      {(profile?.verification_level ?? 'social') === 'social' 
                        ? '본인 인증을 완료하면 더 많은 기능을 이용할 수 있어요' 
                        : '본인 인증을 완료하면 투표 참여가 가능해요'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="w-full mt-2 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium"
                  >
                    본인 인증하기
                  </button>
                </div>
              )}
              
              {/* Admin Link */}
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full mt-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Settings size={18} />
                  관리자 페이지
                </button>
              )}
              
              <button
                onClick={handleSignOut}
                className="w-full mt-4 py-3 bg-secondary text-foreground rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                로그아웃
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={32} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-foreground text-lg">시민 님</h2>
                  <p className="text-sm text-muted-foreground">로그인하고 더 많은 기능을 이용하세요</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full mt-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
              >
                로그인 / 회원가입
              </button>
            </>
          )}
        </motion.div>

        {/* Policy Match History */}
        <PolicyMatchHistory onViewResult={(result) => setSelectedResult(result)} />

        {/* PQ Stats Card */}
        <PQStatsCard />

        {/* Region Setting */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={onRegionChange}
          className="w-full bg-card rounded-2xl p-4 shadow-app-md flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <MapPin size={20} className="text-accent" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">내 지역</p>
              <p className="text-sm text-muted-foreground">{region.sido} {region.sigungu}</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-muted-foreground" />
        </motion.button>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl shadow-app-md overflow-hidden"
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => item.path && navigate(item.path)}
                className={`w-full p-4 flex items-center justify-between active:bg-secondary/50 transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Icon size={20} className="text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-muted-foreground" />
              </button>
            );
          })}
        </motion.div>

        {/* Dark Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-2xl p-4 shadow-app-md flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              {isDarkMode ? (
                <Moon size={20} className="text-primary" />
              ) : (
                <Sun size={20} className="text-amber-500" />
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">다크 모드</p>
              <p className="text-xs text-muted-foreground">
                {isDarkMode ? '어두운 테마 사용 중' : '밝은 테마 사용 중'}
              </p>
            </div>
          </div>
          <Switch
            checked={isDarkMode}
            onCheckedChange={setIsDarkMode}
          />
        </motion.div>

        {/* Share Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => setIsShareOpen(true)}
          className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-4 shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Share2 size={20} />
          <span className="font-medium">앱 공유하기</span>
        </motion.button>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center py-4"
        >
          <p className="text-xs text-muted-foreground">민심잇다 v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">나의 목소리가 정치가 되는 곳</p>
        </motion.div>
      </main>

      <ShareSheet
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        title="민심잇다"
        description="나의 목소리가 정치가 되는 곳 - 2026 지방선거 정보 플랫폼"
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <IdentityVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onSuccess={handleVerificationSuccess}
      />

      <PolicyMatchResultModal
        result={selectedResult}
        isOpen={!!selectedResult}
        onClose={() => setSelectedResult(null)}
      />
    </motion.div>
  );
}
