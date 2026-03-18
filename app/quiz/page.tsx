'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Question, selectRandomQuestions, calculateScore, generateResult, generateOrGetUserId, QuestionStatus } from '@/lib/quiz-utils';
import QuizStart from '@/components/quiz-start';
import QuizQuestion from '@/components/quiz-question';
import QuizSidebar from '@/components/quiz-sidebar';

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string | string[]>>({});
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
  const [questionStatuses, setQuestionStatuses] = useState<QuestionStatus[]>([]);
  const [testCompleted, setTestCompleted] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Load questions and initialize userId
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // Initialize userId
        const id = generateOrGetUserId();
        setUserId(id);

        const response = await fetch('/api/questions');
        if (!response.ok) {
          throw new Error('Failed to load questions');
        }
        const data = await response.json();
        setQuestions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, []);

  const handleStartTest = (name: string) => {
    const selected = selectRandomQuestions(questions, 40);
    setSelectedQuestions(selected);
    setUserName(name);
    setTestStarted(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSkippedQuestions(new Set());
    setTestCompleted(false);
    setStartTime(Date.now());
    
    // Initialize question statuses
    const statuses: QuestionStatus[] = selected.map((_, idx) => ({
      index: idx,
      answered: false,
      skipped: false,
    }));
    setQuestionStatuses(statuses);
  };

  const handleAnswer = (answer: string | string[]) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }));
    
    // Update question status
    setQuestionStatuses(prev =>
      prev.map(status =>
        status.index === currentQuestionIndex
          ? { ...status, answered: true, skipped: false }
          : status
      )
    );
    
    // Remove from skipped if it was skipped
    setSkippedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(currentQuestionIndex);
      return newSet;
    });
  };

  const handleSkipQuestion = () => {
    setSkippedQuestions(prev => new Set([...prev, currentQuestionIndex]));
    
    // Update question status
    setQuestionStatuses(prev =>
      prev.map(status =>
        status.index === currentQuestionIndex
          ? { ...status, skipped: true, answered: false }
          : status
      )
    );
    
    // Remove answer if it exists
    setUserAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQuestionIndex];
      return newAnswers;
    });
  };

  const handleNext = async () => {
    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Calculate and save result
      const { correct, wrong } = calculateScore(selectedQuestions, userAnswers);
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      
      const result = generateResult(
        userName,
        correct,
        selectedQuestions.length,
        wrong,
        userId,
        questionStatuses,
        timeSpent
      );

      try {
        await fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result),
        });
      } catch (err) {
        console.error('Error saving result:', err);
      }

      // Store in session and redirect
      sessionStorage.setItem('last_quiz_result', JSON.stringify(result));
      router.push('/quiz/complete');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setSidebarOpen(false);
  };

  const handleQuit = () => {
    if (confirm('Are you sure you want to quit the test?')) {
      setTestStarted(false);
      setTestCompleted(false);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
    }
  };

  const handleRetry = () => {
    setTestStarted(false);
    setTestCompleted(false);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setUserName('');
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="container py-16 text-center">
          <div className="animate-shimmer text-lg">Loading questions...</div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="container py-16">
          <div className="alert alert-error">{error}</div>
          <Link href="/" className="btn btn-primary mt-4">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  // Initial state - show quiz start screen
  if (!testStarted) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="container py-8">
          <QuizStart
            questionsCount={questions.length}
            onStartTest={handleStartTest}
          />
        </div>
      </main>
    );
  }

  // Quiz in progress - show questions
  if (selectedQuestions.length > 0 && currentQuestionIndex < selectedQuestions.length) {
    const currentQuestion = selectedQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / selectedQuestions.length) * 100;
    const isCurrentSkipped = skippedQuestions.has(currentQuestionIndex);

    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="flex h-[calc(100vh-80px)]">
          {/* Sidebar */}
          <QuizSidebar
            totalQuestions={selectedQuestions.length}
            currentQuestionIndex={currentQuestionIndex}
            questionStatuses={questionStatuses}
            onQuestionSelect={handleJumpToQuestion}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto py-8">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
            {/* Progress Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">AWS Quiz</h1>
                <div className="flex gap-6 items-center">
                  <div className="text-center">
                    <div className="text-sm text-text-secondary">Question</div>
                    <div className="text-lg font-bold text-primary">
                      {currentQuestionIndex + 1}/{selectedQuestions.length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-text-secondary">Progress</div>
                    <div className="text-lg font-bold text-primary">
                      {Math.round(progress)}%
                    </div>
                  </div>
                  <button
                    onClick={handleQuit}
                    className="btn btn-sm btn-ghost ml-4"
                  >
                    Quit Test
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

              {/* Question Card */}
              <QuizQuestion
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                selectedAnswer={userAnswers[currentQuestionIndex]}
                onAnswer={handleAnswer}
                isSkipped={isCurrentSkipped}
                onSkip={handleSkipQuestion}
              />

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed order-1"
                >
                  Previous
                </button>

                <button
                  onClick={handleSkipQuestion}
                  className={`btn ${isCurrentSkipped ? 'btn-warning' : 'btn-outline'} order-2`}
                >
                  {isCurrentSkipped ? 'Unskip' : 'Skip'}
                </button>

                {currentQuestionIndex === selectedQuestions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="btn btn-primary order-3"
                  >
                    Submit Test
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="btn btn-primary order-3"
                  >
                    Next Question
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Default fallback - should not reach here, but provides safety
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container py-16 text-center">
        <p className="text-lg text-text-secondary mb-6">An unexpected error occurred</p>
        <Link href="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
