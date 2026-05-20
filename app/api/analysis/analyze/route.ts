import { youtubeService } from '@/lib/services/youtube';
import { CompanyChannelData } from '@/lib/types';

interface AnalyzeRequest {
  mainCompany: string;
  competitors: {
    name: string;
    channelId: string;
  }[];
}

interface CompetitorAnalysis {
  company: string;
  subscriberCount: number;
  totalViews: number;
  totalVideos: number;
  overallScore: number;
}

interface AnalysisReport {
  timestamp?: string;
  generatedAt?: string;
  summary: {
    topPerformer: string;
    averageScore: number;
  };
  competitors: CompetitorAnalysis[];
}

function generateAnalysisReport(
  mainCompany: string,
  competitorDataList: CompanyChannelData[]
): AnalysisReport {
  const competitors: CompetitorAnalysis[] = competitorDataList.map((data) => {
    const totalViews = data.videos.reduce((sum, v) => sum + v.viewCount, 0);
    const subscriberCount = data.channel.subscriberCount || 0;
    const videoCount = data.channel.videoCount || 0;

    // Calculate score: 40% subscribers, 40% views, 20% video count
    const subscriberScore = Math.min((subscriberCount / 10000000) * 40, 40);
    const viewScore = Math.min((totalViews / 1000000000) * 40, 40);
    const videoScore = Math.min((videoCount / 5000) * 20, 20);
    const overallScore = subscriberScore + viewScore + videoScore;

    return {
      company: data.company,
      subscriberCount,
      totalViews: totalViews,
      totalVideos: videoCount,
      overallScore: Math.min(overallScore, 100),
    };
  });

  // Find top performer
  const topPerformer = competitors.reduce((prev, current) =>
    current.overallScore > prev.overallScore ? current : prev
  );

  const averageScore = competitors.reduce((sum, c) => sum + c.overallScore, 0) / competitors.length;

  return {
    timestamp: new Date().toISOString(),
    summary: {
      topPerformer: topPerformer.company,
      averageScore,
    },
    competitors,
  };
}

export async function POST(request: Request) {
  try {
    const { mainCompany, competitors }: AnalyzeRequest = await request.json();

    console.log('[API /analysis/analyze] Received request:', { mainCompany, competitorCount: competitors?.length });

    if (!mainCompany || !competitors || competitors.length === 0) {
      console.error('[API /analysis/analyze] Invalid request parameters');
      return Response.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Fetch data for all companies (main company + competitors)
    const competitorDataList: CompanyChannelData[] = [];

    for (const competitor of competitors) {
      console.log(`[API /analysis/analyze] Fetching data for: ${competitor.name} (${competitor.channelId})`);
      const data = await youtubeService.getChannelData(
        competitor.channelId,
        competitor.name
      );
      if (data) {
        competitorDataList.push(data);
        console.log(`[API /analysis/analyze] Successfully fetched data for ${competitor.name}`);
      } else {
        console.warn(`[API /analysis/analyze] Failed to fetch data for ${competitor.name}`);
      }
    }

    if (competitorDataList.length === 0) {
      console.error('[API /analysis/analyze] Failed to fetch data for any companies');
      return Response.json(
        { error: 'Failed to fetch data for any companies' },
        { status: 500 }
      );
    }

    // Generate analysis report with timestamp to prevent caching
    const report = generateAnalysisReport(mainCompany, competitorDataList);

    // Add timestamp to prevent caching issues
    const reportWithTimestamp = {
      ...report,
      generatedAt: new Date().toISOString(),
      cacheKey: `report_${Date.now()}_${Math.random()}`,
    };

    console.log('[API /analysis/analyze] Returning report successfully');
    return Response.json(reportWithTimestamp, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[API /analysis/analyze] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze competitors' },
      { status: 500 }
    );
  }
}
