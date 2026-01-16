import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, ChevronRight, Trash2, Clock, X } from 'lucide-react';
import { usePolicyMatchResults, useDeletePolicyMatchResult, type PolicyMatchResult } from '@/hooks/usePolicyMatchResults';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';

interface PolicyMatchHistoryProps {
  onViewResult?: (result: PolicyMatchResult) => void;
}

export function PolicyMatchHistory({ onViewResult }: PolicyMatchHistoryProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { data: results, isLoading } = usePolicyMatchResults();
  const deleteResult = useDeletePolicyMatchResult();

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 shadow-app-md"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">정책 매칭 결과</p>
            <p className="text-xs text-muted-foreground">로그인하면 이전 결과를 저장할 수 있어요</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/policy-match')}
          className="w-full py-3 bg-primary/10 text-primary rounded-xl font-medium text-sm"
        >
          정책 매칭 시작하기
        </button>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 shadow-app-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">정책 매칭 결과</p>
            <p className="text-xs text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('이 결과를 삭제하시겠습니까?')) return;
    
    try {
      await deleteResult.mutateAsync(id);
      toast.success('결과가 삭제되었습니다');
    } catch {
      toast.error('삭제에 실패했습니다');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl shadow-app-md overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">정책 매칭 결과</p>
            <p className="text-xs text-muted-foreground">
              {results && results.length > 0 
                ? `총 ${results.length}개의 결과` 
                : '아직 결과가 없어요'}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/policy-match')}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          새로 시작
        </button>
      </div>

      {/* Results List */}
      {results && results.length > 0 ? (
        <div className="divide-y divide-border">
          {results.slice(0, 5).map((result) => (
            <motion.button
              key={result.id}
              onClick={() => onViewResult?.(result)}
              className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
              whileHover={{ x: 4 }}
            >
              {/* Match Score Circle */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ 
                  background: `conic-gradient(hsl(var(--primary)) ${result.top_match_score}%, hsl(var(--muted)) ${result.top_match_score}%)`
                }}
              >
                <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center">
                  <span className="text-primary font-bold text-xs">{result.top_match_score}%</span>
                </div>
              </div>

              {/* Result Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {result.top_match_candidate_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock size={12} />
                  <span>{format(new Date(result.created_at), 'M월 d일 HH:mm', { locale: ko })}</span>
                  <span>·</span>
                  <span>{result.region_name}</span>
                </div>
                {result.preferred_candidate_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    선호 후보: {result.preferred_candidate_name}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => handleDelete(result.id, e)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={20} className="text-muted-foreground" />
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-muted-foreground text-sm mb-3">
            정책 매칭 게임을 해보세요!
          </p>
          <button
            onClick={() => navigate('/policy-match')}
            className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium"
          >
            시작하기
          </button>
        </div>
      )}
    </motion.div>
  );
}

// 결과 상세 보기 모달
interface PolicyMatchResultModalProps {
  result: PolicyMatchResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PolicyMatchResultModal({ result, isOpen, onClose }: PolicyMatchResultModalProps) {
  if (!result) return null;

  const topResults = result.results_json.slice(0, 3);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-lg">정책 매칭 결과</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Date & Region */}
              <div className="text-center text-sm text-muted-foreground">
                <p>{format(new Date(result.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}</p>
                <p>{result.region_name} · {result.total_questions}개 질문</p>
              </div>

              {/* Top Match */}
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">최고 일치 후보</p>
                <p className="text-2xl font-bold text-primary mb-1">
                  {result.top_match_candidate_name}
                </p>
                <p className="text-4xl font-bold text-foreground">
                  {result.top_match_score}%
                </p>
              </div>

              {/* Preferred vs Match */}
              {result.preferred_candidate_name && (
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-2">선호 후보</p>
                  <p className="font-medium">{result.preferred_candidate_name}</p>
                  {result.preferred_candidate_name !== result.top_match_candidate_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      정책적으로는 {result.top_match_candidate_name} 후보와 더 일치해요
                    </p>
                  )}
                </div>
              )}

              {/* Other Results */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">전체 결과</p>
                {topResults.map((r, index) => (
                  <div 
                    key={r.candidateId}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: r.partyColor }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{r.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{r.party}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{r.matchScore}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
