import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

async function getQuestionsFromFile() {
  try {
    const filePath = join(process.cwd(), 'public', 'data', 'questions_db.json');
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading questions file:', error);
    return [];
  }
}

async function migrateQuestionsToSupabase(supabase: any, questions: any[]) {
  try {
    if (questions.length === 0) return false;

    // Check if version 1 already exists
    const { data: existing } = await supabase
      .from('questions_versions')
      .select('id')
      .eq('version_number', 1);

    if (existing && existing.length > 0) {
      console.log('Questions already migrated to Supabase');
      return false;
    }

    // Insert as version 1
    const { error } = await supabase.from('questions_versions').insert([
      {
        version_number: 1,
        questions,
        uploaded_by: 'system',
        md_file_path: 'initial_migration',
        total_questions: questions.length,
        notes: 'Automatic migration from questions_db.json',
      },
    ]);

    if (error) {
      console.error('Migration error:', error);
      return false;
    }

    // Log migration
    await supabase.from('upload_audit_log').insert([
      {
        uploaded_by: 'system',
        file_name: 'initial_migration',
        new_questions_added: questions.length,
        total_questions_after: questions.length,
        version_number: 1,
        status: 'success',
        file_path: 'questions_db.json',
      },
    ]);

    console.log(`Successfully migrated ${questions.length} questions to Supabase`);
    return true;
  } catch (error) {
    console.error('Failed to migrate questions:', error);
    return false;
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the latest version of questions
    const { data, error } = await supabase
      .from('questions_versions')
      .select('questions')
      .order('version_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json([], { status: 200 });
    }

    // If no data in Supabase, try to migrate from file
    if (!data || data.length === 0) {
      console.log('No questions in Supabase, attempting automatic migration...');
      const fileQuestions = await getQuestionsFromFile();

      if (fileQuestions.length > 0) {
        const migrated = await migrateQuestionsToSupabase(supabase, fileQuestions);
        if (migrated) {
          return NextResponse.json(fileQuestions);
        }
      }

      return NextResponse.json([], { status: 200 });
    }

    const questions = data[0]?.questions || [];
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error reading questions:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { questions, uploadedBy = 'anonymous', fileName = 'upload', notes = '' } = await request.json();

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Questions must be an array' },
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Cannot upload empty question set' },
        { status: 400 }
      );
    }

    // Get current questions to merge
    const { data: latestVersion } = await supabase
      .from('questions_versions')
      .select('questions, version_number')
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const currentQuestions = latestVersion?.questions || [];
    const newVersionNumber = (latestVersion?.version_number || 0) + 1;
    const newQuestionsAdded = questions.length;
    const totalQuestionsAfter = currentQuestions.length + questions.length;

    // Merge old questions with new ones
    const mergedQuestions = [...currentQuestions, ...questions];

    // Save to versions table
    const { data: versionData, error: versionError } = await supabase
      .from('questions_versions')
      .insert([
        {
          version_number: newVersionNumber,
          questions: mergedQuestions,
          uploaded_by: uploadedBy,
          md_file_path: fileName,
          total_questions: mergedQuestions.length,
          notes,
        },
      ])
      .select('id, version_number');

    if (versionError) {
      console.error('Error saving questions version:', versionError);
      throw new Error('Failed to save questions');
    }

    // Log to audit trail
    const { error: auditError } = await supabase
      .from('upload_audit_log')
      .insert([
        {
          uploaded_by: uploadedBy,
          file_name: fileName,
          new_questions_added: newQuestionsAdded,
          total_questions_after: totalQuestionsAfter,
          version_number: newVersionNumber,
          status: 'success',
          file_path: fileName,
        },
      ]);

    if (auditError) {
      console.error('Error logging audit:', auditError);
      // Don't fail the upload if audit logging fails
    }

    return NextResponse.json({
      success: true,
      count: newQuestionsAdded,
      totalQuestions: totalQuestionsAfter,
      newVersion: newVersionNumber,
      merged: true,
      previousCount: currentQuestions.length,
    });
  } catch (error) {
    console.error('Error saving questions:', error);

    // Log failed upload to audit trail
    const supabase = await createClient();
    await supabase.from('upload_audit_log').insert([
      {
        uploaded_by: 'system',
        file_name: 'unknown',
        new_questions_added: 0,
        total_questions_after: 0,
        version_number: 0,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      },
    ]);

    return NextResponse.json(
      { error: 'Failed to save questions' },
      { status: 500 }
    );
  }
}
