export interface QuestionOption {
  letter: string;
  text: string;
}

export interface Question {
  question: string;
  options: QuestionOption[];
  correct_answer: string | string[];
}

export interface QuestionStatus {
  index: number;
  answered: boolean;
  skipped: boolean;
}

export interface QuizResult {
  id?: string;
  userId: string;
  name: string;
  date: string;
  score: number;
  total: number;
  percentage: number;
  wrong_questions: WrongQuestion[];
  question_statuses?: QuestionStatus[];
  timeSpent?: number; // in seconds
}

export interface WrongQuestion {
  question: string;
  options: QuestionOption[];
  user_answer: string | string[];
  correct_answer: string | string[];
  is_multiple: boolean;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function selectRandomQuestions(questions: Question[], count: number): Question[] {
  if (questions.length <= count) {
    return [...questions];
  }
  return shuffleArray(questions).slice(0, count);
}

export function calculateScore(
  selectedQuestions: Question[],
  userAnswers: Record<number, string | string[]>
): { correct: number; wrong: WrongQuestion[] } {
  let correct = 0;
  const wrong: WrongQuestion[] = [];

  selectedQuestions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    const correctAnswer = question.correct_answer;
    const isMultiple = Array.isArray(correctAnswer);

    let isCorrect = false;

    if (isMultiple) {
      const userSet = new Set(Array.isArray(userAnswer) ? userAnswer : []);
      const correctSet = new Set(correctAnswer);
      isCorrect = userSet.size === correctSet.size && [...userSet].every(item => correctSet.has(item));
    } else {
      isCorrect = userAnswer === correctAnswer;
    }

    if (isCorrect) {
      correct++;
    } else {
      wrong.push({
        question: question.question,
        options: question.options,
        user_answer: userAnswer || '',
        correct_answer: correctAnswer,
        is_multiple: isMultiple,
      });
    }
  });

  return { correct, wrong };
}

export function generateOrGetUserId(): string {
  const STORAGE_KEY = 'aws_quiz_user_id';
  
  // Check localStorage
  if (typeof window !== 'undefined') {
    const existingId = localStorage.getItem(STORAGE_KEY);
    if (existingId) {
      return existingId;
    }
  }
  
  // Generate new ID
  const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, newId);
  }
  
  return newId;
}

export function generateResult(
  name: string,
  score: number,
  total: number,
  wrongQuestions: WrongQuestion[],
  userId: string,
  questionStatuses?: QuestionStatus[],
  timeSpent?: number
): QuizResult {
  return {
    id: `${userId}_${Date.now()}`,
    userId,
    name,
    date: new Date().toISOString().split('T')[0],
    score,
    total,
    percentage: Math.round((score / total) * 100),
    wrong_questions: wrongQuestions,
    question_statuses: questionStatuses,
    timeSpent,
  };
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function parseMarkdown(content: string): Question[] {
  const questions: Question[] = [];
  const questionBlocks = content.split(/\n(?=\d+\.)/);

  for (const block of questionBlocks) {
    if (!block.trim()) continue;

    const lines = block.trim().split('\n');
    const questionLine = lines[0];

    const questionMatch = questionLine.match(/^\d+\.\s*(.*)/);
    if (!questionMatch) continue;

    const questionText = questionMatch[1];
    const options: QuestionOption[] = [];
    let answerLine = '';

    let inAnswerSection = false;

    for (const line of lines.slice(1)) {
      const trimmedLine = line.trim();

      if (trimmedLine.includes('<details') || trimmedLine.includes('Answer</summary>')) {
        inAnswerSection = true;
        continue;
      } else if (trimmedLine.includes('</details>')) {
        inAnswerSection = false;
        continue;
      }

      if (!inAnswerSection && trimmedLine.startsWith('- ')) {
        const optionMatch = trimmedLine.match(/- ([A-E])\.\s*(.*)/);
        if (optionMatch) {
          options.push({
            letter: optionMatch[1],
            text: optionMatch[2],
          });
        }
      } else if (inAnswerSection && trimmedLine.includes('Correct answer:')) {
        const answerMatch = trimmedLine.match(/Correct answer:\s*([A-E,\s]+)/);
        if (answerMatch) {
          const answerText = answerMatch[1].replace(/\s/g, '');
          const answerLetters = answerText.split(',').filter(l => l);
          answerLine = answerLetters.length === 1 ? answerLetters[0] : JSON.stringify(answerLetters);
        }
      }
    }

    if (questionText && options.length >= 2 && answerLine) {
      let correctAnswer: string | string[] = answerLine;
      try {
        if (answerLine.startsWith('[')) {
          correctAnswer = JSON.parse(answerLine);
        }
      } catch {
        correctAnswer = answerLine;
      }

      questions.push({
        question: questionText,
        options,
        correct_answer: correctAnswer,
      });
    }
  }

  return questions;
}
