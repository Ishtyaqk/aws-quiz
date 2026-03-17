import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

const RESULTS_DIR = join(process.cwd(), 'public', 'results');

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
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const files = await readdir(RESULTS_DIR);
    const jsonFiles = files.filter(f => f.startsWith('test_') && f.endsWith('.json'));

    const allResults = [];
    const userResults = [];

    for (const file of jsonFiles) {
      try {
        const content = await readFile(join(RESULTS_DIR, file), 'utf-8');
        const result = JSON.parse(content);
        allResults.push(result);

        if (result.userId === userId) {
          userResults.push(result);
        }
      } catch (error) {
        console.error(`Error reading result file ${file}:`, error);
      }
    }

    // Sort by date descending
    userResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    allResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate user stats
    const passedTests = userResults.filter(r => r.percentage >= 70);
    const totalTests = userResults.length;
    const passRate = totalTests > 0 ? Math.round((passedTests.length / totalTests) * 100) : 0;
    const averageScore = totalTests > 0
      ? Math.round(userResults.reduce((sum, r) => sum + r.percentage, 0) / totalTests)
      : 0;
    const bestScore = totalTests > 0
      ? Math.max(...userResults.map(r => r.percentage))
      : 0;

    // Calculate trend (comparing last 5 to previous 5)
    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (userResults.length >= 10) {
      const recent = userResults.slice(0, 5);
      const previous = userResults.slice(5, 10);
      const recentAvg = recent.reduce((sum, r) => sum + r.percentage, 0) / 5;
      const previousAvg = previous.reduce((sum, r) => sum + r.percentage, 0) / 5;
      if (recentAvg > previousAvg + 5) {
        recentTrend = 'improving';
      } else if (recentAvg < previousAvg - 5) {
        recentTrend = 'declining';
      }
    } else if (userResults.length >= 2) {
      const recentAvg = userResults[0].percentage;
      const previousAvg = userResults[1].percentage;
      if (recentAvg > previousAvg + 5) {
        recentTrend = 'improving';
      } else if (recentAvg < previousAvg - 5) {
        recentTrend = 'declining';
      }
    }

    // Calculate global stats
    const globalPassedTests = allResults.filter(r => r.percentage >= 70);
    const globalTotalTests = allResults.length;
    const globalPassRate = globalTotalTests > 0
      ? Math.round((globalPassedTests.length / globalTotalTests) * 100)
      : 0;
    const globalAverageScore = globalTotalTests > 0
      ? Math.round(allResults.reduce((sum, r) => sum + r.percentage, 0) / globalTotalTests)
      : 0;

    // Calculate percentile
    const betterScores = allResults.filter(r => r.percentage > averageScore).length;
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
