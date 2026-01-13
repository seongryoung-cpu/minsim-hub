import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
    setIsLoading(true);
    
    const { error } = await signUpWithEmail(email, password, displayName);
    
    if (error) {
      toast.error('회원가입 실패', { description: error.message });
    } else {
      toast.success('회원가입 완료!', { description: '환영합니다!' });
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
          className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
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
                    간편하게 시작하세요
                  </p>

                  {/* Email Login - Primary */}
                  <Button
                    variant="default"
                    className="w-full h-12 gap-3"
                    onClick={() => setMode('login')}
                  >
                    <Mail className="w-5 h-5" />
                    이메일로 로그인
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">소셜 로그인</span>
                    </div>
                  </div>

                  {/* Social Login Buttons - Coming Soon */}
                  <div className="space-y-3 opacity-60">
                    <Button
                      variant="outline"
                      className="w-full h-12 gap-3 bg-[#FEE500] hover:bg-[#FEE500] text-black border-0 cursor-not-allowed"
                      disabled
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                        <path d="M12 3C6.477 3 2 6.477 2 11c0 2.89 1.863 5.423 4.637 6.867-.147.536-.564 2.023-.647 2.358-.103.418.153.412.322.3.132-.087 2.105-1.423 2.952-2.003.57.087 1.156.132 1.736.132 5.523 0 10-3.477 10-8s-4.477-8-10-8z"/>
                      </svg>
                      카카오 (준비 중)
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full h-12 gap-3 cursor-not-allowed"
                      disabled
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google (준비 중)
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      소셜 로그인은 곧 지원될 예정입니다
                    </p>
                  </div>

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
                    <label className="text-sm font-medium">닉네임</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="닉네임을 입력하세요"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
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

                  <Button type="submit" className="w-full h-12" disabled={isLoading}>
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
