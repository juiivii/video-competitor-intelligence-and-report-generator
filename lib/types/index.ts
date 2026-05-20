// Video & Channel Types
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  thumbnailUrl: string;
  tags: string[];
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  publishedAt: string;
  thumbnailUrl: string;
}

export interface CompanyChannelData {
  company: string;
  channel: YouTubeChannel;
  videos: YouTubeVideo[];
  fetchedAt: string;
}

// Analytics Types
export interface VideoAnalytics {
  totalVideos: number;
  averageViews: number;
  averageLikes: number;
  averageComments: number;
  engagementRate: number;
  uploadFrequency: number;
  shortsPercentage: number;
  avgDuration: string;
  topTopics: { topic: string; frequency: number }[];
  viralVideos: YouTubeVideo[];
  contentDiversity: number;
  uploadConsistency: number;
  videoPerformanceScore: number;
}

export interface CompetitorAnalysis {
  company: string;
  channelId: string;
  channelTitle: string;
  subscriberCount: number;
  totalViews: number;
  totalVideos: number;
  analytics: VideoAnalytics;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  recommendations: string[];
  overallScore: number;
  rank: number;
}

export interface AnalysisReport {
  mainCompany: string;
  competitors: CompetitorAnalysis[];
  generatedAt: string;
  summary: {
    topPerformer: string;
    avgEngagement: number;
    contentGap: string;
    recommendation: string;
  };
}

// API Response Types
export interface ChannelSearchResult {
  id: string;
  title: string;
  description: string;
  subscribers?: number;
  verified?: boolean;
  score?: number;
}

export interface ReportState {
  status: 'idle' | 'loading' | 'channel-discovery' | 'fetching-data' | 'analyzing' | 'complete' | 'error';
  mainCompany: string;
  competitors: string[];
  selectedChannels: Record<string, string>;
  data?: AnalysisReport;
  error?: string;
  progress: number;
}
