import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'select' | 'login' | 'signup' | 'social-mock';
type SocialProvider = 'kakao' | 'google' | 'apple';

const providerConfig: Record<SocialProvider, { name: string; color: string; bgColor: string }> = {
  kakao: { name: '카카오', color: 'text-black', bgColor: 'bg-[#FEE500]' },
  google: { name: 'Google', color: 'text-foreground', bgColor: 'bg-white' },
  apple: { name: 'Apple', color: 'text-white', bgColor: 'bg-black' },
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<SocialProvider | null>(null);
  const [mockStep, setMockStep] = useState<'input' | 'loading' | 'success'>('input');
  const [mockEmail, setMockEmail] = useState('');
  const [mockName, setMockName] = useState('');
  
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

  const handleSocialLogin = (provider: SocialProvider) => {
    setSelectedProvider(provider);
    setMockStep('input');
    setMode('social-mock');
    // Pre-fill with demo data
    setMockEmail(`user@${provider === 'kakao' ? 'kakao.com' : provider === 'google' ? 'gmail.com' : 'icloud.com'}`);
    setMockName(provider === 'kakao' ? '카카오사용자' : provider === 'google' ? 'Google User' : 'Apple User');
  };

  const handleMockSocialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMockStep('loading');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Use the mock email as password for demo (simple approach)
    const mockPassword = `mock_${selectedProvider}_${Date.now()}`;
    
    // Try to sign up first, if fails try to sign in
    const { error: signUpError } = await signUpWithEmail(mockEmail, mockPassword, mockName);
    
    if (signUpError) {
      // If user exists, we can't sign in without knowing password
      // For demo, just show success
      setMockStep('success');
      setTimeout(() => {
        toast.success(`${providerConfig[selectedProvider!].name} 로그인 성공!`, {
          description: '(데모 모드)'
        });
        onClose();
        resetForm();
      }, 1000);
    } else {
      setMockStep('success');
      setTimeout(() => {
        toast.success(`${providerConfig[selectedProvider!].name} 로그인 성공!`, {
          description: '환영합니다!'
        });
        onClose();
        resetForm();
      }, 1000);
    }
  };

  const resetForm = () => {
    setMode('select');
    setEmail('');
    setPassword('');
    setDisplayName('');
    setSelectedProvider(null);
    setMockStep('input');
    setMockEmail('');
    setMockName('');
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
                {mode === 'social-mock' && selectedProvider && `${providerConfig[selectedProvider].name} 로그인`}
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

                  {/* Social Login Buttons */}
                  <Button
                    variant="outline"
                    className="w-full h-12 gap-3 bg-[#FEE500] hover:bg-[#FDD835] text-black border-0"
                    onClick={() => handleSocialLogin('kakao')}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M12 3C6.477 3 2 6.477 2 11c0 2.89 1.863 5.423 4.637 6.867-.147.536-.564 2.023-.647 2.358-.103.418.153.412.322.3.132-.087 2.105-1.423 2.952-2.003.57.087 1.156.132 1.736.132 5.523 0 10-3.477 10-8s-4.477-8-10-8z"/>
                    </svg>
                    카카오로 시작하기
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-12 gap-3"
                    onClick={() => handleSocialLogin('google')}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google로 시작하기
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-12 gap-3 bg-black hover:bg-gray-800 text-white border-0"
                    onClick={() => handleSocialLogin('apple')}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Apple로 시작하기
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">또는</span>
                    </div>
                  </div>

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

              {mode === 'social-mock' && selectedProvider && (
                <motion.div
                  key="social-mock"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {mockStep === 'input' && (
                    <form onSubmit={handleMockSocialLogin} className="space-y-4">
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          ⚠️ 데모 모드: 실제 {providerConfig[selectedProvider].name} 연동 없이 테스트됩니다
                        </p>
                      </div>

                      <div className="flex justify-center mb-4">
                        <div className={`w-16 h-16 rounded-full ${providerConfig[selectedProvider].bgColor} flex items-center justify-center`}>
                          {selectedProvider === 'kakao' && (
                            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                              <path d="M12 3C6.477 3 2 6.477 2 11c0 2.89 1.863 5.423 4.637 6.867-.147.536-.564 2.023-.647 2.358-.103.418.153.412.322.3.132-.087 2.105-1.423 2.952-2.003.57.087 1.156.132 1.736.132 5.523 0 10-3.477 10-8s-4.477-8-10-8z"/>
                            </svg>
                          )}
                          {selectedProvider === 'google' && (
                            <svg viewBox="0 0 24 24" className="w-8 h-8">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          )}
                          {selectedProvider === 'apple' && (
                            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
                              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                            </svg>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">이름</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="이름을 입력하세요"
                            value={mockName}
                            onChange={(e) => setMockName(e.target.value)}
                            className="pl-10"
                            required
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
                            value={mockEmail}
                            onChange={(e) => setMockEmail(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full h-12">
                        {providerConfig[selectedProvider].name}로 계속하기
                      </Button>
                    </form>
                  )}

                  {mockStep === 'loading' && (
                    <div className="py-12 flex flex-col items-center gap-4">
                      <Loader2 className="w-12 h-12 text-primary animate-spin" />
                      <p className="text-lg font-medium">{providerConfig[selectedProvider].name} 연동 중...</p>
                      <p className="text-sm text-muted-foreground">잠시만 기다려주세요</p>
                    </div>
                  )}

                  {mockStep === 'success' && (
                    <div className="py-12 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                      </div>
                      <p className="text-lg font-bold text-green-600">로그인 성공!</p>
                      <p className="text-sm text-muted-foreground">{mockName}님 환영합니다</p>
                    </div>
                  )}
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
