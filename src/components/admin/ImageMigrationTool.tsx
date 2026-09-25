import { useState, useEffect } from 'react';
import { Loader2, ImageIcon, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Candidate {
  id: string;
  name: string;
  party: string;
  image_url: string | null;
}

interface MigrationResult {
  candidateId: string;
  candidateName: string;
  success: boolean;
  newUrl?: string;
  error?: string;
}

export function ImageMigrationTool() {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [currentCandidate, setCurrentCandidate] = useState<string | null>(null);

  // Count candidates with external images
  const externalImageCandidates = candidates.filter(c => 
    c.image_url && !c.image_url.includes('supabase.co') && !c.image_url.includes('lovable.dev')
  );
  const storageImageCandidates = candidates.filter(c => 
    c.image_url && (c.image_url.includes('supabase.co') || c.image_url.includes('lovable.dev'))
  );
  const noImageCandidates = candidates.filter(c => !c.image_url);

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('id, name, party, image_url')
        .order('name');

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
      toast({
        title: '후보자 목록 로딩 실패',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const migrateImage = async (candidate: Candidate): Promise<MigrationResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('proxy-image', {
        body: {
          image_url: candidate.image_url,
          candidate_id: candidate.id,
          candidate_name: candidate.name
        }
      });

      if (error) throw error;

      if (data.success && data.storage_url) {
        return {
          candidateId: candidate.id,
          candidateName: candidate.name,
          success: true,
          newUrl: data.storage_url
        };
      } else {
        return {
          candidateId: candidate.id,
          candidateName: candidate.name,
          success: false,
          error: data.error || '알 수 없는 오류'
        };
      }
    } catch (error) {
      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  };

  const handleMigrateAll = async () => {
    if (externalImageCandidates.length === 0) {
      toast({
        title: '마이그레이션할 이미지가 없습니다',
        description: '모든 이미지가 이미 Storage에 저장되어 있습니다.'
      });
      return;
    }

    setIsMigrating(true);
    setProgress(0);
    setResults([]);

    const newResults: MigrationResult[] = [];
    
    for (let i = 0; i < externalImageCandidates.length; i++) {
      const candidate = externalImageCandidates[i];
      setCurrentCandidate(candidate.name);
      
      const result = await migrateImage(candidate);
      newResults.push(result);
      setResults([...newResults]);
      setProgress(Math.round(((i + 1) / externalImageCandidates.length) * 100));
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentCandidate(null);
    setIsMigrating(false);

    const successCount = newResults.filter(r => r.success).length;
    const failCount = newResults.filter(r => !r.success).length;

    toast({
      title: '마이그레이션 완료',
      description: `성공: ${successCount}명, 실패: ${failCount}명`
    });

    // Refresh candidates list
    await fetchCandidates();
  };

  const handleMigrateSingle = async (candidate: Candidate) => {
    setCurrentCandidate(candidate.name);
    
    const result = await migrateImage(candidate);
    setResults(prev => [...prev, result]);
    
    setCurrentCandidate(null);

    if (result.success) {
      toast({
        title: '이미지 마이그레이션 성공',
        description: `${candidate.name}님의 이미지가 Storage로 이동되었습니다.`
      });
      await fetchCandidates();
    } else {
      toast({
        title: '이미지 마이그레이션 실패',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          외부 이미지 마이그레이션
        </CardTitle>
        <CardDescription>
          핫링킹 차단 및 토큰 만료 문제를 해결하기 위해 외부 이미지를 Storage로 마이그레이션합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="text-2xl font-bold text-destructive">{externalImageCandidates.length}</div>
            <div className="text-sm text-muted-foreground">외부 URL 사용</div>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-2xl font-bold text-primary">{storageImageCandidates.length}</div>
            <div className="text-sm text-muted-foreground">Storage 저장됨</div>
          </div>
          <div className="p-3 rounded-lg bg-muted border">
            <div className="text-2xl font-bold text-muted-foreground">{noImageCandidates.length}</div>
            <div className="text-sm text-muted-foreground">이미지 없음</div>
          </div>
        </div>

        {/* Migration Progress */}
        {isMigrating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {currentCandidate ? `${currentCandidate} 처리 중...` : '완료'}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleMigrateAll}
            disabled={isMigrating || externalImageCandidates.length === 0}
            className="flex-1"
          >
            {isMigrating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                마이그레이션 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                전체 마이그레이션 ({externalImageCandidates.length}명)
              </>
            )}
          </Button>
          <Button variant="outline" onClick={fetchCandidates} disabled={isMigrating}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* External Image Candidates List */}
        {externalImageCandidates.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">외부 URL 사용 중인 후보자</h4>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {externalImageCandidates.map(candidate => {
                const result = results.find(r => r.candidateId === candidate.id);
                const isProcessing = currentCandidate === candidate.name;
                
                return (
                  <div 
                    key={candidate.id}
                    className="flex items-center gap-3 p-2 rounded-lg border bg-card"
                  >
                    <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-muted">
                      {candidate.image_url && (
                        <img
                          src={candidate.image_url}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{candidate.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {candidate.party}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : result ? (
                        result.success ? (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMigrateSingle(candidate)}
                          disabled={isMigrating}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Results Summary */}
        {results.length > 0 && !isMigrating && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="font-medium text-sm">마이그레이션 결과</span>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-primary" />
                <span>성공: {results.filter(r => r.success).length}명</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-destructive" />
                <span>실패: {results.filter(r => !r.success).length}명</span>
              </div>
            </div>
            {results.some(r => !r.success) && (
              <div className="mt-2 text-xs text-muted-foreground">
                실패한 이미지는 원본 서버에서 접근이 차단되었거나 URL이 만료되었을 수 있습니다.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
