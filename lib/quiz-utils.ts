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

export interface QuestionOption {
  letter: string;
  text: string;
}

export interface MarkdownParseReport {
  questions: Question[];
  detectedCount: number;
  parsedCount: number;
  skippedCount: number;
}

function normalizeMarkdownContent(content: string): string {
  return content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function splitQuestionBlocks(content: string): string[] {
  const normalized = normalizeMarkdownContent(content);
  const starts: number[] = [];
  const pattern = /(?:^|\n)(\d+\.\s+)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(normalized)) !== null) {
    starts.push(match.index + (match[0].startsWith('\n') ? 1 : 0));
  }

  if (starts.length === 0) return [];

  const blocks: string[] = [];
  for (let i = 0; i < starts.length; i++) {
    blocks.push(normalized.slice(starts[i], starts[i + 1]).trim());
  }
  return blocks;
}

function parseAnswerLetters(raw: string): string[] {
  const text = raw.replace(/\*\*/g, '').split(/\bExplanation\b/i)[0].trim();
  const parts = text.split(/[,/&]|(?:\s+and\s+)/i).map(part => part.trim()).filter(Boolean);
  const fromParts = parts
    .map(part => part.match(/^([A-F])\.?$/i)?.[1]?.toUpperCase())
    .filter((letter): letter is string => Boolean(letter));

  if (fromParts.length > 0) return fromParts;

  const compact = text.replace(/\s/g, '');
  if (/^[A-F]+$/i.test(compact)) {
    return compact.toUpperCase().split('');
  }

  return [];
}

function extractCorrectAnswer(lines: string[]): string | string[] | null {
  for (const line of lines) {
    const trimmed = line.trim();
    let answerText: string | null = null;

    const standardMatch = trimmed.match(/(?:\*\*)?(?:correct\s+answer|answer)(?:\*\*)?\s*:\s*(.+)$/i);
    if (standardMatch) {
      answerText = standardMatch[1];
    } else {
      const typoMatch = trimmed.match(/^Correct\s+(?:Answer\s*:\s*)?([A-F][A-F,\s]*)$/i);
      if (typoMatch) {
        answerText = typoMatch[1];
      }
    }

    if (!answerText) continue;

    const letters = parseAnswerLetters(answerText);
    if (letters.length === 0) continue;
    return letters.length === 1 ? letters[0] : letters;
  }

  return null;
}

function extractOptions(lines: string[]): QuestionOption[] {
  const options: QuestionOption[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(?:correct\s+answer|answer)\s*:/i.test(trimmed) || /^Correct\s/i.test(trimmed)) break;
    if (/<details|<\/details>|^<summary|^Explanation:/i.test(trimmed)) continue;

    const match = trimmed.match(/^[-*•]?\s*(?:\*\*)?([A-F])[\.\):]\s*(?:\*\*)?(.*)$/i);
    if (match) {
      options.push({
        letter: match[1].toUpperCase(),
        text: match[2].replace(/\*\*/g, '').trim(),
      });
    }
  }

  return options;
}

function parseQuestionBlock(block: string): Question | null {
  const lines = block.trim().split('\n');
  if (lines.length === 0) return null;

  const questionMatch = lines[0].match(/^\d+\.\s*(.*)/);
  if (!questionMatch) return null;

  const questionText = questionMatch[1]
    .replace(/\*\*/g, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const bodyLines = lines.slice(1);
  const options = extractOptions(bodyLines);
  const correctAnswer = extractCorrectAnswer(bodyLines);

  if (!questionText || options.length < 2 || !correctAnswer) {
    return null;
  }

  return {
    question: questionText,
    options,
    correct_answer: correctAnswer,
  };
}

export function parseMarkdownWithReport(content: string): MarkdownParseReport {
  const blocks = splitQuestionBlocks(content);
  const questions: Question[] = [];

  for (const block of blocks) {
    const question = parseQuestionBlock(block);
    if (question) {
      questions.push(question);
    }
  }

  return {
    questions,
    detectedCount: blocks.length,
    parsedCount: questions.length,
    skippedCount: blocks.length - questions.length,
  };
}

export function parseMarkdown(content: string): Question[] {
  return parseMarkdownWithReport(content).questions;
}
