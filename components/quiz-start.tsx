'use client';

import { useState } from 'react';
import Link from 'next/link';

interface QuizStartProps {
  questionsCount: number;
  onStartTest: (userName: string) => void;
}

export default function QuizStart({ questionsCount, onStartTest }: QuizStartProps) {
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');

  const handleStart = () => {
    const trimmedName = userName.trim();
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    setError('');
    onStartTest(trimmedName);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mirai-header mb-12">
        <div className="mirai-title">AWS Knowledge Test</div>
        <div className="mirai-subtitle">Powered by Mirai Labs</div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Form Section */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Start Your Quiz</h2>

          <div className="form-group">
            <label className="form-label">Your Name</label>
            <input
              type="text"
              value={userName}
              onChange={e => {
                setUserName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name"
              className="form-input"
              onKeyPress={e => e.key === 'Enter' && handleStart()}
            />
            {error && <div className="text-error text-sm mt-2">{error}</div>}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleStart}
              className="btn btn-primary w-full justify-center"
            >
              Start Quiz
            </button>
            <Link href="/" className="btn btn-secondary w-full justify-center block">
              Back Home
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Quiz Information</h2>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-text-secondary mb-1">Available Questions</div>
              <div className="text-2xl font-bold text-primary">{questionsCount}</div>
            </div>

            <div>
              <div className="text-sm text-text-secondary mb-1">Questions per Test</div>
              <div className="text-2xl font-bold text-primary">40</div>
            </div>

            <div>
              <div className="text-sm text-text-secondary mb-1">Pass Score</div>
              <div className="text-2xl font-bold text-success">70%</div>
            </div>

            <div className="bg-surface-secondary p-4 rounded-lg">
              <h3 className="font-bold mb-2 text-info">Format</h3>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Multiple choice questions</li>
                <li>• Single and multi-answer</li>
                <li>• Unlimited time</li>
                <li>• Instant feedback</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-info/10 border border-info/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-info mb-3">Test Tips</h3>
        <ul className="space-y-2 text-text-secondary text-sm">
          <li>• Read each question carefully before selecting an answer</li>
          <li>• Some questions may require multiple correct answers</li>
          <li>• You cannot go back to previous questions</li>
          <li>• Your score will be saved automatically</li>
        </ul>
      </div>
    </div>
  );
}
