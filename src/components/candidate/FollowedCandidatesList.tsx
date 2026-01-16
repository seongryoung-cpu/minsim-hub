import { motion } from 'framer-motion';
import { Heart, User, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFollowedCandidates } from '@/hooks/useFollowedCandidates';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FollowedCandidate {
  id: string;
  slug: string;
  name: string;
  party: string;
  party_color: string;
  position: string;
  image_url: string | null;
}

export function FollowedCandidatesList() {
  const navigate = useNavigate();
  const { followedIds, isLoaded, followCount } = useFollowedCandidates();

  // Fetch candidate details for followed IDs
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['followed-candidates-details', followedIds],
    queryFn: async () => {
      if (followedIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('candidates')
        .select('id, slug, name, party, party_color, position, image_url')
        .in('id', followedIds);

      if (error) throw error;
      return (data || []) as FollowedCandidate[];
    },
    enabled: isLoaded && followedIds.length > 0,
  });

  if (!isLoaded || isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-5 shadow-app-md"
      >
        <div className="flex items-center gap-2 mb-4">
          <Heart size={20} className="text-red-500" />
          <h3 className="font-semibold text-foreground">관심 후보</h3>
        </div>
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-5 shadow-app-md"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart size={20} className="text-red-500 fill-red-500" />
          <h3 className="font-semibold text-foreground">관심 후보</h3>
          {followCount > 0 && (
            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
              {followCount}명
            </span>
          )}
        </div>
      </div>

      {candidates && candidates.length > 0 ? (
        <div className="space-y-3">
          {candidates.map((candidate, index) => (
            <motion.button
              key={candidate.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/candidate/${candidate.slug}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary active:scale-[0.98] transition-all"
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${candidate.party_color}30, ${candidate.party_color}10)`,
                  border: `2px solid ${candidate.party_color}`,
                }}
              >
                {candidate.image_url ? (
                  <img
                    src={candidate.image_url}
                    alt={candidate.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} style={{ color: candidate.party_color }} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{candidate.name}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${candidate.party_color}20`,
                      color: candidate.party_color,
                    }}
                  >
                    {candidate.party}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{candidate.position}</p>
              </div>

              <ChevronRight size={18} className="text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Heart size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">관심 후보가 없습니다</p>
          <p className="text-xs mt-1">후보자 정보에서 ♡를 눌러 추가해보세요</p>
        </div>
      )}
    </motion.div>
  );
}
