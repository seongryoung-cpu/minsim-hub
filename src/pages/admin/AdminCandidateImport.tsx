import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Link as LinkIcon, Loader2, CheckCircle, XCircle, UserPlus, Sparkles, AlertCircle, Edit, Trash2, Plus, ChevronDown, ChevronUp, ImageIcon, Search, Images, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { PARTY_COLORS } from '@/types/election';
import { SIDO_LIST } from '@/types/region';

interface Career {
  period: string;
  title: string;
  organization: string;
}

interface Pledge {
  title: string;
  description: string;
  category: string;
}

interface ImageOption {
  url: string;
  source: string;
  source_url?: string;
}

interface ExtractedCandidate {
  name: string;
  party: string;
  region_name: string;
  position: string;
  age?: number;
  education?: string;
  slogan?: string;
  careers?: Career[];
  pledges?: Pledge[];
  selected?: boolean;
  image_url?: string;
  image_loading?: boolean;
  image_options?: ImageOption[];
  showImagePicker?: boolean;
}

const REGIONS: readonly string[] = SIDO_LIST;

const PARTIES = [
  '더불어민주당', '국민의힘', '조국혁신당', '개혁신당', '진보당', '기본소득당', '사회민주당', '무소속'
];

const PLEDGE_CATEGORIES = ['경제', '복지', '교육', '환경', '교통', '주거', '안전', '행정', '문화', '기타'];

export default function AdminCandidateImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  const [url, setUrl] = useState('');
  const [regionName, setRegionName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedCandidates, setExtractedCandidates] = useState<ExtractedCandidate[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [fetchingAllInfo, setFetchingAllInfo] = useState(false);

  // Fetch full info (image + careers + bio) for a single candidate from Namuwiki
  const fetchCandidateInfo = async (index: number) => {
    const candidate = extractedCandidates[index];
    if (!candidate.name) return;

    // Set loading state
    updateCandidate(index, { image_loading: true });

    try {
      const { data, error } = await supabase.functions.invoke('fetch-candidate-info', {
        body: { name: candidate.name, party: candidate.party }
      });

      if (error) throw error;

      if (data.success) {
        const updates: Partial<ExtractedCandidate> = { image_loading: false };
        
        if (data.image_url) {
          updates.image_url = data.image_url;
        }
        if (data.image_options && data.image_options.length > 0) {
          updates.image_options = data.image_options;
          // Show image picker if multiple options available
          if (data.image_options.length > 1) {
            updates.showImagePicker = true;
          }
        }
        if (data.age) {
          updates.age = data.age;
        }
        if (data.education) {
          updates.education = data.education;
        }
        if (data.careers && data.careers.length > 0) {
          updates.careers = data.careers;
        }
        
        updateCandidate(index, updates);
        
        const foundItems = [];
        if (data.image_options?.length) foundItems.push(`사진 ${data.image_options.length}개`);
        if (data.careers?.length) foundItems.push(`경력 ${data.careers.length}건`);
        if (data.education) foundItems.push('학력');
        
        toast({
          title: '정보 검색 완료',
          description: foundItems.length > 0 
            ? `${candidate.name}님: ${foundItems.join(', ')} 발견`
            : '추가 정보를 찾을 수 없습니다.'
        });
      } else {
        updateCandidate(index, { image_loading: false });
        toast({
          title: '정보를 찾을 수 없음',
          description: data.error || '나무위키에서 정보를 찾을 수 없습니다.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Info fetch error:', error);
      updateCandidate(index, { image_loading: false });
      toast({
        title: '정보 검색 실패',
        description: '정보 검색 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    }
  };

  // Fetch info for all selected candidates
  const fetchAllCandidateInfo = async () => {
    const selectedIndices = extractedCandidates
      .map((c, i) => c.selected ? i : -1)
      .filter(i => i !== -1);

    if (selectedIndices.length === 0) {
      toast({
        title: '선택된 후보자가 없습니다',
        variant: 'destructive'
      });
      return;
    }

    setFetchingAllInfo(true);
    let successCount = 0;
    let failCount = 0;

    for (const index of selectedIndices) {
      const candidate = extractedCandidates[index];
      updateCandidate(index, { image_loading: true });

      try {
        const { data, error } = await supabase.functions.invoke('fetch-candidate-info', {
          body: { name: candidate.name, party: candidate.party }
        });

        if (!error && data.success) {
          const updates: Partial<ExtractedCandidate> = { image_loading: false };
          
          if (data.image_url) updates.image_url = data.image_url;
          if (data.age) updates.age = data.age;
          if (data.education) updates.education = data.education;
          if (data.careers && data.careers.length > 0) {
            updates.careers = data.careers;
          }
          
          updateCandidate(index, updates);
          successCount++;
        } else {
          updateCandidate(index, { image_loading: false });
          failCount++;
        }
      } catch {
        updateCandidate(index, { image_loading: false });
        failCount++;
      }

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    setFetchingAllInfo(false);
    toast({
      title: '나무위키 정보 일괄 검색 완료',
      description: `성공: ${successCount}명, 실패: ${failCount}명`
    });
  };

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

  const updateCandidate = (index: number, updates: Partial<ExtractedCandidate>) => {
    setExtractedCandidates(prev => 
      prev.map((c, i) => i === index ? { ...c, ...updates } : c)
    );
  };

  const deleteCandidate = (index: number) => {
    setExtractedCandidates(prev => prev.filter((_, i) => i !== index));
  };

  const addCareer = (index: number) => {
    const candidate = extractedCandidates[index];
    const newCareers = [...(candidate.careers || []), { period: '', title: '', organization: '' }];
    updateCandidate(index, { careers: newCareers });
  };

  const updateCareer = (candidateIndex: number, careerIndex: number, updates: Partial<Career>) => {
    const candidate = extractedCandidates[candidateIndex];
    const newCareers = candidate.careers?.map((c, i) => i === careerIndex ? { ...c, ...updates } : c);
    updateCandidate(candidateIndex, { careers: newCareers });
  };

  const deleteCareer = (candidateIndex: number, careerIndex: number) => {
    const candidate = extractedCandidates[candidateIndex];
    const newCareers = candidate.careers?.filter((_, i) => i !== careerIndex);
    updateCandidate(candidateIndex, { careers: newCareers });
  };

  const addPledge = (index: number) => {
    const candidate = extractedCandidates[index];
    const newPledges = [...(candidate.pledges || []), { title: '', description: '', category: '기타' }];
    updateCandidate(index, { pledges: newPledges });
  };

  const updatePledge = (candidateIndex: number, pledgeIndex: number, updates: Partial<Pledge>) => {
    const candidate = extractedCandidates[candidateIndex];
    const newPledges = candidate.pledges?.map((p, i) => i === pledgeIndex ? { ...p, ...updates } : p);
    updateCandidate(candidateIndex, { pledges: newPledges });
  };

  const deletePledge = (candidateIndex: number, pledgeIndex: number) => {
    const candidate = extractedCandidates[candidateIndex];
    const newPledges = candidate.pledges?.filter((_, i) => i !== pledgeIndex);
    updateCandidate(candidateIndex, { pledges: newPledges });
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
            image_url: candidate.image_url || null,
            is_active: true,
            sort_order: savedCount
          })
          .select()
          .single();

        if (candidateError) {
          console.error('Failed to save candidate:', candidate.name, candidateError);
          continue;
        }

        if (candidate.careers && candidate.careers.length > 0) {
          const careers = candidate.careers
            .filter(c => c.period || c.title || c.organization)
            .map((c, idx) => ({
              candidate_id: newCandidate.id,
              period: c.period,
              title: c.title,
              organization: c.organization,
              sort_order: idx
            }));

          if (careers.length > 0) {
            await supabase.from('candidate_careers').insert(careers);
          }
        }

        if (candidate.pledges && candidate.pledges.length > 0) {
          const pledges = candidate.pledges
            .filter(p => p.title)
            .map((p, idx) => ({
              candidate_id: newCandidate.id,
              title: p.title,
              description: p.description,
              category: p.category,
              sort_order: idx
            }));

          if (pledges.length > 0) {
            await supabase.from('candidate_pledges').insert(pledges);
          }
        }

        savedCount++;
      }

      toast({
        title: '저장 완료',
        description: `${savedCount}명의 후보자가 등록되었습니다.`
      });

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
  const editingCandidate = editingIndex !== null ? extractedCandidates[editingIndex] : null;

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
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchAllCandidateInfo}
                        disabled={fetchingAllInfo}
                      >
                        {fetchingAllInfo ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4 mr-1" />
                        )}
                        나무위키 정보 검색
                      </Button>
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
                    <Collapsible
                      key={index}
                      open={expandedIndex === index}
                      onOpenChange={(open) => setExpandedIndex(open ? index : null)}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`rounded-lg border transition-colors ${
                          candidate.selected ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                        }`}
                      >
                        {/* Candidate Header */}
                        <div className="flex items-start gap-3 p-4">
                          <Checkbox
                            checked={candidate.selected}
                            onCheckedChange={() => toggleCandidate(index)}
                            className="mt-1"
                          />
                          
                          {/* Candidate Image */}
                          <div className="flex-shrink-0 relative group">
                            {candidate.image_url ? (
                              <div className="relative">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                                  <img
                                    src={candidate.image_url}
                                    alt={candidate.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                                    }}
                                  />
                                  {/* Re-search overlay */}
                                  <button
                                    onClick={() => fetchCandidateInfo(index)}
                                    disabled={candidate.image_loading}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center disabled:cursor-not-allowed"
                                  >
                                    {candidate.image_loading ? (
                                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                                    ) : (
                                      <>
                                        <Search className="h-4 w-4 text-white" />
                                        <span className="text-[9px] text-white mt-0.5">재검색</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                {/* Show image picker button if options available */}
                                {candidate.image_options && candidate.image_options.length > 1 && (
                                  <button
                                    onClick={() => updateCandidate(index, { showImagePicker: !candidate.showImagePicker })}
                                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-md"
                                  >
                                    {candidate.image_options.length}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => fetchCandidateInfo(index)}
                                disabled={candidate.image_loading}
                                className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center hover:border-primary hover:bg-muted/50 transition-colors disabled:opacity-50"
                              >
                                {candidate.image_loading ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground mt-1">정보검색</span>
                                  </>
                                )}
                              </button>
                            )}
                            
                            {/* Image Picker Dropdown */}
                            {candidate.showImagePicker && candidate.image_options && candidate.image_options.length > 0 && (
                              <div className="absolute top-0 left-20 z-20 bg-card border rounded-lg shadow-lg p-2 w-64">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium">사진 선택 ({candidate.image_options.length}개)</span>
                                  <button 
                                    onClick={() => updateCandidate(index, { showImagePicker: false })}
                                    className="p-1 hover:bg-muted rounded"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                                  {candidate.image_options.map((option, imgIdx) => (
                                    <button
                                      key={imgIdx}
                                      onClick={() => {
                                        updateCandidate(index, { 
                                          image_url: option.url, 
                                          showImagePicker: false 
                                        });
                                      }}
                                      className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                                        candidate.image_url === option.url 
                                          ? 'border-primary ring-2 ring-primary/30' 
                                          : 'border-transparent hover:border-muted-foreground/50'
                                      }`}
                                    >
                                      <img
                                        src={option.url}
                                        alt={`옵션 ${imgIdx + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                                        }}
                                      />
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                                        <span className="text-[8px] text-white truncate block">{option.source}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
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
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingIndex(index)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteCandidate(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon">
                                {expandedIndex === index ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>

                        {/* Expanded Content - Careers & Pledges */}
                        <CollapsibleContent>
                          <div className="px-4 pb-4 pt-0 space-y-4 border-t">
                            {/* Careers Section */}
                            <div className="pt-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">경력 ({candidate.careers?.length || 0})</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addCareer(index)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  추가
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {candidate.careers?.map((career, ci) => (
                                  <div key={ci} className="flex gap-2 items-start">
                                    <Input
                                      placeholder="기간"
                                      value={career.period}
                                      onChange={(e) => updateCareer(index, ci, { period: e.target.value })}
                                      className="flex-1 h-8 text-sm"
                                    />
                                    <Input
                                      placeholder="직책"
                                      value={career.title}
                                      onChange={(e) => updateCareer(index, ci, { title: e.target.value })}
                                      className="flex-1 h-8 text-sm"
                                    />
                                    <Input
                                      placeholder="소속"
                                      value={career.organization}
                                      onChange={(e) => updateCareer(index, ci, { organization: e.target.value })}
                                      className="flex-1 h-8 text-sm"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => deleteCareer(index, ci)}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Pledges Section */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">공약 ({candidate.pledges?.length || 0})</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addPledge(index)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  추가
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {candidate.pledges?.map((pledge, pi) => (
                                  <div key={pi} className="flex gap-2 items-start">
                                    <Input
                                      placeholder="공약명"
                                      value={pledge.title}
                                      onChange={(e) => updatePledge(index, pi, { title: e.target.value })}
                                      className="flex-1 h-8 text-sm"
                                    />
                                    <Select
                                      value={pledge.category}
                                      onValueChange={(value) => updatePledge(index, pi, { category: value })}
                                    >
                                      <SelectTrigger className="w-24 h-8 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {PLEDGE_CATEGORIES.map(cat => (
                                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => deletePledge(index, pi)}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </motion.div>
                    </Collapsible>
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

      {/* Edit Candidate Dialog */}
      <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && setEditingIndex(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>후보자 정보 수정</DialogTitle>
          </DialogHeader>
          {editingCandidate && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">이름 *</label>
                <Input
                  value={editingCandidate.name}
                  onChange={(e) => updateCandidate(editingIndex!, { name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">정당 *</label>
                <Select
                  value={editingCandidate.party}
                  onValueChange={(value) => updateCandidate(editingIndex!, { party: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTIES.map(party => (
                      <SelectItem key={party} value={party}>{party}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">지역</label>
                <Select
                  value={editingCandidate.region_name}
                  onValueChange={(value) => updateCandidate(editingIndex!, { region_name: value })}
                >
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
              <div>
                <label className="text-sm font-medium mb-1 block">직위</label>
                <Input
                  value={editingCandidate.position || ''}
                  onChange={(e) => updateCandidate(editingIndex!, { position: e.target.value })}
                  placeholder="예: 서울시장 예비후보"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">나이</label>
                  <Input
                    type="number"
                    value={editingCandidate.age || ''}
                    onChange={(e) => updateCandidate(editingIndex!, { age: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">학력</label>
                  <Input
                    value={editingCandidate.education || ''}
                    onChange={(e) => updateCandidate(editingIndex!, { education: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">슬로건</label>
                <Textarea
                  value={editingCandidate.slogan || ''}
                  onChange={(e) => updateCandidate(editingIndex!, { slogan: e.target.value })}
                  placeholder="선거 슬로건"
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingIndex(null)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
