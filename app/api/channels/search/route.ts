import { youtubeService } from '@/lib/services/youtube';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return Response.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`[API /channels/search] Received query: "${query}"`);
    const channels = await youtubeService.searchChannels(query);
    console.log(`[API /channels/search] Returning ${channels.length} channels for "${query}"`);
    return Response.json({ channels });
  } catch (error) {
    console.error('[API /channels/search] Error:', error);
    return Response.json(
      { error: 'Failed to search channels' },
      { status: 500 }
    );
  }
}
