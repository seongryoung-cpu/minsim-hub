import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { checkNickname, NICKNAME_MESSAGES, NICKNAME_RULE } from '@/hooks/usePrivacy';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'select' | 'login' | 'signup';
export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // 필수 동의 (선택 동의는 가입 때 받지 않는다 — 정치 성향 저장은 결과를 본 뒤 따로 묻는다)
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge14, setAgreeAge14] = useState(false);
  const [nickError, setNickError] = useState<string | null>(null);
  const allAgreed = agreeTerms && agreePrivacy && agreeAge14;
  
  const { signInWithEmail, signUpWithEmail } = useAuthContext();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signInWithEmail(email, password);
    
    if (error) {
      toast.error('로그인 실패', { description: error.message });
    } else {
      toast.success('로그인 성공!');
      onClose();
      resetForm();
    }
    setIsLoading(false);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAgreed) {
      toast.error('필수 항목에 모두 동의해 주세요');
      return;
    }
    setIsLoading(true);

    const nick = displayName.trim();
    try {
      const code = await checkNickname(nick);
      if (code !== 'ok') {
        setNickError(NICKNAME_MESSAGES[code]);
        setIsLoading(false);
        return;
      }
    } catch {
      /* 확인을 못 해도 가입은 진행 — 겹치면 나중에 닉네임을 다시 정하게 한다 */
    }

    const { data, error } = await signUpWithEmail(email, password, nick, {
      terms: agreeTerms,
      privacy: agreePrivacy,
      age14: agreeAge14,
    });

    if (error) {
      toast.error('회원가입 실패', { description: error.message });
    } else if (!data?.session) {
      // 이메일 확인이 켜져 있으면 세션 없이 돌아온다 — '완료'가 아니라 '확인 메일을 보냈다'가 맞다
      toast.success('확인 메일을 보냈어요', { description: `${email}로 온 메일의 링크를 누르면 가입이 끝나요.` });
      onClose();
      resetForm();
    } else {
      toast.success('가입을 마쳤어요', { description: '환영해요!' });
      onClose();
      resetForm();
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setMode('select');
    setEmail('');
    setPassword('');
    setDisplayName('');
    setAgreeTerms(false);
    setAgreePrivacy(false);
    setAgreeAge14(false);
    setNickError(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              {mode !== 'select' && (
                <button
                  onClick={() => setMode('select')}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-lg font-bold">
                {mode === 'select' && '로그인 / 회원가입'}
                {mode === 'login' && '로그인'}
                {mode === 'signup' && '회원가입'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {mode === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    이메일로 로그인하거나 새 계정을 만드세요
                  </p>

                  <Button
                    variant="outline"
                    className="w-full h-12 gap-3"
                    onClick={() => setMode('login')}
                  >
                    <Mail className="w-5 h-5" />
                    이메일로 로그인
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    계정이 없으신가요?{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="text-primary font-medium hover:underline"
                    >
                      회원가입
                    </button>
                  </p>
                </motion.div>
              )}

              {mode === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                  onSubmit={handleEmailLogin}
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">이메일</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">비밀번호</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      '로그인'
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    계정이 없으신가요?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-primary font-medium hover:underline"
                    >
                      회원가입
                    </button>
                  </p>
                </motion.form>
              )}

              {mode === 'signup' && (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                  onSubmit={handleEmailSignup}
                >
                  <div className="space-y-2">
                    <label htmlFor="signup-nickname" className="text-sm font-medium">공개 닉네임</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="signup-nickname"
                        type="text"
                        placeholder="다른 사람에게 보일 이름"
                        value={displayName}
                        onChange={(e) => { setDisplayName(e.target.value); setNickError(null); }}
                        className="pl-10"
                        maxLength={12}
                        required
                        aria-invalid={!!nickError}
                        aria-describedby="signup-nickname-help"
                      />
                    </div>
                    <p id="signup-nickname-help" className={`text-xs ${nickError ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {nickError ?? `${NICKNAME_RULE}. 실명은 피해 주세요.`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">이메일</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">비밀번호</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="6자 이상 입력하세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <fieldset className="space-y-2.5 rounded-xl border border-border p-3">
                    <legend className="sr-only">필수 동의</legend>
                    <label className="flex items-center gap-2.5 border-b border-border/60 pb-2.5 text-sm font-semibold">
                      <Checkbox
                        checked={allAgreed}
                        onCheckedChange={(v) => { const on = v === true; setAgreeTerms(on); setAgreePrivacy(on); setAgreeAge14(on); }}
                      />
                      모두 동의 (필수)
                    </label>
                    <label className="flex items-center gap-2.5 text-sm">
                      <Checkbox checked={agreeAge14} onCheckedChange={(v) => setAgreeAge14(v === true)} />
                      만 14세 이상이에요
                    </label>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <label className="flex items-center gap-2.5">
                        <Checkbox checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(v === true)} />
                        이용약관 동의
                      </label>
                      <Link to="/terms" onClick={onClose} className="text-xs text-muted-foreground underline">보기</Link>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <label className="flex items-center gap-2.5">
                        <Checkbox checked={agreePrivacy} onCheckedChange={(v) => setAgreePrivacy(v === true)} />
                        개인정보 수집·이용 동의
                      </label>
                      <Link to="/privacy" onClick={onClose} className="text-xs text-muted-foreground underline">보기</Link>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      정치 성향 결과 저장은 여기서 묻지 않아요. 테스트 결과를 본 뒤 따로 여쭤봐요.
                    </p>
                  </fieldset>

                  <Button type="submit" className="w-full h-12" disabled={isLoading || !allAgreed}>
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      '회원가입'
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    이미 계정이 있으신가요?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-primary font-medium hover:underline"
                    >
                      로그인
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
