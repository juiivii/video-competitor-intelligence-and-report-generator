import axios from 'axios';
import {
  YouTubeVideo,
  YouTubeChannel,
  ChannelSearchResult,
  CompanyChannelData,
} from '@/lib/types';

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

if (!API_KEY) {
  console.error('NEXT_PUBLIC_YOUTUBE_API_KEY is not set');
}

interface VideoListResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      thumbnails: { high?: { url: string } };
      tags?: string[];
    };
    contentDetails?: { duration: string };
    statistics: {
      viewCount: string;
      likeCount?: string;
      commentCount?: string;
    };
  }>;
}

interface ChannelResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      thumbnails: { high?: { url: string } };
      publishedAt: string;
    };
    statistics: {
      subscriberCount: string;
      viewCount: string;
      videoCount: string;
    };
  }>;
}

interface SearchResponse {
  items: Array<{
    id: { channelId: string };
    snippet: {
      title: string;
      description: string;
      thumbnails: { high?: { url: string } };
    };
  }>;
}

class YouTubeService {
  async searchChannels(query: string): Promise<ChannelSearchResult[]> {
    try {
      console.log(`[YouTube] Searching for channels: "${query}"`);
      const response = await axios.get(`${BASE_URL}/search`, {
        params: {
          key: API_KEY,
          q: query,
          type: 'channel',
          part: 'snippet',
          maxResults: 10,
          order: 'relevance',
        },
      });

      const data = response.data as SearchResponse;
      console.log(`[YouTube] Search returned ${data.items?.length || 0} results for "${query}"`);
      
      const channelIds = data.items?.map((item) => item.id.channelId) || [];

      if (channelIds.length === 0) {
        console.warn(`[YouTube] No channels found for query: "${query}"`);
        return [];
      }

      const channelDetails = await this.getChannelDetails(channelIds);
      return channelDetails;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`[YouTube] Error searching channels for "${query}":`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      } else {
        console.error(`[YouTube] Error searching channels for "${query}":`, error);
      }
      return [];
    }
  }

  async getChannelDetails(
    channelIds: string | string[]
  ): Promise<ChannelSearchResult[]> {
    try {
      const ids = Array.isArray(channelIds) ? channelIds.join(',') : channelIds;

      const response = await axios.get(`${BASE_URL}/channels`, {
        params: {
          key: API_KEY,
          id: ids,
          part: 'snippet,statistics',
          maxResults: 50,
        },
      });

      const data = response.data as ChannelResponse;
      return data.items.map((channel) => ({
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        subscribers: parseInt(channel.statistics.subscriberCount, 10),
        score: this.calculateChannelScore(channel),
      }));
    } catch (error) {
      console.error('Error getting channel details:', error);
      return [];
    }
  }

  async getChannelData(
    channelId: string,
    companyName: string
  ): Promise<CompanyChannelData | null> {
    try {
      console.log(`[YouTube] getChannelData: Fetching channel info for ${companyName} (${channelId})`);
      const channel = await this.getChannelInfo(channelId);
      if (!channel) {
        console.warn(`[YouTube] getChannelData: No channel info returned for ${companyName}`);
        return null;
      }

      console.log(`[YouTube] getChannelData: Fetching videos for ${companyName}`);
      const videos = await this.getChannelVideos(channelId);
      console.log(`[YouTube] getChannelData: Got ${videos.length} videos for ${companyName}`);

      return {
        company: companyName,
        channel,
        videos,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[YouTube] getChannelData: Error for ${companyName}:`, error);
      return null;
    }
  }

  private async getChannelInfo(channelId: string): Promise<YouTubeChannel | null> {
    try {
      console.log(`[YouTube] getChannelInfo: Fetching info for channel ${channelId}`);
      const response = await axios.get(`${BASE_URL}/channels`, {
        params: {
          key: API_KEY,
          id: channelId,
          part: 'snippet,statistics',
        },
      });

      const data = response.data as ChannelResponse;
      if (data.items.length === 0) {
        console.warn(`[YouTube] getChannelInfo: No channel found for ${channelId}`);
        return null;
      }

      const channel = data.items[0];
      console.log(`[YouTube] getChannelInfo: Got channel ${channel.snippet.title}`);
      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        subscriberCount: parseInt(channel.statistics.subscriberCount, 10) || 0,
        viewCount: parseInt(channel.statistics.viewCount, 10) || 0,
        videoCount: parseInt(channel.statistics.videoCount, 10) || 0,
        publishedAt: channel.snippet.publishedAt,
        thumbnailUrl: channel.snippet.thumbnails.high?.url || '',
      };
    } catch (error) {
      console.error(`[YouTube] getChannelInfo: Error for ${channelId}:`, error);
      return null;
    }
  }

  async getChannelVideos(
    channelId: string,
    maxResults: number = 50
  ): Promise<YouTubeVideo[]> {
    try {
      const uploadPlaylistId = await this.getUploadPlaylistId(channelId);
      if (!uploadPlaylistId) return [];

      const videos: YouTubeVideo[] = [];
      let pageToken: string | undefined;
      let itemsCollected = 0;

      while (itemsCollected < maxResults && (pageToken || itemsCollected === 0)) {
        const response = await axios.get(`${BASE_URL}/playlistItems`, {
          params: {
            key: API_KEY,
            playlistId: uploadPlaylistId,
            part: 'snippet,contentDetails',
            maxResults: Math.min(50, maxResults - itemsCollected),
            pageToken: pageToken || undefined,
          },
        });

        const items = response.data.items || [];
        if (items.length === 0) break;

        const videoIds = items
          .map((item: any) => item.contentDetails?.videoId)
          .filter(Boolean);

        if (videoIds.length > 0) {
          const videoDetails = await this.getVideoDetails(videoIds);
          videos.push(...videoDetails);
          itemsCollected += videoDetails.length;
        }

        pageToken = response.data.nextPageToken;
        if (!pageToken) break;
      }

      return videos.slice(0, maxResults);
    } catch (error) {
      console.error('Error getting channel videos:', error);
      return [];
    }
  }

  private async getUploadPlaylistId(channelId: string): Promise<string | null> {
    try {
      const response = await axios.get(`${BASE_URL}/channels`, {
        params: {
          key: API_KEY,
          id: channelId,
          part: 'contentDetails',
        },
      });

      const data = response.data as any;
      return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
    } catch (error) {
      console.error('Error getting upload playlist ID:', error);
      return null;
    }
  }

  private async getVideoDetails(videoIds: string[]): Promise<YouTubeVideo[]> {
    try {
      const response = await axios.get(`${BASE_URL}/videos`, {
        params: {
          key: API_KEY,
          id: videoIds.join(','),
          part: 'snippet,statistics,contentDetails',
        },
      });

      const data = response.data as VideoListResponse;
      return data.items.map((video) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        viewCount: parseInt(video.statistics.viewCount, 10) || 0,
        likeCount: parseInt(video.statistics.likeCount || '0', 10),
        commentCount: parseInt(video.statistics.commentCount || '0', 10),
        duration: video.contentDetails?.duration || 'PT0S',
        thumbnailUrl: video.snippet.thumbnails.high?.url || '',
        tags: video.snippet.tags || [],
      }));
    } catch (error) {
      console.error('Error getting video details:', error);
      return [];
    }
  }

  private calculateChannelScore(channel: any): number {
    const subscribers = parseInt(channel.statistics.subscriberCount, 10);
    const views = parseInt(channel.statistics.viewCount, 10);
    const videos = parseInt(channel.statistics.videoCount, 10);

    // Weighted score: subscribers (40%), views (40%), videos (20%)
    const subscriberScore = Math.min(subscribers / 1000000, 1) * 40;
    const viewScore = Math.min(views / 100000000, 1) * 40;
    const videoScore = Math.min(videos / 5000, 1) * 20;

    return subscriberScore + viewScore + videoScore;
  }

  parseIsoDuration(duration: string): number {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const match = duration.match(regex);
    const hours = parseInt(match?.[1] || '0', 10);
    const minutes = parseInt(match?.[2] || '0', 10);
    const seconds = parseInt(match?.[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }
}

export const youtubeService = new YouTubeService();
