import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, HelpCircle, ChevronRight, MapPin, FileText, Share2, Moon, Sun, LogOut, Shield, Settings, Mail, Phone, ExternalLink, Trash2, Loader2, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { PQStatsCard } from '@/components/quiz/PQStatsCard';
import { PolicyMatchHistory, PolicyMatchResultModal } from '@/components/policy-match/PolicyMatchHistory';
import { FollowedCandidatesList } from '@/components/candidate/FollowedCandidatesList';
import { ShareSheet } from '@/components/share/ShareSheet';
import { Switch } from '@/components/ui/switch';
import { AuthModal } from '@/components/auth/AuthModal';
import { VerificationBadge } from '@/components/auth/VerificationBadge';
import { IdentityVerificationModal } from '@/components/auth/IdentityVerificationModal';

import { useAuthContext } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useAppSettings } from '@/hooks/useAppSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Region } from '@/types/region';
import type { PolicyMatchResult } from '@/hooks/usePolicyMatchResults';

interface MyPageProps {
  region: Region;
  onRegionChange: () => void;
}

const menuItems = [
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
  const { settings: appSettings } = useAppSettings();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('로그인이 필요합니다');
        setIsDeleting(false);
        return;
      }

      const response = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      toast.success('회원 탈퇴가 완료되었습니다');
      setIsDeleteDialogOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('회원 탈퇴에 실패했습니다');
    }
    
    setIsDeleting(false);
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
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSignOut}
                  className="flex-1 py-3 bg-secondary text-foreground rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  로그아웃
                </button>
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="py-3 px-4 bg-destructive/10 text-destructive rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
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

        {/* Followed Candidates */}
        <FollowedCandidatesList />

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

        {/* Notification Settings */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => navigate('/notification-settings')}
          className="w-full bg-card rounded-2xl p-4 shadow-app-md flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell size={20} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">알림 설정</p>
              <p className="text-sm text-muted-foreground">푸시 알림, 알림 유형별 설정</p>
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

        {/* Contact & Social Links */}
        {appSettings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card rounded-2xl p-4 shadow-app-md space-y-3"
          >
            <h3 className="font-medium text-sm text-muted-foreground">문의 및 소셜</h3>
            
            {/* Contact Info */}
            <div className="space-y-2">
              {appSettings.contact_email && (
                <a
                  href={`mailto:${appSettings.contact_email}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <Mail size={18} className="text-muted-foreground" />
                  <span className="text-sm">{appSettings.contact_email}</span>
                </a>
              )}
              {appSettings.contact_phone && (
                <a
                  href={`tel:${appSettings.contact_phone}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <Phone size={18} className="text-muted-foreground" />
                  <span className="text-sm">{appSettings.contact_phone}</span>
                </a>
              )}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2 pt-2">
              {appSettings.social_x && (
                <a
                  href={appSettings.social_x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/70 transition-colors"
                  aria-label="X (Twitter)"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
              {appSettings.social_facebook && (
                <a
                  href={appSettings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/70 transition-colors"
                  aria-label="Facebook"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              )}
              {appSettings.social_instagram && (
                <a
                  href={appSettings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/70 transition-colors"
                  aria-label="Instagram"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              )}
              {appSettings.social_youtube && (
                <a
                  href={appSettings.social_youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/70 transition-colors"
                  aria-label="YouTube"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* Legal Links */}
        {appSettings && (appSettings.link_privacy || appSettings.link_terms) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-4"
          >
            {appSettings.link_terms && (
              <a
                href={appSettings.link_terms}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
              >
                이용약관
              </a>
            )}
            {appSettings.link_privacy && appSettings.link_terms && (
              <span className="text-muted-foreground">|</span>
            )}
            {appSettings.link_privacy && (
              <a
                href={appSettings.link_privacy}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
              >
                개인정보처리방침
              </a>
            )}
          </motion.div>
        )}

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-center py-4"
        >
          <p className="text-xs text-muted-foreground">
            {appSettings?.app_name || '민심잇다'} v{appSettings?.app_version || '1.0.0'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {appSettings?.app_slogan || '나의 목소리가 정치가 되는 곳'}
          </p>
        </motion.div>
      </main>

      <ShareSheet
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        title={appSettings?.app_name || '민심잇다'}
        description={`${appSettings?.app_slogan || '나의 목소리가 정치가 되는 곳'} - 2026 지방선거 정보 플랫폼`}
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

      {/* Delete Account Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>회원 탈퇴</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 탈퇴하시겠습니까?
              <br /><br />
              탈퇴 시 모든 데이터(프로필, 정책 매칭 결과, 퀴즈 기록 등)가 삭제되며, 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : '탈퇴하기'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
