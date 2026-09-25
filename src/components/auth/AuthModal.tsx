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
