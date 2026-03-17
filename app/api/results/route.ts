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

export async function GET(request: NextRequest) {
  try {
    await ensureResultsDir();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    const files = await readdir(RESULTS_DIR);
    const jsonFiles = files.filter(f => f.startsWith('test_') && f.endsWith('.json'));

    const results = [];
    for (const file of jsonFiles) {
      try {
        const content = await readFile(join(RESULTS_DIR, file), 'utf-8');
        const result = JSON.parse(content);
        
        // Filter by userId if provided
        if (userId && result.userId !== userId) {
          continue;
        }
        
        results.push(result);
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

    if (!result.name || result.score === undefined || result.total === undefined || !result.userId) {
      return NextResponse.json(
        { error: 'Invalid result format' },
        { status: 400 }
      );
    }

    // Generate filename with userId and timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
      now.getTime().toString().slice(-6);
    const filename = `test_${result.userId}_${timestamp}.json`;

    await writeFile(
      join(RESULTS_DIR, filename),
      JSON.stringify(result, null, 2),
      'utf-8'
    );

    return NextResponse.json({ success: true, filename, id: result.id });
  } catch (error) {
    console.error('Error saving result:', error);
    return NextResponse.json(
      { error: 'Failed to save result' },
      { status: 500 }
    );
  }
}
