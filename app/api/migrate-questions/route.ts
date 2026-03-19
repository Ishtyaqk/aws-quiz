import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Read the old questions from file
    const filePath = join(process.cwd(), 'public', 'data', 'questions_db.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const questions = JSON.parse(fileContent);

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found in file' },
        { status: 400 }
      );
    }

    // Check if version 1 already exists
    const { data: existing } = await supabase
      .from('questions_versions')
      .select('id')
      .eq('version_number', 1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { 
          error: 'Version 1 already exists in Supabase',
          message: 'Questions have already been migrated'
        },
        { status: 400 }
      );
    }

    // Insert version 1 into Supabase
    const { data: versionData, error: versionError } = await supabase
      .from('questions_versions')
      .insert([
        {
          version_number: 1,
          questions: questions,
          uploaded_by: 'migration',
          md_file_path: 'questions_db.json',
          total_questions: questions.length,
          notes: 'Initial migration from file system',
        },
      ])
      .select('id, version_number, total_questions');

    if (versionError) {
      console.error('Error migrating questions:', versionError);
      throw new Error('Failed to migrate questions to Supabase');
    }

    // Log to audit trail
    await supabase.from('upload_audit_log').insert([
      {
        uploaded_by: 'migration',
        file_name: 'questions_db.json',
        new_questions_added: questions.length,
        total_questions_after: questions.length,
        version_number: 1,
        status: 'success',
        file_path: 'questions_db.json',
      },
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${questions.length} questions to Supabase as version 1`,
      migrationDetails: versionData?.[0],
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
