import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, User, Phone, Calendar, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IdentityVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type VerificationStep = 'form' | 'verifying' | 'success' | 'error';

const carriers = [
  { value: 'SKT', label: 'SKT' },
  { value: 'KT', label: 'KT' },
  { value: 'LGU', label: 'LG U+' },
  { value: 'SKT_MVNO', label: 'SKT 알뜰폰' },
  { value: 'KT_MVNO', label: 'KT 알뜰폰' },
  { value: 'LGU_MVNO', label: 'LG U+ 알뜰폰' },
];

export function IdentityVerificationModal({ isOpen, onClose, onSuccess }: IdentityVerificationModalProps) {
  const [step, setStep] = useState<VerificationStep>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [carrier, setCarrier] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, '').slice(0, 6);
    setBirthDate(numbers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone || !birthDate || !gender || !carrier) {
      toast.error('모든 필드를 입력해주세요');
      return;
    }

    setStep('verifying');

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('로그인이 필요합니다');
      }

      const response = await supabase.functions.invoke('verify-identity', {
        body: {
          name,
          phone: phone.replace(/-/g, ''),
          birthDate,
          gender,
          carrier,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || '인증에 실패했습니다');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
        resetForm();
      }, 2000);

    } catch (error) {
      console.error('Verification error:', error);
      setErrorMessage(error instanceof Error ? error.message : '인증에 실패했습니다');
      setStep('error');
    }
  };

  const resetForm = () => {
    setStep('form');
    setName('');
    setPhone('');
    setBirthDate('');
    setGender('');
    setCarrier('');
    setErrorMessage('');
  };

  const handleClose = () => {
    if (step !== 'verifying') {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleClose}
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
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">본인 인증</h2>
            </div>
            {step !== 'verifying' && (
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === 'form' && (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                  onSubmit={handleSubmit}
                >
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      ⚠️ 데모 모드: 실제 본인인증 없이 테스트됩니다
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">이름</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="실명을 입력하세요"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">휴대폰 번호</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="010-0000-0000"
                        value={phone}
                        onChange={handlePhoneChange}
                        className="pl-10"
                        required
                        maxLength={13}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">생년월일</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="YYMMDD"
                          value={birthDate}
                          onChange={handleBirthDateChange}
                          className="pl-10"
                          required
                          maxLength={6}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">성별</label>
                      <Select value={gender} onValueChange={(v) => setGender(v as 'male' | 'female')}>
                        <SelectTrigger>
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">남성</SelectItem>
                          <SelectItem value="female">여성</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">통신사</label>
                    <Select value={carrier} onValueChange={setCarrier}>
                      <SelectTrigger>
                        <SelectValue placeholder="통신사 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {carriers.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full h-12 mt-4">
                    본인 인증하기
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    입력하신 정보는 본인 확인 용도로만 사용됩니다
                  </p>
                </motion.form>
              )}

              {step === 'verifying' && (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-12 flex flex-col items-center gap-4"
                >
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="text-lg font-medium">인증 중...</p>
                  <p className="text-sm text-muted-foreground">잠시만 기다려주세요</p>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-12 flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <p className="text-lg font-bold text-green-600">인증 완료!</p>
                  <p className="text-sm text-muted-foreground">본인 인증이 성공적으로 완료되었습니다</p>
                </motion.div>
              )}

              {step === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-8 flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                  </div>
                  <p className="text-lg font-bold text-destructive">인증 실패</p>
                  <p className="text-sm text-muted-foreground text-center">{errorMessage}</p>
                  <Button 
                    onClick={() => setStep('form')} 
                    variant="outline"
                    className="mt-2"
                  >
                    다시 시도
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
