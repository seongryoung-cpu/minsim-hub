import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Link as LinkIcon, Loader2, CheckCircle, XCircle, UserPlus, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useCreateCandidate } from '@/hooks/useCandidates';
import { PARTY_COLORS } from '@/types/election';

interface ExtractedCandidate {
  name: string;
  party: string;
  region_name: string;
  position: string;
  age?: number;
  education?: string;
  slogan?: string;
  careers?: { period: string; title: string; organization: string }[];
  pledges?: { title: string; description: string; category: string }[];
  selected?: boolean;
}

const REGIONS = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
  '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원특별자치도',
  '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
];

export default function AdminCandidateImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const createCandidate = useCreateCandidate();

  const [url, setUrl] = useState('');
  const [regionName, setRegionName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedCandidates, setExtractedCandidates] = useState<ExtractedCandidate[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleExtract = async () => {
    if (!url) {
      toast({ title: 'URL을 입력해주세요', variant: 'destructive' });
      return;
    }

    setIsExtracting(true);
    setExtractedCandidates([]);

    try {
      const { data, error } = await supabase.functions.invoke('extract-candidates', {
        body: { url, region_name: regionName }
      });

      if (error) throw error;

      if (data.success && data.candidates?.length > 0) {
        setExtractedCandidates(data.candidates.map((c: ExtractedCandidate) => ({ ...c, selected: true })));
        toast({
          title: '후보자 추출 완료',
          description: `${data.candidates.length}명의 후보자 정보를 추출했습니다.`
        });
      } else {
        toast({
          title: '후보자를 찾을 수 없습니다',
          description: data.error || '다른 URL을 시도해보세요.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: '추출 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive'
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const toggleCandidate = (index: number) => {
    setExtractedCandidates(prev => 
      prev.map((c, i) => i === index ? { ...c, selected: !c.selected } : c)
    );
  };

  const toggleAll = (selected: boolean) => {
    setExtractedCandidates(prev => prev.map(c => ({ ...c, selected })));
  };

  const generateSlug = (name: string, party: string, region: string) => {
    const cleanName = name.replace(/\s+/g, '-').toLowerCase();
    const cleanParty = party.replace(/\s+/g, '-').slice(0, 4).toLowerCase();
    const cleanRegion = region.replace(/\s+/g, '').slice(0, 4).toLowerCase();
    return `${cleanRegion}-${cleanParty}-${cleanName}-${Date.now().toString(36)}`;
  };

  const handleSaveSelected = async () => {
    const selectedCandidates = extractedCandidates.filter(c => c.selected);
    if (selectedCandidates.length === 0) {
      toast({ title: '저장할 후보자를 선택해주세요', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      let savedCount = 0;

      for (const candidate of selectedCandidates) {
        const slug = generateSlug(candidate.name, candidate.party, candidate.region_name);
        const partyColor = PARTY_COLORS[candidate.party] || '#808080';

        // Create candidate
        const { data: newCandidate, error: candidateError } = await supabase
          .from('candidates')
          .insert({
            slug,
            name: candidate.name,
            party: candidate.party,
            party_color: partyColor,
            region_type: 'metropolitan',
            region_name: candidate.region_name || regionName || '미정',
            position: candidate.position || '예비후보',
            summary: candidate.slogan || `${candidate.party} ${candidate.position || '예비후보'}`,
            age: candidate.age || null,
            education: candidate.education || null,
            slogan: candidate.slogan || null,
            is_active: true,
            sort_order: savedCount
          })
          .select()
          .single();

        if (candidateError) {
          console.error('Failed to save candidate:', candidate.name, candidateError);
          continue;
        }

        // Save careers if any
        if (candidate.careers && candidate.careers.length > 0) {
          const careers = candidate.careers.map((c, idx) => ({
            candidate_id: newCandidate.id,
            period: c.period,
            title: c.title,
            organization: c.organization,
            sort_order: idx
          }));

          await supabase.from('candidate_careers').insert(careers);
        }

        // Save pledges if any
        if (candidate.pledges && candidate.pledges.length > 0) {
          const pledges = candidate.pledges.map((p, idx) => ({
            candidate_id: newCandidate.id,
            title: p.title,
            description: p.description,
            category: p.category,
            sort_order: idx
          }));

          await supabase.from('candidate_pledges').insert(pledges);
        }

        savedCount++;
      }

      toast({
        title: '저장 완료',
        description: `${savedCount}명의 후보자가 등록되었습니다.`
      });

      // Clear form
      setExtractedCandidates([]);
      setUrl('');
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: '저장 실패',
        description: '일부 후보자 저장에 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">접근 권한이 없습니다</h2>
            <p className="text-muted-foreground mb-4">관리자만 접근할 수 있습니다.</p>
            <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedCount = extractedCandidates.filter(c => c.selected).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/content')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">AI 후보자 추출</h1>
            <p className="text-sm text-muted-foreground">중앙선거관리위원회 URL에서 자동 추출</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* URL Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              웹페이지에서 후보자 추출
            </CardTitle>
            <CardDescription>
              중앙선거관리위원회 또는 후보자 정보가 있는 페이지 URL을 입력하세요.
              AI가 자동으로 후보자 정보를 추출합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://www.nec.go.kr/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">기본 지역 (선택)</label>
                <Select value={regionName} onValueChange={setRegionName}>
                  <SelectTrigger>
                    <SelectValue placeholder="지역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleExtract} 
                disabled={isExtracting || !url}
                className="min-w-[120px]"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    추출 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI 추출
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="text-muted-foreground">
                <p className="font-medium">추천 URL 예시:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>중앙선거관리위원회 선거통계시스템</li>
                  <li>후보자 공식 홈페이지</li>
                  <li>정당 공식 홈페이지 후보자 소개 페이지</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extracted Candidates */}
        <AnimatePresence>
          {extractedCandidates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      추출된 후보자 ({extractedCandidates.length}명)
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
                        전체 선택
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
                        전체 해제
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {extractedCandidates.map((candidate, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                        candidate.selected ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={candidate.selected}
                        onCheckedChange={() => toggleCandidate(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-lg">{candidate.name}</span>
                          <Badge 
                            style={{ 
                              backgroundColor: PARTY_COLORS[candidate.party] || '#808080',
                              color: 'white'
                            }}
                          >
                            {candidate.party}
                          </Badge>
                          {candidate.region_name && (
                            <Badge variant="outline">{candidate.region_name}</Badge>
                          )}
                        </div>
                        {candidate.position && (
                          <p className="text-sm text-muted-foreground mt-1">{candidate.position}</p>
                        )}
                        {candidate.slogan && (
                          <p className="text-sm mt-2 italic">"{candidate.slogan}"</p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          {candidate.age && <span>나이: {candidate.age}세</span>}
                          {candidate.education && <span>학력: {candidate.education}</span>}
                          {candidate.careers && candidate.careers.length > 0 && (
                            <span>경력: {candidate.careers.length}건</span>
                          )}
                          {candidate.pledges && candidate.pledges.length > 0 && (
                            <span>공약: {candidate.pledges.length}건</span>
                          )}
                        </div>
                      </div>
                      {candidate.selected && (
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
                <div className="max-w-4xl mx-auto">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleSaveSelected}
                    disabled={isSaving || selectedCount === 0}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        선택한 {selectedCount}명 저장
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
