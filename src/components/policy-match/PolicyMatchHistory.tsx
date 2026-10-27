import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Trash2, X } from 'lucide-react';
import { ListPanel, SectionHeader } from '@/components/ds';
import { usePolicyMatchResults, useDeletePolicyMatchResult, type PolicyMatchResult } from '@/hooks/usePolicyMatchResults';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';

interface PolicyMatchHistoryProps {
  onViewResult?: (result: PolicyMatchResult) => void;
}

/** 마이 '정책 매칭 기록' — 저장된 결과가 있을 때만 보인다 (시작은 '테스트와 퀴즈'에서) */
export function PolicyMatchHistory({ onViewResult }: PolicyMatchHistoryProps) {
  const { isAuthenticated } = useAuthContext();
  const { data: results } = usePolicyMatchResults();
  const deleteResult = useDeletePolicyMatchResult();

  if (!isAuthenticated || !results || results.length === 0) return null;

  const handleDelete = async (id: string) => {
    if (!confirm('이 결과를 지울까요?')) return;
    try {
      await deleteResult.mutateAsync(id);
      toast.success('결과를 지웠어요');
    } catch {
      toast.error('지우지 못했어요. 잠시 뒤 다시 해 주세요.');
    }
  };

  return (
    <section aria-labelledby="match-history-title" className="space-y-2.5">
      <SectionHeader id="match-history-title" title="정책 매칭 기록" sub={`최근 ${Math.min(results.length, 5)}개`} />
      <ListPanel>
        {results.slice(0, 5).map((result) => (
          <div key={result.id} className="flex items-center gap-1 pr-2">
            <button
              type="button"
              onClick={() => onViewResult?.(result)}
              className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary/50"
            >
              <span className="w-12 shrink-0 text-[17px] font-extrabold text-primary">{result.top_match_score}%</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{result.top_match_candidate_name}</span>
                <span className="block truncate text-[13px] text-muted-foreground">
                  {format(new Date(result.created_at), 'M월 d일', { locale: ko })} · {result.region_name}
                  {result.preferred_candidate_name ? ` · 선호 ${result.preferred_candidate_name}` : ''}
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => void handleDelete(result.id)}
              aria-label={`${result.top_match_candidate_name} 결과 지우기`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </ListPanel>
    </section>
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
