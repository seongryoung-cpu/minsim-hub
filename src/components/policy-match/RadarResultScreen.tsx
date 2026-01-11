import { motion } from 'framer-motion';
import { Brain, Heart, User, ChevronRight, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { MatchResult, PreferredCandidate, CategoryScore } from '@/types/policy';
import { POLICY_CATEGORIES, generateInsight } from '@/types/policy';

interface RadarResultScreenProps {
  results: MatchResult[];
  userPreference: PreferredCandidate;
  categoryScores: Record<string, CategoryScore[]>;
  onContinue: () => void;
}

export function RadarResultScreen({ 
  results, 
  userPreference, 
  categoryScores,
  onContinue 
}: RadarResultScreenProps) {
  const navigate = useNavigate();
  const topMatch = results[0];
  
  // 사용자가 선택한 후보 찾기
  const preferredResult = userPreference 
    ? results.find(r => r.candidateId === userPreference.candidateId)
    : null;

  // 레이더 차트 데이터 생성
  const radarData = POLICY_CATEGORIES.map(category => {
    const userCategoryScore = categoryScores[topMatch.candidateId]?.find(c => c.category === category);
    const preferredCategoryScore = preferredResult 
      ? categoryScores[preferredResult.candidateId]?.find(c => c.category === category)
      : null;

    return {
      category,
      '나의 성향': userCategoryScore?.userScore || 50,
      '추천 후보': userCategoryScore?.candidateScore || 50,
      ...(preferredCategoryScore ? { '원픽 후보': preferredCategoryScore.candidateScore } : {}),
    };
  });

  const insight = generateInsight(
    userPreference,
    topMatch,
    categoryScores[topMatch.candidateId] || []
  );

  const isMatched = userPreference?.candidateId === topMatch.candidateId;
  const hasPreference = userPreference !== null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-4 pb-24 lg:pb-8"
    >
      {/* Header with comparison */}
      <div className="flex items-center justify-center gap-4 mb-6 pt-4">
        {hasPreference && (
          <>
            {/* Heart - User's preference */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isMatched ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <Heart size={24} className={isMatched ? 'text-green-500' : 'text-red-500'} fill="currentColor" />
              </div>
              <span className="text-xs text-muted-foreground mt-1">내 원픽</span>
            </motion.div>

            {/* VS or Match indicator */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isMatched 
                  ? 'bg-green-500 text-white' 
                  : 'bg-yellow-500 text-yellow-900'
              }`}
            >
              {isMatched ? '일치!' : 'VS'}
            </motion.div>
          </>
        )}

        {/* Brain - Algorithm recommendation */}
        <motion.div
          initial={{ x: hasPreference ? 50 : 0, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Brain size={24} className="text-indigo-500" />
          </div>
          <span className="text-xs text-muted-foreground mt-1">AI 추천</span>
        </motion.div>
      </div>

      {/* Comparison Cards */}
      <div className={`grid gap-3 mb-6 ${hasPreference && !isMatched ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* User Preference (if different from top match) */}
        {hasPreference && !isMatched && preferredResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card rounded-2xl p-4 shadow-sm relative overflow-hidden border-2 border-red-200 dark:border-red-800"
          >
            <div className="absolute top-2 right-2">
              <AlertTriangle size={16} className="text-yellow-500" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${preferredResult.partyColor}20`,
                  border: `2px solid ${preferredResult.partyColor}`,
                }}
              >
                <User size={20} style={{ color: preferredResult.partyColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{preferredResult.candidateName}</p>
                <p className="text-xs text-muted-foreground">{preferredResult.party}</p>
              </div>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold" style={{ color: preferredResult.partyColor }}>
                {preferredResult.matchScore}%
              </span>
              <p className="text-xs text-muted-foreground">정책 일치도</p>
            </div>
          </motion.div>
        )}

        {/* AI Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card rounded-2xl p-4 shadow-lg relative overflow-hidden border-2 border-indigo-200 dark:border-indigo-800"
        >
          <div className="absolute top-2 right-2">
            <TrendingUp size={16} className="text-green-500" />
          </div>
          {isMatched && (
            <div className="absolute top-2 left-2">
              <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-bold">
                🎯 매칭!
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: `${topMatch.partyColor}20`,
                border: `2px solid ${topMatch.partyColor}`,
              }}
            >
              <User size={20} style={{ color: topMatch.partyColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{topMatch.candidateName}</p>
              <p className="text-xs text-muted-foreground">{topMatch.party}</p>
            </div>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold" style={{ color: topMatch.partyColor }}>
              {topMatch.matchScore}%
            </span>
            <p className="text-xs text-muted-foreground">정책 일치도</p>
          </div>
        </motion.div>
      </div>

      {/* Radar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-card rounded-3xl p-4 shadow-lg mb-6"
      >
        <h3 className="text-sm font-semibold text-center mb-4">정책 분야별 성향 비교</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="category" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Radar
                name="나의 성향"
                dataKey="나의 성향"
                stroke="#6366F1"
                fill="#6366F1"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Radar
                name="추천 후보"
                dataKey="추천 후보"
                stroke={topMatch.partyColor}
                fill={topMatch.partyColor}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              {hasPreference && !isMatched && (
                <Radar
                  name="원픽 후보"
                  dataKey="원픽 후보"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              )}
              <Legend 
                wrapperStyle={{ fontSize: '11px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Insight Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
            <Lightbulb size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-indigo-800 dark:text-indigo-300 mb-1">
              AI 인사이트
            </h4>
            <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">
              {insight}
            </p>
          </div>
        </div>
      </motion.div>

      {/* View Candidate Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        onClick={() => navigate(`/candidate/${topMatch.candidateId}`)}
        className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 mb-4 shadow-lg"
        style={{ backgroundColor: topMatch.partyColor }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {topMatch.candidateName} 후보 상세 보기
        <ChevronRight size={18} />
      </motion.button>

      {/* Continue Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={onContinue}
        className="w-full py-4 rounded-xl bg-secondary font-semibold flex items-center justify-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        다음: 내 마음 확인하기
        <ChevronRight size={18} />
      </motion.button>
    </motion.div>
  );
}
