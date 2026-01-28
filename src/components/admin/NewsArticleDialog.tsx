import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useAllCandidatesAdmin, type DBCandidate } from '@/hooks/useCandidates';

export interface NewsArticleFormData {
  title: string;
  summary: string;
  source: string;
  category: string;
  candidate_id: string | null;
  published_at: string;
  article_url: string | null;
  image_url: string | null;
}

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  candidate_id: string | null;
  published_at: string;
  article_url: string | null;
  image_url: string | null;
}

interface NewsArticleDialogProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewsArticleFormData) => void;
  isSaving?: boolean;
}

const CATEGORIES = [
  { value: 'policy', label: '정책' },
  { value: 'campaign', label: '캠페인' },
  { value: 'interview', label: '인터뷰' },
  { value: 'general', label: '일반' },
];

export function NewsArticleDialog({ article, isOpen, onClose, onSave, isSaving }: NewsArticleDialogProps) {
  const { data: candidates } = useAllCandidatesAdmin();
  const [form, setForm] = useState<NewsArticleFormData>({
    title: '',
    summary: '',
    source: '',
    category: 'general',
    candidate_id: null,
    published_at: new Date().toISOString(),
    article_url: null,
    image_url: null,
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (article) {
      setForm({
        title: article.title,
        summary: article.summary,
        source: article.source,
        category: article.category,
        candidate_id: article.candidate_id,
        published_at: article.published_at,
        article_url: article.article_url,
        image_url: article.image_url,
      });
      setSelectedDate(new Date(article.published_at));
    } else {
      setForm({
        title: '',
        summary: '',
        source: '',
        category: 'general',
        candidate_id: null,
        published_at: new Date().toISOString(),
        article_url: null,
        image_url: null,
      });
      setSelectedDate(new Date());
    }
  }, [article, isOpen]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setForm(f => ({ ...f, published_at: date.toISOString() }));
    }
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.summary.trim() || !form.source.trim()) {
      return;
    }
    onSave(form);
  };

  const isValid = form.title.trim() && form.summary.trim() && form.source.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{article ? '뉴스 수정' : '뉴스 추가'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              placeholder="뉴스 제목"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          {/* 요약 */}
          <div className="space-y-2">
            <Label htmlFor="summary">요약 *</Label>
            <Textarea
              id="summary"
              placeholder="뉴스 요약"
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              rows={3}
            />
          </div>

          {/* 출처 */}
          <div className="space-y-2">
            <Label htmlFor="source">출처 *</Label>
            <Input
              id="source"
              placeholder="예: 연합뉴스"
              value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <Label>카테고리</Label>
            <Select
              value={form.category}
              onValueChange={value => setForm(f => ({ ...f, category: value }))}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 후보자 연결 */}
          <div className="space-y-2">
            <Label>후보자 연결</Label>
            <Select
              value={form.candidate_id || 'none'}
              onValueChange={value => setForm(f => ({ ...f, candidate_id: value === 'none' ? null : value }))}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="후보자 선택" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="none">없음</SelectItem>
                {candidates?.map(candidate => (
                  <SelectItem key={candidate.id} value={candidate.slug}>
                    {candidate.name} ({candidate.party})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 발행일 */}
          <div className="space-y-2">
            <Label>발행일</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP', { locale: ko }) : '날짜 선택'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 기사 URL */}
          <div className="space-y-2">
            <Label htmlFor="article_url">기사 URL</Label>
            <Input
              id="article_url"
              placeholder="https://..."
              value={form.article_url || ''}
              onChange={e => setForm(f => ({ ...f, article_url: e.target.value || null }))}
            />
          </div>

          {/* 이미지 URL */}
          <div className="space-y-2">
            <Label htmlFor="image_url">이미지 URL</Label>
            <Input
              id="image_url"
              placeholder="https://..."
              value={form.image_url || ''}
              onChange={e => setForm(f => ({ ...f, image_url: e.target.value || null }))}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
