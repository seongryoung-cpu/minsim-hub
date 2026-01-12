import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { QuizQuestion } from '@/types/quiz';
import { CATEGORY_ICONS } from '@/types/quiz';

interface QuizCardProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (selectedIndex: number, isCorrect: boolean) => void;
}

export function QuizCard({ question, questionNumber, totalQuestions, onAnswer }: QuizCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    
    const isCorrect = index === question.correctAnswer;
    
    setTimeout(() => {
      onAnswer(index, isCorrect);
    }, 2000);
  };

  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-3xl p-6 shadow-app-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{CATEGORY_ICONS[question.category]}</span>
          <span className="text-sm font-medium text-muted-foreground">{question.category}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {questionNumber}/{totalQuestions}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {question.difficulty === 'easy' ? '쉬움' : 
             question.difficulty === 'medium' ? '보통' : '어려움'}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-secondary rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Question */}
      <h3 className="text-lg font-semibold text-foreground mb-6 leading-relaxed">
        {question.question}
      </h3>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectOption = index === question.correctAnswer;
          
          let optionStyle = 'bg-secondary hover:bg-secondary/80 border-transparent';
          if (showResult) {
            if (isCorrectOption) {
              optionStyle = 'bg-green-100 border-green-500 text-green-800';
            } else if (isSelected && !isCorrectOption) {
              optionStyle = 'bg-red-100 border-red-500 text-red-800';
            } else {
              optionStyle = 'bg-secondary/50 border-transparent opacity-50';
            }
          }

          return (
            <motion.button
              key={index}
              whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(index)}
              disabled={selectedAnswer !== null}
              className={`w-full p-4 rounded-xl text-left font-medium transition-all border-2 flex items-center justify-between ${optionStyle}`}
            >
              <span>{option}</span>
              <AnimatePresence>
                {showResult && isCorrectOption && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                  >
                    <Check size={14} className="text-white" />
                  </motion.div>
                )}
                {showResult && isSelected && !isCorrectOption && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
                  >
                    <X size={14} className="text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <div className={`p-4 rounded-xl ${isCorrect ? 'bg-green-50' : 'bg-amber-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <span className="text-green-600 font-semibold">🎉 정답입니다!</span>
                ) : (
                  <span className="text-amber-600 font-semibold">💡 오답이에요</span>
                )}
                <span className="text-sm text-muted-foreground">+{isCorrect ? question.points : 0}점</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {question.explanation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
