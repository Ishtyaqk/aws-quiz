'use client';

import { Question } from '@/lib/quiz-utils';

interface QuizQuestionProps {
  question: Question;
  questionNumber: number;
  selectedAnswer: string | string[] | undefined;
  onAnswer: (answer: string | string[]) => void;
}

export default function QuizQuestion(){
  question,
  questionNumber,
  selectedAnswer,
  onAnswer,
}: QuizQuestionProps) {
  const isMultiple = Array.isArray(question.correct_answer) && question.correct_answer.length > 1;
  const selectedSet = new Set(Array.isArray(selectedAnswer) ? selectedAnswer : selectedAnswer ? [selectedAnswer] : []);

  const handleSingleSelect = (letter: string) => {
    onAnswer(letter);
  };

  const handleMultiSelect = (letter: string) => {
    const newSelected = new Set(selectedSet);
    if (newSelected.has(letter)) {
      newSelected.delete(letter);
    } else {
      newSelected.add(letter);
    }
    onAnswer(Array.from(newSelected));
  };

  return (
    <div className="question-card">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Question {questionNumber}
        </h2>
        <p className="text-lg text-text-secondary">
          {question.question}
        </p>
        {isMultiple && (
          <div className="mt-3 text-sm text-info bg-info/10 border border-info/30 rounded px-3 py-2">
            Select multiple correct answers
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map(option => (
          <button
            key={option.letter}
            onClick={() => isMultiple ? handleMultiSelect(option.letter) : handleSingleSelect(option.letter)}
            className={`option-card text-left ${
              selectedSet.has(option.letter) ? 'selected' : ''
            }`}
          >
            <div className="flex gap-4">
              {/* Checkbox/Radio */}
              <div className="flex-shrink-0 mt-1">
                {isMultiple ? (
                  <div className={`w-5 h-5 border-2 rounded transition-all ${
                    selectedSet.has(option.letter)
                      ? 'bg-primary border-primary'
                      : 'border-border'
                  }`}>
                    {selectedSet.has(option.letter) && (
                      <div className="text-white text-sm flex items-center justify-center h-full">✓</div>
                    )}
                  </div>
                ) : (
                  <div className={`w-5 h-5 border-2 rounded-full transition-all ${
                    selectedSet.has(option.letter)
                      ? 'bg-primary border-primary'
                      : 'border-border'
                  }`}>
                    {selectedSet.has(option.letter) && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                    )}
                  </div>
                )}
              </div>

              {/* Option Text */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-primary mb-1">{option.letter}.</div>
                <div className="text-text-primary break-words">
                  {option.text}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
