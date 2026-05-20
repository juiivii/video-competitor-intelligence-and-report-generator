import { youtubeService } from '@/lib/services/youtube';
import { analyticsEngine } from '@/lib/services/analytics';
import { CompanyChannelData } from '@/lib/types';

interface AnalyzeRequest {
  mainCompany: string;
  competitors: {
    name: string;
    channelId: string;
  }[];
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

    // Generate full analysis report using the analytics engine
    // (includes analytics, strengths, weaknesses, opportunities for every competitor)
    const report = analyticsEngine.generateAnalysisReport(mainCompany, competitorDataList);

    // Add cache-busting key
    const reportWithTimestamp = {
      ...report,
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
