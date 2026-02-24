'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { parseMarkdown, Question } from '@/lib/quiz-utils';

export default function AggregatorPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<Question[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const mdFiles = selectedFiles.filter(f => f.name.endsWith('.md'));

    if (mdFiles.length === 0) {
      setError('Please select markdown (.md) files');
      return;
    }

    setFiles(mdFiles);
    setError('');
    setSuccess('');
    setPreview([]);
  };

  const handlePreview = async () => {
    if (files.length === 0) {
      setError('Please select files first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      let allQuestions: Question[] = [];

      for (const file of files) {
        const content = await file.text();
        const questions = parseMarkdown(content);
        allQuestions = allQuestions.concat(questions);
      }

      setPreview(allQuestions);
      setSuccess(`Parsed ${allQuestions.length} questions from ${files.length} file(s)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error parsing files');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (preview.length === 0) {
      setError('Please preview files first');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      });

      if (!response.ok) {
        throw new Error('Failed to save questions');
      }

      const result = await response.json();
      setSuccess(`Successfully uploaded ${result.count} questions!`);
      setFiles([]);
      setPreview([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setPreview([]);
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main className="min-h-screen">
      <Header />

      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="mirai-header mb-8">
              <div className="mirai-title">Question Aggregator</div>
              <div className="mirai-subtitle">Import Markdown Questions</div>
            </div>

            <p className="text-text-secondary text-lg">
              Upload markdown files containing AWS quiz questions to expand your question database.
            </p>
          </div>

          {/* Upload Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Upload Form */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-6">Upload Files</h2>

              <div className="form-group mb-6">
                <label className="form-label">Select Markdown Files</label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-text-secondary mb-2">Click to select or drag and drop</p>
                  <p className="text-text-muted text-sm">Only .md files are supported</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".md"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {files.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-2">Selected Files ({files.length})</h3>
                  <div className="space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-text-secondary bg-surface-secondary p-2 rounded">
                        <span>📋</span>
                        <span className="flex-1 truncate">{file.name}</span>
                        <span className="text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handlePreview}
                  disabled={files.length === 0 || loading}
                  className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Preview Questions'}
                </button>

                {preview.length > 0 && (
                  <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="btn btn-success w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Uploading...' : 'Upload to Database'}
                  </button>
                )}

                {files.length > 0 && (
                  <button
                    onClick={handleClear}
                    disabled={loading}
                    className="btn btn-ghost w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Information Panel */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-6">Format Requirements</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-bold text-primary mb-2">Question Format</h3>
                  <code className="text-xs bg-surface-secondary p-2 rounded block overflow-x-auto">
                    1. Question text here?
                  </code>
                </div>

                <div>
                  <h3 className="font-bold text-primary mb-2">Options Format</h3>
                  <code className="text-xs bg-surface-secondary p-2 rounded block overflow-x-auto">
                    - A. Option A<br />
                    - B. Option B
                  </code>
                </div>

                <div>
                  <h3 className="font-bold text-primary mb-2">Answers Format</h3>
                  <code className="text-xs bg-surface-secondary p-2 rounded block overflow-x-auto">
                    Correct answer: A<br />
                    or<br />
                    Correct answer: A, B
                  </code>
                </div>
              </div>

              <div className="bg-info/10 border border-info/30 rounded-lg p-4">
                <h3 className="font-bold text-info mb-2">Tips</h3>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Use letters A-E for options</li>
                  <li>• Separate questions with line breaks</li>
                  <li>• Wrap answers in HTML details tags</li>
                  <li>• One file can contain multiple questions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="alert alert-error mb-6">{error}</div>
          )}

          {success && (
            <div className="alert alert-success mb-6">{success}</div>
          )}

          {/* Preview Section */}
          {preview.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Preview ({preview.length} questions)</h2>

              <div className="space-y-4">
                {preview.slice(0, 5).map((q, idx) => (
                  <div key={idx} className="card">
                    <h3 className="font-bold mb-3">Q{idx + 1}: {q.question}</h3>
                    <div className="space-y-2 ml-4">
                      {q.options.map(opt => (
                        <div key={opt.letter} className="text-sm">
                          {opt.letter}. {opt.text}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-primary font-mono">
                      Answer: {Array.isArray(q.correct_answer) 
                        ? q.correct_answer.join(', ') 
                        : q.correct_answer
                      }
                    </div>
                  </div>
                ))}

                {preview.length > 5 && (
                  <div className="text-center text-text-secondary">
                    +{preview.length - 5} more questions
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Links */}
          <div className="flex gap-4 justify-center">
            <Link href="/quiz" className="btn btn-primary">
              Take a Quiz
            </Link>
            <Link href="/results" className="btn btn-secondary">
              View Results
            </Link>
            <Link href="/" className="btn btn-ghost">
              Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
