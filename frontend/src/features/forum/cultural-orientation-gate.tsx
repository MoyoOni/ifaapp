/**
 * Cultural Orientation Gate Modal (F9-902 / ADM-028)
 * Questions loaded from DB — admin-managed via admin-cultural-quiz-tab.tsx
 */

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';

interface CulturalOrientationGateProps {
  open: boolean;
  onComplete: (passed: boolean) => void;
  categoryName?: string;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
}

interface QuizData {
  questions: QuizQuestion[];
  passThreshold: number;
}

// Fallback questions used only if DB fetch fails
const FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    id: '1',
    questionText: 'What is the primary purpose of the Ifá divination system?',
    options: [
      'Entertainment and fortune telling',
      'A sacred framework for understanding divine wisdom and ethical guidance',
      'A system for predicting the future with 100% accuracy',
      'A business model to make money from clients',
    ],
    correctIndex: 1,
  },
  {
    id: '2',
    questionText: 'How should one approach the teachings in restricted forum spaces?',
    options: [
      'As casual entertainment',
      'With skepticism and doubt',
      'With respect, humility, and readiness to learn from experienced practitioners',
      'As entertainment and nothing else',
    ],
    correctIndex: 2,
  },
  {
    id: '3',
    questionText: 'What is expected of practitioners in the Inner Circle?',
    options: [
      'Maximum profit from consultations',
      'Adherence to ethical standards, continuous learning, and service to community',
      'Keeping all knowledge secret',
      'None of the above',
    ],
    correctIndex: 1,
  },
];

export const CulturalOrientationGate = ({ open, onComplete, categoryName }: CulturalOrientationGateProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const { data: quizData } = useQuery<QuizData>({
    queryKey: ['quiz', 'questions'],
    queryFn: () => api.get('/users/quiz/questions').then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  if (!open) return null;

  const questions = quizData?.questions?.length ? quizData.questions : FALLBACK_QUESTIONS;
  const passThreshold = quizData?.passThreshold ?? 2;
  const question = questions[currentQuestion];
  const selectedAnswer = answers[currentQuestion];

  const handleAnswerSelect = (index: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = index;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) setCurrentQuestion(currentQuestion + 1);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  const handleSubmit = async () => {
    const score = answers.filter((ans, idx) => ans === questions[idx].correctIndex).length;
    const passed = score >= passThreshold;

    setLoading(true);
    try {
      const userId = localStorage.getItem('userId') || '';
      if (userId) {
        await api.post(`/users/${userId}/quiz-attempt`, { passed });
      }
    } catch (error) {
      logger.error('Error recording quiz attempt:', error);
    } finally {
      setLoading(false);
      setCompleted(true);
      setTimeout(() => onComplete(passed), 1500);
    }
  };

  const canProceed = selectedAnswer !== undefined;
  const progress = Math.round(((currentQuestion + 1) / questions.length) * 100);
  const score = completed ? answers.filter((ans, idx) => ans === questions[idx].correctIndex).length : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-background border-neutral-700 rounded-2xl">
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">🌿 Cultural Orientation</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Before entering {categoryName || 'this sacred space'}, we ask that you complete a brief orientation to ensure respectful engagement.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close orientation gate"
              onClick={() => onComplete(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {completed ? (
            <div className="py-8 text-center space-y-3">
              {score >= passThreshold ? (
                <>
                  <p className="text-4xl">✓</p>
                  <p className="text-xl font-semibold text-emerald-500">Welcome to this space</p>
                  <p className="text-sm text-muted-foreground">You have demonstrated cultural readiness. Àṣẹ. 🙏🏾</p>
                </>
              ) : (
                <>
                  <p className="text-4xl">🌱</p>
                  <p className="text-xl font-semibold text-amber-500">Please review the principles</p>
                  <p className="text-sm text-muted-foreground">We invite you to explore our resource center before engaging in restricted areas.</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Question {currentQuestion + 1} of {questions.length}</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4 bg-neutral-900/50 p-6 rounded-xl border border-neutral-800">
                <h3 className="text-lg font-semibold text-foreground">{question.questionText}</h3>
                <div className="space-y-3">
                  {(question.options as string[]).map((option, index) => (
                    <Label
                      key={index}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedAnswer === index
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-neutral-700 hover:border-neutral-600 bg-neutral-800/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion}`}
                        value={index}
                        checked={selectedAnswer === index}
                        onChange={() => handleAnswerSelect(index)}
                        aria-label={option}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="flex-1 text-sm leading-relaxed">{option}</span>
                    </Label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                {currentQuestion > 0 && (
                  <Button onClick={handlePrevious} variant="outline" className="flex-1">Previous</Button>
                )}
                {currentQuestion < questions.length - 1 ? (
                  <Button onClick={handleNext} disabled={!canProceed} className="flex-1">Next</Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={!canProceed || loading} className="flex-1">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : 'Submit'}
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Answer {passThreshold} or more questions correctly to gain access. This helps maintain the integrity of this sacred space. 🙏🏾
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
