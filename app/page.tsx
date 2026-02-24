import Link from 'next/link';
import { Header } from '@/components/header';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <div className="container py-16">
        <div className="mirai-header">
          <div className="mirai-title">Mirai Labs</div>
          <div className="mirai-subtitle">AI & Cloud Solutions</div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-4 text-balance">
            Master AWS Cloud & AI Knowledge
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto text-balance">
            Prepare for AWS certifications with our comprehensive quiz platform. Test your knowledge, track your progress, and excel in cloud computing.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Quiz Card */}
          <div className="card hover:border-primary/50 transition-all duration-300">
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-xl font-bold mb-3">Take a Quiz</h2>
            <p className="text-text-secondary mb-6">
              Challenge yourself with 40 random questions from our comprehensive AWS question bank.
            </p>
            <Link href="/quiz" className="btn btn-primary w-full justify-center">
              Start Quiz
            </Link>
          </div>

          {/* Aggregator Card */}
          <div className="card hover:border-primary/50 transition-all duration-300">
            <div className="text-4xl mb-4">📤</div>
            <h2 className="text-xl font-bold mb-3">Upload Questions</h2>
            <p className="text-text-secondary mb-6">
              Import markdown files with AWS questions to expand your question database.
            </p>
            <Link href="/aggregator" className="btn btn-primary w-full justify-center">
              Upload Files
            </Link>
          </div>

          {/* Results Card */}
          <div className="card hover:border-primary/50 transition-all duration-300">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-bold mb-3">View Results</h2>
            <p className="text-text-secondary mb-6">
              Review your test history, scores, and detailed performance analytics.
            </p>
            <Link href="/results" className="btn btn-primary w-full justify-center">
              View Results
            </Link>
          </div>
        </div>

        {/* Feature Section */}
        <div className="bg-surface border border-border rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Why Choose Mirai Labs?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="text-primary text-2xl">✓</div>
              <div>
                <h3 className="font-bold mb-2">Comprehensive Questions</h3>
                <p className="text-text-secondary text-sm">
                  Extensive collection of AWS certification questions covering all domains and difficulty levels.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-primary text-2xl">✓</div>
              <div>
                <h3 className="font-bold mb-2">Real-time Scoring</h3>
                <p className="text-text-secondary text-sm">
                  Get instant feedback on your answers with detailed explanations and score tracking.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-primary text-2xl">✓</div>
              <div>
                <h3 className="font-bold mb-2">Progress Analytics</h3>
                <p className="text-text-secondary text-sm">
                  Monitor your improvement over time with detailed performance analytics and statistics.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-primary text-2xl">✓</div>
              <div>
                <h3 className="font-bold mb-2">Multiple Answer Support</h3>
                <p className="text-text-secondary text-sm">
                  Practice with both single-answer and multi-answer questions like real AWS exams.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-4 text-center mb-12">
          <div className="card">
            <div className="text-3xl font-bold text-primary mb-2">40+</div>
            <div className="text-text-secondary">Questions Per Test</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-primary mb-2">100+</div>
            <div className="text-text-secondary">AWS Topics</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-primary mb-2">70%</div>
            <div className="text-text-secondary">Pass Threshold</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-primary mb-2">∞</div>
            <div className="text-text-secondary">Test Attempts</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to get started?</h2>
          <Link href="/quiz" className="btn btn-primary px-8 py-3">
            Take Your First Quiz
          </Link>
        </div>
      </div>
    </main>
  );
}
