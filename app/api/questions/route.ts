import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

const DATA_DIR = join(process.cwd(), 'public', 'data');
const QUESTIONS_FILE = join(DATA_DIR, 'questions_db.json');

async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

export async function GET() {
  try {
    await ensureDataDir();
    const data = await readFile(QUESTIONS_FILE, 'utf-8');
    const questions = JSON.parse(data);
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error reading questions:', error);
    return NextResponse.json([], {
      status: 200,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDataDir();
    const questions = await request.json();

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Questions must be an array' },
        { status: 400 }
      );
    }

    await writeFile(QUESTIONS_FILE, JSON.stringify(questions, null, 2), 'utf-8');
    return NextResponse.json({ success: true, count: questions.length });
  } catch (error) {
    console.error('Error saving questions:', error);
    return NextResponse.json(
      { error: 'Failed to save questions' },
      { status: 500 }
    );
  }
}
