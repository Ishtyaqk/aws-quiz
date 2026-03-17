import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    let query = supabase
      .from('quiz_results')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by userId if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: results, error } = await query;

    if (error) {
      console.error('Error fetching results:', error);
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }

    return NextResponse.json(results || []);
  } catch (error) {
    console.error('Error reading results:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const result = await request.json();

    if (!result.name || result.score === undefined || result.total === undefined || !result.userId) {
      return NextResponse.json(
        { error: 'Invalid result format' },
        { status: 400 }
      );
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('quiz_results')
      .insert([
        {
          user_id: result.userId,
          name: result.name,
          score: result.score,
          total: result.total,
          percentage: result.percentage,
          wrong_questions: result.wrong_questions,
          question_statuses: result.question_statuses,
          time_spent: result.timeSpent,
        },
      ])
      .select();

    if (error) {
      console.error('Error saving result:', error);
      return NextResponse.json(
        { error: 'Failed to save result' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data?.[0]?.id });
  } catch (error) {
    console.error('Error saving result:', error);
    return NextResponse.json(
      { error: 'Failed to save result' },
      { status: 500 }
    );
  }
}
