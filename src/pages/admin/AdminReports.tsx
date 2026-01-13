import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Report {
  id: string;
  user_id: string | null;
  type: 'report' | 'inquiry' | 'feedback';
  category: string | null;
  title: string;
  content: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
}

const statusConfig = {
  pending: { label: '대기 중', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
  in_progress: { label: '처리 중', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: AlertCircle },
  resolved: { label: '완료', color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle },
  rejected: { label: '반려', color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
};

const typeLabels = {
  report: '신고',
  inquiry: '문의',
  feedback: '피드백',
};

export function AdminReports() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [response, setResponse] = useState('');
  const [filterStatus, setFilterStatus] = useState<Report['status'] | 'all'>('all');

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    const fetchReports = async () => {
      if (!isAdmin) return;

      try {
        let query = supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (filterStatus !== 'all') {
          query = query.eq('status', filterStatus);
        }

        const { data, error } = await query;
        if (error) throw error;
        setReports((data as Report[]) || []);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      }
      
      setIsLoading(false);
    };

    fetchReports();
  }, [isAdmin, filterStatus]);

  const handleUpdateStatus = async (reportId: string, newStatus: Report['status']) => {
    try {
      const updates: Partial<Report> = {
        status: newStatus,
      };

      if (response && (newStatus === 'resolved' || newStatus === 'rejected')) {
        updates.admin_response = response;
        updates.responded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, ...updates } : r
      ));
      setSelectedReport(null);
      setResponse('');
      toast.success('상태가 업데이트되었습니다');
    } catch (error) {
      console.error('Failed to update report:', error);
      toast.error('업데이트에 실패했습니다');
    }
  };

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const filterOptions: { value: Report['status'] | 'all'; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: '대기 중' },
    { value: 'in_progress', label: '처리 중' },
    { value: 'resolved', label: '완료' },
    { value: 'rejected', label: '반려' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="h-14 flex items-center px-4 gap-3">
          <button onClick={() => navigate('/admin')} className="p-1 rounded-lg hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <MessageSquare size={22} className="text-primary" />
          <h1 className="font-semibold text-lg">신고/문의 관리</h1>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-20">
        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={filterStatus === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(option.value)}
              className="whitespace-nowrap"
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            총 {reports.length}건
          </p>

          {reports.map((report, index) => {
            const status = statusConfig[report.status];
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl p-4 shadow-app-md"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded-full">
                      {typeLabels[report.type]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                      <StatusIcon size={12} className="inline mr-1" />
                      {status.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <h3 className="font-medium mb-1">{report.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {report.content}
                </p>

                {report.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedReport(report)}
                    >
                      답변하기
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleUpdateStatus(report.id, 'in_progress')}
                    >
                      처리 시작
                    </Button>
                  </div>
                )}

                {report.admin_response && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">관리자 답변:</p>
                    <p className="text-sm">{report.admin_response}</p>
                  </div>
                )}
              </motion.div>
            );
          })}

          {reports.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">접수된 신고/문의가 없습니다</p>
            </div>
          )}
        </div>
      </main>

      {/* Response Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-card rounded-t-2xl w-full max-w-lg p-6"
          >
            <h3 className="font-semibold text-lg mb-2">{selectedReport.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{selectedReport.content}</p>

            <Textarea
              placeholder="답변을 입력하세요"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              className="mb-4"
            />

            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
              >
                완료 처리
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleUpdateStatus(selectedReport.id, 'rejected')}
              >
                반려
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setSelectedReport(null);
                  setResponse('');
                }}
              >
                취소
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
