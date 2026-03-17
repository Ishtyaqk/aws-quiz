'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { QuizResult, generateOrGetUserId } from '@/lib/quiz-utils';

interface ComparisonStats {
  userStats: {
    totalTests: number;
    passRate: number;
    averageScore: number;
    bestScore: number;
    recentTrend: 'improving' | 'declining' | 'stable';
  };
  globalStats: {
    totalTests: number;
    averageScore: number;
    passRate: number;
  };
  userPercentile: number;
}

export default function DashboardPage() {
  const [userId, setUserId] = useState('');
  const [results, setResults] = useState<QuizResult[]>([]);
  const [stats, setStats] = useState<ComparisonStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const id = generateOrGetUserId();
        setUserId(id);

        // Fetch user's results
        const resultsResponse = await fetch(`/api/results?userId=${id}`);
        if (!resultsResponse.ok) {
          throw new Error('Failed to load results');
        }
        const resultsData = await resultsResponse.json();
        setResults(resultsData);

        // Fetch comparison stats
        const statsResponse = await fetch(`/api/results/compare?userId=${id}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="container py-16 text-center">
          <div className="animate-shimmer text-lg">Loading your dashboard...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Your Quiz Dashboard</h1>
            <p className="text-text-secondary">
              Track your progress and compare your performance with the community
            </p>
          </div>

          {error && (
            <div className="alert alert-error mb-8">{error}</div>
          )}

          {/* Stats Grid */}
          {stats && (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* Overall Performance */}
              <div className="card border border-primary/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-primary">Overall Performance</h3>
                  <span className="text-2xl">{getTrendIcon(stats.userStats.recentTrend)}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-text-secondary mb-1">Average Score</div>
                    <div className="text-3xl font-bold text-primary">{stats.userStats.averageScore}%</div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="text-sm text-text-secondary mb-1">Trend</div>
                    <div className={`font-bold capitalize ${
                      stats.userStats.recentTrend === 'improving' ? 'text-success' :
                      stats.userStats.recentTrend === 'declining' ? 'text-error' :
                      'text-warning'
                    }`}>
                      {stats.userStats.recentTrend}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tests Completed */}
              <div className="card border border-success/20 p-6">
                <h3 className="font-bold text-lg text-success mb-4">Tests Progress</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-text-secondary mb-1">Total Tests</div>
                    <div className="text-3xl font-bold text-primary">{stats.userStats.totalTests}</div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="text-sm text-text-secondary mb-1">Pass Rate</div>
                    <div className="text-2xl font-bold text-success">{stats.userStats.passRate}%</div>
                  </div>
                </div>
              </div>

              {/* Competitive Standing */}
              <div className="card border border-info/20 p-6">
                <h3 className="font-bold text-lg text-info mb-4">Community Standing</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-text-secondary mb-1">Percentile</div>
                    <div className="text-3xl font-bold text-primary">{stats.userPercentile}th</div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="text-sm text-text-secondary mb-1">vs Community Avg</div>
                    <div className={`font-bold ${
                      stats.userStats.averageScore > stats.globalStats.averageScore ? 'text-success' : 'text-error'
                    }`}>
                      {stats.userStats.averageScore > stats.globalStats.averageScore ? '+' : ''}{stats.userStats.averageScore - stats.globalStats.averageScore}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results History */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your Quiz History</h2>
              {results.length > 0 && (
                <span className="text-text-secondary text-sm">{results.length} test{results.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {results.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-bold mb-2">No Tests Yet</h3>
                <p className="text-text-secondary mb-6">
                  Start taking quizzes to build your history and track your progress
                </p>
                <Link href="/quiz" className="btn btn-primary inline-block">
                  Take Your First Quiz
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result) => {
                  const resultId = result.id || `${result.userId}-${result.date}`;
                  return (
                  <div
                    key={resultId}
                    className="card border border-border/50 overflow-hidden hover:border-border transition"
                  >
                    <div
                      className="flex justify-between items-center p-6 cursor-pointer hover:bg-surface-secondary/30 transition"
                      onClick={() => setExpandedId(expandedId === resultId ? null : resultId)}
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{result.name}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                          <span>{new Date(result.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{result.score}/{result.total} correct</span>
                          {result.timeSpent && (
                            <>
                              <span>•</span>
                              <span>{Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            result.percentage >= 70 ? 'text-success' : 'text-error'
                          }`}>
                            {result.percentage}%
                          </div>
                          <span className={`text-xs font-bold ${
                            result.percentage >= 70 ? 'text-success' : 'text-error'
                          }`}>
                            {result.percentage >= 70 ? 'PASS' : 'FAIL'}
                          </span>
                        </div>

                        <span className="text-text-secondary">
                          {expandedId === result.id ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedId === result.id && (
                      <div className="px-6 pb-6 border-t border-border/50 bg-surface-secondary/20">
                        <div className="grid md:grid-cols-4 gap-4 mb-6">
                          <div>
                            <div className="text-sm text-text-secondary mb-2">Score</div>
                            <div className="text-2xl font-bold text-primary">{result.score}/{result.total}</div>
                          </div>
                          <div>
                            <div className="text-sm text-text-secondary mb-2">Percentage</div>
                            <div className="text-2xl font-bold text-primary">{result.percentage}%</div>
                          </div>
                          <div>
                            <div className="text-sm text-text-secondary mb-2">Wrong Answers</div>
                            <div className="text-2xl font-bold text-error">{result.wrong_questions.length}</div>
                          </div>
                          {result.timeSpent && (
                            <div>
                              <div className="text-sm text-text-secondary mb-2">Time Spent</div>
                              <div className="text-2xl font-bold text-primary">
                                {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Question Status Summary */}
                        {result.question_statuses && (
                          <div className="mb-6">
                            <div className="text-sm font-bold text-text-secondary mb-3">Question Status</div>
                            <div className="flex gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-success rounded-full" />
                                <span>Answered: {result.question_statuses.filter(q => q.answered).length}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-warning rounded-full" />
                                <span>Skipped: {result.question_statuses.filter(q => q.skipped).length}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-gray-400 rounded-full" />
                                <span>Unanswered: {result.question_statuses.filter(q => !q.answered && !q.skipped).length}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Incorrect Questions Preview */}
                        {result.wrong_questions.length > 0 && (
                          <div>
                            <h4 className="font-bold mb-3 text-error">Incorrect Answers</h4>
                            <div className="space-y-2">
                              {result.wrong_questions.slice(0, 3).map((wrong, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm text-text-secondary bg-error/5 p-3 rounded border border-error/20"
                                  title={wrong.question}
                                >
                                  <div className="truncate">{idx + 1}. {wrong.question}</div>
                                </div>
                              ))}
                              {result.wrong_questions.length > 3 && (
                                <div className="text-sm text-text-secondary pt-2">
                                  +{result.wrong_questions.length - 3} more incorrect
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <Link href="/quiz" className="btn btn-primary flex-1 justify-center">
              Take a Quiz
            </Link>
            <Link href="/results" className="btn btn-secondary flex-1 justify-center">
              View Community Results
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
