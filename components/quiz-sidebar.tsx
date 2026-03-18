'use client';

import { QuestionStatus } from '@/lib/quiz-utils';

interface QuizSidebarProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  questionStatuses: QuestionStatus[];
  onQuestionSelect: (index: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function QuizSidebar({
  totalQuestions,
  currentQuestionIndex,
  questionStatuses,
  onQuestionSelect,
  isOpen,
  onToggle,
}: QuizSidebarProps) {
  const answeredCount = questionStatuses.filter(q => q.answered).length;
  const skippedCount = questionStatuses.filter(q => q.skipped).length;
  const unansweredCount = totalQuestions - answeredCount - skippedCount;

  const getQuestionStatus = (index: number) => {
    const status = questionStatuses.find(q => q.index === index);
    if (status?.answered) return 'answered';
    if (status?.skipped) return 'skipped';
    return 'unanswered';
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-20 right-4 z-40 p-2 bg-primary text-white rounded-lg shadow-lg hover:bg-primary/90 transition"
        aria-label="Toggle question navigator"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative left-0 top-0 z-30 h-screen pt-20 lg:pt-0
        bg-surface-secondary border-r border-border
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-64 overflow-y-auto
      `}>
        {/* Close button for mobile */}
        <button
          onClick={onToggle}
          className="lg:hidden absolute top-4 right-4 p-1 hover:bg-surface-tertiary rounded transition"
          aria-label="Close navigator"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Summary Stats */}
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-sm mb-3 text-text-primary">Progress</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-success rounded-full" />
                Answered
              </span>
              <span className="font-bold">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-warning rounded-full" />
                Skipped
              </span>
              <span className="font-bold">{skippedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-400 rounded-full" />
                Unanswered
              </span>
              <span className="font-bold">{unansweredCount}</span>
            </div>
          </div>
        </div>

        {/* Question Grid */}
        <div className="p-4">
          <h3 className="font-bold text-sm mb-3 text-text-primary">Questions</h3>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalQuestions }).map((_, index) => {
              const status = getQuestionStatus(index);
              const isCurrentQuestion = index === currentQuestionIndex;

              let statusClass = 'bg-transparent border border-border hover:border-text-secondary/50';
              if (status === 'answered') {
                statusClass = 'bg-success hover:bg-success/80 border-0';
              } else if (status === 'skipped') {
                statusClass = 'bg-warning hover:bg-warning/80 border-0';
              }

              return (
                <button
                  key={index}
                  onClick={() => {
                    onQuestionSelect(index);
                    onToggle(); // Close sidebar on mobile
                  }}
                  className={`
                    w-10 h-10 rounded font-bold text-sm transition-all
                    ${statusClass}
                    ${isCurrentQuestion ? 'ring-2 ring-primary ring-offset-2' : ''}
                    hover:scale-110
                  `}
                  title={`Question ${index + 1} - ${status}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 text-xs text-text-secondary space-y-1 border-t border-border pt-4">
            <p>
              <span className="inline-block w-2 h-2 bg-success rounded-full mr-2" />
              Answered
            </p>
            <p>
              <span className="inline-block w-2 h-2 bg-warning rounded-full mr-2" />
              Skipped
            </p>
            <p>
              <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2" />
              Unanswered
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <button
          onClick={onToggle}
          className="lg:hidden fixed inset-0 z-20 bg-black/30"
          aria-label="Close navigator"
        />
      )}
    </>
  );
}
