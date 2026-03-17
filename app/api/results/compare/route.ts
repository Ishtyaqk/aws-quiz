import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ComparisonStats {
  userStats: {
    totalTests: number;
    passRate: number;
    averageScore: number;
    bestScore: number;
    recentTrend: 'improving' | 'declining' | 'stable';
  };
  globalStats: {
    totalTests: number;
    averageScore: number;
    passRate: number;
  };
  userPercentile: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Fetch all results
    const { data: allResults, error: allError } = await supabase
      .from('quiz_results')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch user results
    const { data: userResults, error: userError } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (allError || userError) {
      console.error('Error fetching results:', allError || userError);
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      );
    }

    const results = userResults || [];
    const allData = allResults || [];

    // Calculate user stats
    const passedTests = results.filter(r => r.percentage >= 70);
    const totalTests = results.length;
    const passRate = totalTests > 0 ? Math.round((passedTests.length / totalTests) * 100) : 0;
    const averageScore = totalTests > 0
      ? Math.round(results.reduce((sum: number, r: any) => sum + r.percentage, 0) / totalTests)
      : 0;
    const bestScore = totalTests > 0
      ? Math.max(...results.map((r: any) => r.percentage))
      : 0;

    // Calculate trend
    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (results.length >= 10) {
      const recent = results.slice(0, 5);
      const previous = results.slice(5, 10);
      const recentAvg = recent.reduce((sum: number, r: any) => sum + r.percentage, 0) / 5;
      const previousAvg = previous.reduce((sum: number, r: any) => sum + r.percentage, 0) / 5;
      if (recentAvg > previousAvg + 5) {
        recentTrend = 'improving';
      } else if (recentAvg < previousAvg - 5) {
        recentTrend = 'declining';
      }
    } else if (results.length >= 2) {
      const recentAvg = results[0].percentage;
      const previousAvg = results[1].percentage;
      if (recentAvg > previousAvg + 5) {
        recentTrend = 'improving';
      } else if (recentAvg < previousAvg - 5) {
        recentTrend = 'declining';
      }
    }

    // Calculate global stats
    const globalPassedTests = allData.filter((r: any) => r.percentage >= 70);
    const globalTotalTests = allData.length;
    const globalPassRate = globalTotalTests > 0
      ? Math.round((globalPassedTests.length / globalTotalTests) * 100)
      : 0;
    const globalAverageScore = globalTotalTests > 0
      ? Math.round(allData.reduce((sum: number, r: any) => sum + r.percentage, 0) / globalTotalTests)
      : 0;

    // Calculate percentile
    const betterScores = allData.filter((r: any) => r.percentage > averageScore).length;
    const userPercentile = globalTotalTests > 0
      ? Math.round(((globalTotalTests - betterScores) / globalTotalTests) * 100)
      : 0;

    const stats: ComparisonStats = {
      userStats: {
        totalTests,
        passRate,
        averageScore,
        bestScore,
        recentTrend,
      },
      globalStats: {
        totalTests: globalTotalTests,
        averageScore: globalAverageScore,
        passRate: globalPassRate,
      },
      userPercentile,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error calculating comparison stats:', error);
    return NextResponse.json(
      { error: 'Failed to calculate stats' },
      { status: 500 }
    );
  }
}
