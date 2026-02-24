'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { QuizResult } from '@/lib/quiz-utils';

export default function ResultsPage() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const response = await fetch('/api/results');
        if (!response.ok) {
          throw new Error('Failed to load results');
        }
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all results? This cannot be undone.')) {
      return;
    }

    try {
      // Delete all result files
      for (const result of results) {
        const filename = `test_${result.date.replace(/[:-]/g, '')}.json`;
        // Note: This would need an additional API endpoint to implement
      }
      setResults([]);
    } catch (err) {
      console.error('Error clearing results:', err);
    }
  };

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

  return (
    <main className="min-h-screen">
      <Header />

      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Test Results</h1>
            <p className="text-text-secondary">
              {results.length === 0
                ? 'No tests taken yet'
                : `${results.length} test${results.length !== 1 ? 's' : ''} completed`
              }
            </p>
          </div>

          {/* Empty State */}
          {results.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-2xl font-bold mb-3">No Results Yet</h2>
              <p className="text-text-secondary mb-6">
                Take a quiz to see your results here
              </p>
              <Link href="/quiz" className="btn btn-primary inline-block">
                Take a Quiz
              </Link>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <div className="card">
                  <div className="text-sm text-text-secondary mb-2">Total Tests</div>
                  <div className="text-3xl font-bold text-primary">{results.length}</div>
                </div>

                <div className="card">
                  <div className="text-sm text-text-secondary mb-2">Pass Rate</div>
                  <div className="text-3xl font-bold text-success">
                    {Math.round((results.filter(r => r.percentage >= 70).length / results.length) * 100)}%
                  </div>
                </div>

                <div className="card">
                  <div className="text-sm text-text-secondary mb-2">Avg Score</div>
                  <div className="text-3xl font-bold text-primary">
                    {Math.round(
                      results.reduce((sum, r) => sum + r.percentage, 0) / results.length
                    )}%
                  </div>
                </div>

                <div className="card">
                  <div className="text-sm text-text-secondary mb-2">Best Score</div>
                  <div className="text-3xl font-bold text-success">
                    {Math.max(...results.map(r => r.percentage))}%
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="card overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-text-secondary text-sm font-semibold">Name</th>
                      <th className="text-left py-3 px-4 text-text-secondary text-sm font-semibold">Date</th>
                      <th className="text-center py-3 px-4 text-text-secondary text-sm font-semibold">Score</th>
                      <th className="text-center py-3 px-4 text-text-secondary text-sm font-semibold">Percentage</th>
                      <th className="text-center py-3 px-4 text-text-secondary text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border/50 hover:bg-surface-secondary/50 transition cursor-pointer"
                        onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                      >
                        <td className="py-3 px-4">{result.name}</td>
                        <td className="py-3 px-4 text-text-secondary text-sm">
                          {new Date(result.date).toLocaleDateString()}
                        </td>
                        <td className="text-center py-3 px-4 font-bold text-primary">
                          {result.score}/{result.total}
                        </td>
                        <td className="text-center py-3 px-4 font-bold text-primary">
                          {result.percentage}%
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`badge ${
                            result.percentage >= 70 ? 'badge-success' : 'badge-error'
                          }`}>
                            {result.percentage >= 70 ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Detailed Results */}
              <div className="mt-8 space-y-4">
                {results.map((result, idx) => (
                  <div key={idx} className="card overflow-hidden">
                    <div
                      className="flex justify-between items-center p-6 cursor-pointer hover:bg-surface-secondary/50 transition"
                      onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{result.name}</h3>
                        <p className="text-text-secondary text-sm">
                          {new Date(result.date).toLocaleDateString()} • {result.score}/{result.total} • {result.percentage}%
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`badge ${
                          result.percentage >= 70 ? 'badge-success' : 'badge-error'
                        }`}>
                          {result.percentage >= 70 ? 'PASS' : 'FAIL'}
                        </span>
                        <span className="text-text-secondary">
                          {expandedId === idx ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedId === idx && (
                      <div className="px-6 pb-6 border-t border-border">
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                          <div>
                            <div className="text-sm text-text-secondary mb-1">Score</div>
                            <div className="text-2xl font-bold text-primary">{result.score}/{result.total}</div>
                          </div>
                          <div>
                            <div className="text-sm text-text-secondary mb-1">Percentage</div>
                            <div className="text-2xl font-bold text-primary">{result.percentage}%</div>
                          </div>
                          <div>
                            <div className="text-sm text-text-secondary mb-1">Wrong Answers</div>
                            <div className="text-2xl font-bold text-error">{result.wrong_questions.length}</div>
                          </div>
                        </div>

                        {result.wrong_questions.length > 0 && (
                          <div>
                            <h4 className="font-bold mb-3 text-error">Questions Answered Incorrectly</h4>
                            <div className="space-y-2">
                              {result.wrong_questions.slice(0, 3).map((wrong, widx) => (
                                <div key={widx} className="text-sm text-text-secondary bg-error/5 p-3 rounded border border-error/20">
                                  {wrong.question}
                                </div>
                              ))}
                              {result.wrong_questions.length > 3 && (
                                <div className="text-sm text-text-secondary">
                                  +{result.wrong_questions.length - 3} more incorrect
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <Link href="/quiz" className="btn btn-primary flex-1 justify-center">
                  Take Another Quiz
                </Link>
                <button
                  onClick={handleClearAll}
                  className="btn btn-danger"
                >
                  Clear All Results
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
