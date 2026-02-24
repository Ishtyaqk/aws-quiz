import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

const RESULTS_DIR = join(process.cwd(), 'public', 'results');

async function ensureResultsDir() {
  try {
    await mkdir(RESULTS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

export async function GET() {
  try {
    await ensureResultsDir();
    const files = await readdir(RESULTS_DIR);
    const jsonFiles = files.filter(f => f.startsWith('test_') && f.endsWith('.json'));

    const results = [];
    for (const file of jsonFiles) {
      try {
        const content = await readFile(join(RESULTS_DIR, file), 'utf-8');
        results.push(JSON.parse(content));
      } catch (error) {
        console.error(`Error reading result file ${file}:`, error);
      }
    }

    // Sort by date descending
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error reading results:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureResultsDir();
    const result = await request.json();

    if (!result.name || result.score === undefined || result.total === undefined) {
      return NextResponse.json(
        { error: 'Invalid result format' },
        { status: 400 }
      );
    }

    // Generate filename from date
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
      now.getTime().toString().slice(-6);
    const filename = `test_${timestamp}.json`;

    await writeFile(
      join(RESULTS_DIR, filename),
      JSON.stringify(result, null, 2),
      'utf-8'
    );

    return NextResponse.json({ success: true, filename });
  } catch (error) {
    console.error('Error saving result:', error);
    return NextResponse.json(
      { error: 'Failed to save result' },
      { status: 500 }
    );
  }
}
