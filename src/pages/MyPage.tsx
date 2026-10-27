import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ChevronRight, Settings, Mail, Phone, Loader2, Brain, Compass, ArrowLeftRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
import { PolicyMatchHistory, PolicyMatchResultModal } from '@/components/policy-match/PolicyMatchHistory';
import { FollowedCandidatesList } from '@/components/candidate/FollowedCandidatesList';
import { ListPanel, Panel, SectionHeader, Tag, primaryButton } from '@/components/ds';
import { useMyGonglonStats } from '@/hooks/useMyGonglonStats';
import { useQuizStats } from '@/hooks/useQuizStats';
import { useUserSpectrum } from '@/hooks/useSpectrumTest';
import { usePolicyMatchResults } from '@/hooks/usePolicyMatchResults';
import { getSpectrumLabel } from '@/types/political-mbti';
import { ShareSheet } from '@/components/share/ShareSheet';
import { Switch } from '@/components/ui/switch';
import { AuthModal } from '@/components/auth/AuthModal';
import { VerificationBadge } from '@/components/auth/VerificationBadge';
import { IdentityVerificationModal } from '@/components/auth/IdentityVerificationModal';
import { ProfileEditSheet } from '@/components/profile/ProfileEditSheet';
import { PrivacySettingsCard } from '@/components/privacy/PrivacySettingsCard';
import { clearUserLocalData, unsubscribeWebPush } from '@/lib/sessionCleanup';
import { publicName } from '@/hooks/usePrivacy';
import { useQueryClient } from '@tanstack/react-query';

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
import { SIDO_SHORT, type Region } from '@/types/region';
import type { PolicyMatchResult } from '@/hooks/usePolicyMatchResults';

interface MyPageProps {
  region: Region;
  onRegionChange: () => void;
}

const VERIFY_LABEL: Record<string, string> = { identity: '본인 인증', phone: '휴대폰 인증', social: '소셜 로그인' };

export function MyPage({ region, onRegionChange }: MyPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<PolicyMatchResult | null>(null);
  const { user, isAuthenticated, isLoading, profile, signOut, refreshProfile } = useAuthContext();
  const { isAdmin } = useAdmin();
  const { settings: appSettings } = useAppSettings();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  
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

  // 탈퇴: 서버에서 계정을 지우면(FK CASCADE) 계정에 딸린 데이터가 함께 지워진다.
  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      // 프로필 사진은 저장소 파일이라 DB CASCADE로 안 지워진다 — 먼저 지운다 (실패해도 탈퇴는 진행)
      const { data: files } = await supabase.storage.from('avatars').list(user.id);
      if (files?.length) {
        await supabase.storage.from('avatars').remove(files.map((f) => `${user.id}/${f.name}`));
      }

      const { error } = await supabase.rpc('delete_my_account');
      if (error) {
        toast.error(error.message.includes('last_admin')
          ? '마지막 관리자는 탈퇴할 수 없어요. 다른 관리자를 먼저 지정해 주세요.'
          : '회원 탈퇴에 실패했어요. 잠시 뒤 다시 해 주세요.');
        setIsDeleting(false);
        return;
      }

      await unsubscribeWebPush();
      await supabase.auth.signOut({ scope: 'local' });
      queryClient.clear();
      clearUserLocalData();
      setIsDeleteDialogOpen(false);
      toast.success('탈퇴했어요. 그동안 함께해 주셔서 고마워요.');
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('회원 탈퇴에 실패했어요. 잠시 뒤 다시 해 주세요.');
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
      <header className="sticky top-0 z-20 border-b border-border bg-card">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-[17px] font-bold">마이</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 pb-10 pt-5">
        {/* 프로필 */}
        <Panel className="p-[18px]">
          {isLoading ? (
            <div className="h-14 animate-pulse rounded-xl bg-secondary motion-reduce:animate-none" />
          ) : isAuthenticated ? (
            <>
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsProfileEditOpen(true)}
                  aria-label="프로필 사진 바꾸기"
                  className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-[19px] font-extrabold text-primary-strong"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    publicName(profile).slice(0, 1)
                  )}
                </button>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="truncate text-[17px] font-bold">{publicName(profile)}</h2>
                    <VerificationBadge level={profile?.verification_level ?? 'social'} size="sm" showLabel={false} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Tag>{[SIDO_SHORT[region.sido as keyof typeof SIDO_SHORT] ?? region.sido, region.sigungu].filter(Boolean).join(' · ')}</Tag>
                    <Tag>{VERIFY_LABEL[profile?.verification_level ?? 'social'] ?? '소셜 로그인'}</Tag>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileEditOpen(true)}
                  className="h-9 shrink-0 rounded-full border border-border px-3 text-[13px] font-semibold hover:bg-secondary"
                >
                  프로필 수정
                </button>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-[14px] font-semibold hover:bg-secondary"
                >
                  <Settings size={16} aria-hidden /> 관리자 페이지
                </button>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <span aria-hidden className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary-soft text-primary-strong">
                  <User size={24} />
                </span>
                <div>
                  <h2 className="text-[17px] font-bold">로그인하고 시작해요</h2>
                  <p className="text-[13px] text-muted-foreground">참여한 공론과 관심 정치인이 여기 모여요</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsAuthModalOpen(true)} className={primaryButton}>
                로그인 / 회원가입
              </button>
            </div>
          )}
        </Panel>

        {isAuthenticated && <MyGonglonSection />}

        <FollowedCandidatesList />

        <TestsSection />

        <PolicyMatchHistory onViewResult={(result) => setSelectedResult(result)} />

        {/* 설정 */}
        <section aria-labelledby="settings-title" className="space-y-2.5">
          <SectionHeader id="settings-title" title="설정" />
          <ListPanel>
            <SettingRow label="내 지역" value={`${region.sido} ${region.sigungu}`} onClick={onRegionChange} />
            <SettingRow label="알림 설정" onClick={() => navigate('/notification-settings')} />
            <SettingRow label="도움말" value="자주 묻는 질문" onClick={() => navigate('/faq')} />
            <div className="flex min-h-[52px] items-center justify-between px-4">
              <span id="dark-mode-label" className="text-[15px]">다크 모드</span>
              <Switch aria-labelledby="dark-mode-label" checked={isDarkMode} onCheckedChange={setIsDarkMode} />
            </div>
          </ListPanel>
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="flex h-12 w-full items-center justify-center rounded-xl border border-border bg-card text-[15px] font-semibold hover:bg-secondary"
          >
            앱 공유하기
          </button>
        </section>

        {/* 개인정보 · 탈퇴 */}
        {isAuthenticated && <PrivacySettingsCard onRequestDeleteAccount={() => setIsDeleteDialogOpen(true)} />}

        {/* 문의 및 소셜 */}
        {appSettings && (appSettings.contact_email || appSettings.contact_phone || appSettings.social_x || appSettings.social_facebook || appSettings.social_instagram || appSettings.social_youtube) && (
          <section aria-labelledby="contact-title" className="space-y-2.5">
            <SectionHeader id="contact-title" title="문의" />
            <Panel className="space-y-1 p-2">
              {appSettings.contact_email && (
                <a href={`mailto:${appSettings.contact_email}`} className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-secondary">
                  <Mail size={17} className="text-muted-foreground" aria-hidden />
                  <span className="text-[14px]">{appSettings.contact_email}</span>
                </a>
              )}
              {appSettings.contact_phone && (
                <a href={`tel:${appSettings.contact_phone}`} className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-secondary">
                  <Phone size={17} className="text-muted-foreground" aria-hidden />
                  <span className="text-[14px]">{appSettings.contact_phone}</span>
                </a>
              )}
              <div className="flex items-center gap-2 px-1 pt-1">
                {SOCIALS.map(({ key, label, path }) => {
                  const href = appSettings[key];
                  if (!href) return null;
                  return (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-secondary"
                    >
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden><path d={path} /></svg>
                    </a>
                  );
                })}
              </div>
            </Panel>
          </section>
        )}

        {/* 맨 아래 */}
        <footer className="space-y-1 pt-2 text-center text-[12px] text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            {!isAuthenticated && (
              <>
                <a
                  href={appSettings?.link_terms || '/terms'}
                  onClick={(e) => { if (!appSettings?.link_terms) { e.preventDefault(); navigate('/terms'); } }}
                  className="underline-offset-2 hover:underline"
                >
                  이용약관
                </a>
                <span aria-hidden>·</span>
                <a
                  href={appSettings?.link_privacy || '/privacy'}
                  onClick={(e) => { if (!appSettings?.link_privacy) { e.preventDefault(); navigate('/privacy'); } }}
                  className="underline-offset-2 hover:underline"
                >
                  개인정보처리방침
                </a>
              </>
            )}
            {isAuthenticated && (
              <button type="button" onClick={handleSignOut} className="min-h-10 px-2 font-semibold underline-offset-2 hover:underline">
                로그아웃
              </button>
            )}
          </p>
          <p>
            {appSettings?.app_name || '민심잇다'} v{appSettings?.app_version || '1.0.0'} · {appSettings?.app_slogan || '나의 목소리가 정치가 되는 곳'}
          </p>
        </footer>
      </main>

      <ProfileEditSheet
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
      />

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
              탈퇴하면 계정과 함께 프로필, 공론 투표·주장, 성향·정책 매칭 결과, 퀴즈 기록, 관심 후보, 알림 설정이 모두 지워지고 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleDeleteAccount(); }}
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

const SOCIALS = [
  { key: 'social_x', label: 'X (트위터)', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  { key: 'social_facebook', label: '페이스북', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { key: 'social_instagram', label: '인스타그램', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
  { key: 'social_youtube', label: '유튜브', path: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
] as const;

function SettingRow({ label, value, onClick }: { label: string; value?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 text-left hover:bg-secondary/50">
      <span className="text-[15px]">{label}</span>
      <span className="flex min-w-0 items-center gap-1 text-[13px] text-muted-foreground">
        {value && <span className="truncate">{value}</span>}
        <ChevronRight size={16} aria-hidden />
      </span>
    </button>
  );
}

/** '나의 공론' — 참여한 의제 / 생각이 바뀐 의제 / 남긴 한 줄 의견 + 마지막 생각 안내 */
function MyGonglonSection() {
  const { data, isLoading } = useMyGonglonStats();
  const cells = [
    { n: data?.agendas ?? 0, label: '참여한 의제' },
    { n: data?.changed ?? 0, label: '생각이 바뀐 의제' },
    { n: data?.statements ?? 0, label: '남긴 한 줄 의견' },
  ];
  return (
    <section aria-labelledby="my-gonglon-title" className="space-y-2.5">
      <SectionHeader id="my-gonglon-title" title="나의 공론" to="/gonglon?tab=mine" action="전체" />
      {isLoading ? (
        <div className="h-[84px] animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
      ) : (
        <Panel as="div" className="grid grid-cols-3 p-4 text-center">
          {cells.map((c, i) => (
            <div key={c.label} className={i === 1 ? 'border-x border-border' : undefined}>
              <p className="text-[22px] font-extrabold leading-tight">{c.n}</p>
              <p className="text-[12px] text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </Panel>
      )}
      {!!data?.needs_final && data.needs_final_agenda_id && (
        <Link
          to={`/gonglon/${data.needs_final_agenda_id}`}
          className="flex items-center justify-between rounded-xl bg-tone-new px-3.5 py-3 text-[14px] font-semibold text-tone-new-fg"
        >
          마지막 생각을 안 남긴 의제 {data.needs_final}개
          <ChevronRight size={18} aria-hidden />
        </Link>
      )}
      {!isLoading && (data?.agendas ?? 0) === 0 && (
        <Link to="/gonglon" className="block text-[13px] font-semibold text-primary hover:text-primary-strong">
          진행 중인 공론 보러 가기
        </Link>
      )}
    </section>
  );
}

/** '테스트와 퀴즈' — 정치 문해력 · 정치 성향 · 정책 매칭으로 가는 줄 */
function TestsSection() {
  const { stats, isLoaded, canPlayToday } = useQuizStats();
  const { data: spectrum } = useUserSpectrum();
  const { data: matches } = usePolicyMatchResults();
  const played = stats.totalQuizzes > 0;
  const pqLine = !isLoaded
    ? '불러오는 중'
    : played
      ? `${stats.totalPoints}점 · 상위 ${100 - stats.percentile}% · ${stats.currentStreak}일 연속`
      : '아직 퀴즈를 풀지 않았어요';
  const spectrumLine = spectrum
    ? `${getSpectrumLabel(spectrum.scores) || '중도 성향'} · ${spectrum.totalAnswers}개 응답`
    : '아직 테스트를 하지 않았어요';
  const matchLine = matches && matches.length > 0 ? `저장된 결과 ${matches.length}개` : '공약을 넘기며 가까운 후보 찾기';

  return (
    <section aria-labelledby="tests-title" className="space-y-2.5">
      <SectionHeader id="tests-title" title="테스트와 퀴즈" />
      <ListPanel>
        <TestRow to="/quiz" icon={<Brain size={20} />} title="정치 문해력 (PQ)" line={pqLine}
          tag={isLoaded && canPlayToday() ? <Tag tone="info">오늘 퀴즈</Tag> : undefined} />
        <TestRow to="/political-mbti" icon={<Compass size={20} />} title="나의 정치 성향" line={spectrumLine} />
        <TestRow to="/policy-match" icon={<ArrowLeftRight size={20} />} title="정책 매칭" line={matchLine} />
      </ListPanel>
    </section>
  );
}

function TestRow({ to, icon, title, line, tag }: { to: string; icon: ReactNode; title: string; line: string; tag?: ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50">
      <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className="block truncate text-[13px] text-muted-foreground">{line}</span>
      </span>
      {tag ?? <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden />}
    </Link>
  );
}
