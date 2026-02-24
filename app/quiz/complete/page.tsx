'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { QuizResult, WrongQuestion } from '@/lib/quiz-utils';

export default function QuizCompletePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get result data from session storage or URL params
    const resultData = sessionStorage.getItem('last_quiz_result');
    if (resultData) {
      try {
        setResult(JSON.parse(resultData));
        sessionStorage.removeItem('last_quiz_result');
      } catch (err) {
        console.error('Error parsing result:', err);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="container py-16 text-center">
          <div className="animate-shimmer">Loading results...</div>
        </div>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="container py-16">
          <div className="max-w-3xl mx-auto">
            <div className="alert alert-error mb-6">
              No quiz results found. Please take a quiz first.
            </div>
            <Link href="/quiz" className="btn btn-primary">
              Take a Quiz
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isPassed = result.percentage >= 70;

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Result Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {isPassed ? 'Congratulations!' : 'Keep Practicing!'}
            </h1>
            <p className="text-xl text-text-secondary">
              {isPassed 
                ? `${result.name}, you've passed the AWS certification quiz!`
                : `${result.name}, you need more preparation for the certification.`
              }
            </p>
          </div>

          {/* Score Card */}
          <div className={`card mb-8 border-2 ${
            isPassed ? 'border-success bg-success/5' : 'border-error bg-error/5'
          }`}>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-text-secondary mb-2">Score</div>
                <div className="text-4xl font-bold text-primary">
                  {result.score}/{result.total}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-secondary mb-2">Percentage</div>
                <div className={`text-4xl font-bold ${isPassed ? 'text-success' : 'text-error'}`}>
                  {result.percentage}%
                </div>
              </div>
              <div>
                <div className="text-sm text-text-secondary mb-2">Status</div>
                <div className={`text-4xl font-bold ${isPassed ? 'text-success' : 'text-error'}`}>
                  {isPassed ? 'PASS' : 'FAIL'}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-secondary mb-2">Date</div>
                <div className="text-lg font-bold text-primary">
                  {new Date(result.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Wrong Answers Section */}
          {result.wrong_questions.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">
                Review Incorrect Answers ({result.wrong_questions.length})
              </h2>

              <div className="space-y-4">
                {result.wrong_questions.map((wrong, idx) => (
                  <div key={idx} className="card border border-error/30">
                    <div className="mb-4">
                      <h3 className="font-bold text-lg mb-2">Question {idx + 1}</h3>
                      <p className="text-text-secondary">{wrong.question}</p>
                    </div>

                    <div className="space-y-2">
                      {wrong.options.map(opt => {
                        const userSelected = Array.isArray(wrong.user_answer)
                          ? wrong.user_answer.includes(opt.letter)
                          : wrong.user_answer === opt.letter;

                        const isCorrect = Array.isArray(wrong.correct_answer)
                          ? wrong.correct_answer.includes(opt.letter)
                          : wrong.correct_answer === opt.letter;

                        let optionClass = 'option-card';
                        if (isCorrect) optionClass += ' correct';
                        if (userSelected && !isCorrect) optionClass += ' incorrect';

                        return (
                          <div key={opt.letter} className={optionClass}>
                            <div className="flex gap-3">
                              <span className="font-bold text-primary">{opt.letter}.</span>
                              <span>{opt.text}</span>
                              {isCorrect && <span className="ml-auto text-success">✓ Correct</span>}
                              {userSelected && !isCorrect && <span className="ml-auto text-error">✗ Your Answer</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Box */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h3 className="font-bold text-lg mb-4">Correct Answers</h3>
              <div className="text-3xl font-bold text-success">{result.score}</div>
              <p className="text-text-secondary text-sm">out of {result.total} questions</p>
            </div>

            <div className="card">
              <h3 className="font-bold text-lg mb-4">Incorrect Answers</h3>
              <div className="text-3xl font-bold text-error">{result.total - result.score}</div>
              <p className="text-text-secondary text-sm">
                {result.wrong_questions.length > 0 ? 'Review above' : 'All correct!'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/quiz" className="btn btn-primary flex-1 justify-center">
              Take Another Test
            </Link>
            <Link href="/results" className="btn btn-secondary flex-1 justify-center">
              View All Results
            </Link>
            <Link href="/" className="btn btn-ghost flex-1 justify-center">
              Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
