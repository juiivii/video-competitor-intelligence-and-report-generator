import {
  YouTubeVideo,
  YouTubeChannel,
  VideoAnalytics,
  CompetitorAnalysis,
  CompanyChannelData,
  AnalysisReport,
} from '@/lib/types';

class AnalyticsEngine {
  analyzeChannel(channel: YouTubeChannel, videos: YouTubeVideo[]): VideoAnalytics {
    if (videos.length === 0) {
      return this.getEmptyAnalytics();
    }

    const totalVideos = videos.length;
    const averageViews = videos.reduce((sum, v) => sum + v.viewCount, 0) / totalVideos;
    const averageLikes = videos.reduce((sum, v) => sum + (v.likeCount || 0), 0) / totalVideos;
    const averageComments = videos.reduce((sum, v) => sum + (v.commentCount || 0), 0) / totalVideos;

    // Guard against 0 views to avoid NaN/Infinity
    const engagementRate =
      averageViews > 0
        ? Math.round(((averageLikes + averageComments) / averageViews) * 100 * 100) / 100
        : 0;

    const shortVideos = videos.filter((v) => this.isShortVideo(v.duration)).length;
    const shortsPercentage = (shortVideos / totalVideos) * 100;

    const uploadFrequency = this.calculateUploadFrequency(videos);
    const avgDuration = this.calculateAverageDuration(videos);
    const topTopics = this.extractTopTopics(videos);
    const viralVideos = this.identifyViralVideos(videos, averageViews);
    const contentDiversity = this.calculateContentDiversity(videos);
    const uploadConsistency = this.calculateUploadConsistency(videos);
    const videoPerformanceScore = this.calculateVideoPerformanceScore(
      averageViews,
      engagementRate,
      uploadConsistency
    );

    return {
      totalVideos,
      averageViews: Math.round(averageViews),
      averageLikes: Math.round(averageLikes),
      averageComments: Math.round(averageComments),
      engagementRate,
      uploadFrequency,
      shortsPercentage: Math.round(shortsPercentage),
      avgDuration,
      topTopics,
      viralVideos: viralVideos.slice(0, 5),
      contentDiversity: Math.round(contentDiversity * 100) / 100,
      uploadConsistency: Math.round(uploadConsistency * 100) / 100,
      videoPerformanceScore: Math.round(videoPerformanceScore * 100) / 100,
    };
  }

  generateCompetitorAnalysis(
    company: string,
    channel: YouTubeChannel,
    videos: YouTubeVideo[],
    analytics: VideoAnalytics,
    allAnalytics: { [key: string]: VideoAnalytics }
  ): CompetitorAnalysis {
    const strengths = this.identifyStrengths(company, channel, analytics, allAnalytics);
    const weaknesses = this.identifyWeaknesses(company, channel, analytics, allAnalytics);
    const opportunities = this.identifyOpportunities(videos, analytics);
    const threats = this.identifyThreats(analytics, allAnalytics);
    const recommendations = this.generateRecommendations(
      company,
      channel,
      analytics,
      allAnalytics,
      videos
    );

    const overallScore = this.calculateOverallScore(channel, analytics);

    return {
      company,
      channelId: channel.id,
      channelTitle: channel.title,
      subscriberCount: channel.subscriberCount,
      totalViews: channel.viewCount,
      totalVideos: channel.videoCount,
      analytics,
      strengths,
      weaknesses,
      opportunities,
      threats,
      recommendations,
      overallScore,
      rank: 0,
    };
  }

  rankCompetitors(competitors: CompetitorAnalysis[]): CompetitorAnalysis[] {
    const sorted = [...competitors].sort((a, b) => b.overallScore - a.overallScore);
    return sorted.map((comp, index) => ({
      ...comp,
      rank: index + 1,
    }));
  }

  generateAnalysisReport(
    mainCompany: string,
    competitorDataList: CompanyChannelData[]
  ): AnalysisReport {
    const analyses: CompetitorAnalysis[] = [];
    const allAnalytics: { [key: string]: VideoAnalytics } = {};

    // First pass: collect all analytics
    competitorDataList.forEach((data) => {
      const analytics = this.analyzeChannel(data.channel, data.videos);
      allAnalytics[data.company] = analytics;
    });

    // Second pass: generate detailed analysis
    competitorDataList.forEach((data) => {
      const analytics = allAnalytics[data.company];
      const analysis = this.generateCompetitorAnalysis(
        data.company,
        data.channel,
        data.videos,
        analytics,
        allAnalytics
      );
      analyses.push(analysis);
    });

    const rankedCompetitors = this.rankCompetitors(analyses);

    const topPerformer = rankedCompetitors[0];
    const avgEngagement =
      rankedCompetitors.reduce((sum, c) => sum + c.analytics.engagementRate, 0) /
      rankedCompetitors.length;

    const contentGap = this.identifyContentGap(rankedCompetitors);
    const recommendation = this.generateExecutiveSummary(rankedCompetitors);

    return {
      mainCompany,
      competitors: rankedCompetitors,
      generatedAt: new Date().toISOString(),
      summary: {
        topPerformer: topPerformer.company,
        avgEngagement: Math.round(avgEngagement * 100) / 100,
        contentGap,
        recommendation,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // STRENGTHS — uses multi-signal absolute + relative analysis
  // Works even when engagementRate = 0 for all channels
  // ─────────────────────────────────────────────────────────────
  private identifyStrengths(
  company: string,
  channel: YouTubeChannel,
  analytics: VideoAnalytics,
  allAnalytics: { [key: string]: VideoAnalytics }
): string[] {

  const strengths: string[] = [];

  const avgViews = this.getAverageMetric(allAnalytics, 'averageViews');
  const avgEngagement = this.getAverageMetric(allAnalytics, 'engagementRate');
  const avgConsistency = this.getAverageMetric(allAnalytics, 'uploadConsistency');
  const avgFrequency = this.getAverageMetric(allAnalytics, 'uploadFrequency');
  const avgShorts = this.getAverageMetric(allAnalytics, 'shortsPercentage');
  const avgDiversity = this.getAverageMetric(allAnalytics, 'contentDiversity');

  // REACH
  if (avgViews > 0 && analytics.averageViews > avgViews * 1.5) {
    strengths.push(
      `Exceptional per-video reach — averaging ${this.fmt(analytics.averageViews)} views per upload, significantly ahead of the field average (${this.fmt(avgViews)})`
    );
  } else if (avgViews > 0 && analytics.averageViews > avgViews * 1.1) {
    strengths.push(
      `Above-average per-video reach at ${this.fmt(analytics.averageViews)} views — outperforming the field average of ${this.fmt(avgViews)}`
    );
  }

  // SUBSCRIBERS
  if (channel.subscriberCount >= 100_000_000) {
    strengths.push(
      `Massive audience scale at ${this.fmt(channel.subscriberCount)} subscribers — top-tier brand visibility and distribution advantage`
    );
  } else if (channel.subscriberCount >= 10_000_000) {
    strengths.push(
      `Strong subscriber base of ${this.fmt(channel.subscriberCount)} — established audience that amplifies every upload`
    );
  } else if (channel.subscriberCount >= 1_000_000) {
    strengths.push(
      `${this.fmt(channel.subscriberCount)} subscribers provides a reliable built-in audience and credibility signal for the algorithm`
    );
  }

  // ENGAGEMENT
  if (
    avgEngagement > 0 &&
    analytics.engagementRate > avgEngagement * 1.2
  ) {
    strengths.push(
      `Audience engagement rate (${analytics.engagementRate.toFixed(2)}%) outperforms competitors — indicating stronger content-audience fit and community loyalty`
    );
  } else if (analytics.engagementRate > 5) {
    strengths.push(
      `Engagement rate of ${analytics.engagementRate.toFixed(2)}% indicates a highly active, responsive audience`
    );
  }

  // CONSISTENCY
  if (analytics.uploadConsistency > 75) {
    strengths.push(
      `Upload schedule consistency score of ${Math.round(
        analytics.uploadConsistency
      )}/100 — predictable cadence trains the algorithm and builds habitual viewership`
    );
  }

  // FREQUENCY
  if (analytics.uploadFrequency > 20) {
    strengths.push(
      `High-volume output at ${analytics.uploadFrequency.toFixed(
        1
      )} uploads/month — maximises algorithmic surface area and content discovery`
    );
  }

  // SHORTS
  if (analytics.shortsPercentage > 40) {
    strengths.push(
      `${Math.round(
        analytics.shortsPercentage
      )}% of content is Shorts — strong short-form strategy capturing mobile-first discovery and younger demographics`
    );
  } else if (analytics.shortsPercentage > avgShorts + 15) {
    strengths.push(
      `Shorts make up ${Math.round(
        analytics.shortsPercentage
      )}% of content — leading the field in short-form investment`
    );
  }

  // DIVERSITY
  if (analytics.contentDiversity > 70) {
    strengths.push(
      `High content diversity score (${Math.round(
        analytics.contentDiversity
      )}/100) — broad topic coverage reduces audience fatigue and attracts multiple viewer segments`
    );
  } else if (analytics.contentDiversity > avgDiversity + 20) {
    strengths.push(
      `More varied content mix than competitors (diversity score ${Math.round(
        analytics.contentDiversity
      )}/100) — reducing single-topic dependency`
    );
  }

  // VIRAL VIDEOS
  if (analytics.viralVideos.length >= 5) {
    strengths.push(
      `${analytics.viralVideos.length} videos performing above 1.5× channel average — strong viral hit rate suggests repeatable content formulas`
    );
  } else if (analytics.viralVideos.length >= 2) {
    strengths.push(
      `${analytics.viralVideos.length} breakout videos significantly outperforming channel averages — top content formats can be replicated and serialised`
    );
  }

  // CONTENT LIBRARY
  if (channel.videoCount >= 1000) {
    strengths.push(
      `Content library of ${this.fmt(
        channel.videoCount
      )} videos creates a large evergreen asset — deep search discoverability and long-tail watch time`
    );
  }

  // FALLBACKS
  if (strengths.length === 0) {

    if (channel.subscriberCount > 1000000) {
      strengths.push(
        `Strong audience scale with ${this.fmt(
          channel.subscriberCount
        )} subscribers gives the channel significant brand authority and discovery power`
      );
    }

    if (channel.videoCount > 500) {
      strengths.push(
        `Large content library improves long-tail discoverability and sustained watch time generation`
      );
    }

    if (analytics.averageViews > 50000) {
      strengths.push(
        `Consistent viewership indicates stable audience demand across uploads`
      );
    }

    strengths.push(
      `Established channel presence provides long-term audience recognition and algorithm familiarity`
    );
  }

  return strengths.slice(0, 4);
}
  // ─────────────────────────────────────────────────────────────
  // WEAKNESSES — specific, data-backed per channel
  // ─────────────────────────────────────────────────────────────
  private identifyWeaknesses(
  company: string,
  channel: YouTubeChannel,
  analytics: VideoAnalytics,
  allAnalytics: { [key: string]: VideoAnalytics }
): string[] {

  const weaknesses: string[] = [];

  const avgEngagement = this.getAverageMetric(allAnalytics, 'engagementRate');
  const avgFrequency = this.getAverageMetric(allAnalytics, 'uploadFrequency');
  const avgConsistency = this.getAverageMetric(allAnalytics, 'uploadConsistency');

  // LOW ENGAGEMENT
  if (
    avgEngagement > 0 &&
    analytics.engagementRate < avgEngagement * 0.7
  ) {
    weaknesses.push(
      `Engagement rate (${analytics.engagementRate.toFixed(
        2
      )}%) trails competitors — audience interaction and retention may be weaker than market leaders`
    );
  }

  // LOW UPLOAD FREQUENCY
  if (
    avgFrequency > 0 &&
    analytics.uploadFrequency < avgFrequency * 0.6
  ) {
    weaknesses.push(
      `Publishing cadence is slower than competitors at ${analytics.uploadFrequency.toFixed(
        1
      )} uploads/month — limiting algorithm momentum and repeat visibility`
    );
  }

  // LOW CONSISTENCY
  if (
    avgConsistency > 0 &&
    analytics.uploadConsistency < avgConsistency * 0.7
  ) {
    weaknesses.push(
      `Inconsistent upload timing may reduce audience habit formation and weaken recommendation performance`
    );
  }

  // LOW CONTENT VOLUME
  if (channel.videoCount < 100) {
    weaknesses.push(
      `Smaller content library limits evergreen discoverability and long-tail traffic generation`
    );
  }

  // FALLBACKS
  if (weaknesses.length === 0) {

    weaknesses.push(
      `Engagement visibility is limited due to incomplete public interaction metrics`
    );

    weaknesses.push(
      `Current content strategy may benefit from stronger short-form experimentation`
    );

    weaknesses.push(
      `Publishing consistency could be improved to strengthen algorithmic reach`
    );

    weaknesses.push(
      `Audience retention opportunities may exist across newer content formats`
    );
  }

  return weaknesses.slice(0, 4);
}

  // ─────────────────────────────────────────────────────────────
  // OPPORTUNITIES — specific growth levers per channel
  // ─────────────────────────────────────────────────────────────
  private identifyOpportunities(
  videos: YouTubeVideo[],
  analytics: VideoAnalytics
): string[] {

  const opportunities: string[] = [];

  // SHORTS
  if (analytics.shortsPercentage < 25) {
    opportunities.push(
      `Increasing Shorts output could improve discoverability and mobile-first audience reach`
    );
  }

  // FREQUENCY
  if (analytics.uploadFrequency < 12) {
    opportunities.push(
      `More frequent uploads could strengthen recommendation system performance and viewer retention`
    );
  }

  // VIRAL CONTENT
  if (analytics.viralVideos.length > 0) {
    opportunities.push(
      `Top-performing content themes can be replicated into repeatable series formats for sustained growth`
    );
  }

  // CONTENT MIX
  if (analytics.contentDiversity < 50) {
    opportunities.push(
      `Expanding content variety may attract broader audience segments and reduce topic saturation`
    );
  }

  // FALLBACKS
  if (opportunities.length === 0) {

    opportunities.push(
      `Expanding creator collaborations could unlock new audience segments`
    );

    opportunities.push(
      `Increasing Shorts output may improve mobile-first discoverability`
    );

    opportunities.push(
      `More frequent uploads could strengthen recommendation system performance`
    );

    opportunities.push(
      `Testing episodic or recurring formats may improve returning viewership`
    );
  }

  return opportunities.slice(0, 4);
}

  // ─────────────────────────────────────────────────────────────
  // THREATS — competitive pressure analysis
  // ─────────────────────────────────────────────────────────────
  private identifyThreats(
    analytics: VideoAnalytics,
    allAnalytics: { [key: string]: VideoAnalytics }
  ): string[] {
    const threats: string[] = [];

    const topPerformer = Object.entries(allAnalytics).sort(
      ([, a], [, b]) => b.averageViews - a.averageViews
    )[0];

    if (
      topPerformer &&
      analytics.averageViews < topPerformer[1].averageViews * 0.5
    ) {
      threats.push(
        `Leading competitor is generating ${Math.round(topPerformer[1].averageViews / Math.max(analytics.averageViews, 1))}× more views per video — widening performance gap risks losing share of audience attention`
      );
    }

    if (analytics.uploadFrequency < 0.5) {
      threats.push(
        `Near-zero content velocity means more active competitors are steadily capturing audience time and search real estate`
      );
    }

    if (analytics.contentDiversity < 25) {
      threats.push(
        `Single-topic dependency creates vulnerability — a shift in audience interest or algorithm preference could significantly impact channel performance`
      );
    }

    const avgConsistency = this.getAverageMetric(allAnalytics, 'uploadConsistency');
    if (analytics.uploadConsistency < avgConsistency - 20) {
      threats.push(
        `Inconsistent cadence relative to competitors leaves gaps that rival channels can fill, gradually capturing attention from a shared audience`
      );
    }

    return threats.length > 0
      ? threats.slice(0, 3)
      : [`Competitive landscape is evolving — monitor competitor posting cadence and Shorts adoption closely.`];
  }

  // ─────────────────────────────────────────────────────────────
  // RECOMMENDATIONS — actionable, data-backed per channel
  // ─────────────────────────────────────────────────────────────
  private generateRecommendations(
    company: string,
    channel: YouTubeChannel,
    analytics: VideoAnalytics,
    allAnalytics: { [key: string]: VideoAnalytics },
    videos: YouTubeVideo[]
  ): string[] {
    const recommendations: string[] = [];

    const avgViews = this.getAverageMetric(allAnalytics, 'averageViews');
    const avgFrequency = this.getAverageMetric(allAnalytics, 'uploadFrequency');

    // Frequency gap
    if (analytics.uploadFrequency < avgFrequency * 0.7) {
      recommendations.push(
        `Increase publishing to ${Math.ceil(avgFrequency)}/month to match field average — batch-filming content in advance can close the gap without sacrificing quality`
      );
    }

    // Shorts gap
    if (analytics.shortsPercentage < 15) {
      recommendations.push(
        `Launch a Shorts repurposing workflow — clip the best 30–60 seconds from each long-form upload and publish as a Short within 24hrs to double distribution with minimal extra effort`
      );
    }

    // Consistency
    if (analytics.uploadConsistency < 55) {
      recommendations.push(
        `Fix a weekly upload day and stick to it for 8 weeks — schedule consistency is one of the fastest ways to improve algorithmic recommendation and subscriber retention`
      );
    }

    // Engagement hook
    if (analytics.engagementRate < 3 || analytics.averageComments < 100) {
      recommendations.push(
        `Add a specific question or call-to-action in the first 30 seconds and pinned comment — even a 0.5% lift in comment rate signals audience interest to YouTube's algorithm`
      );
    }

    // Viral content capitalisation
    if (analytics.viralVideos.length > 0) {
      recommendations.push(
        `Turn the top ${Math.min(analytics.viralVideos.length, 3)} performing videos into a recurring series — viewers who found the channel through viral content are the most likely to subscribe`
      );
    }

    // View-per-sub ratio
    const viewsPerSub = analytics.averageViews / Math.max(channel.subscriberCount, 1);
    if (viewsPerSub < 0.01 && channel.subscriberCount > 100_000) {
      recommendations.push(
        `Re-engage dormant subscribers with a "best of" compilation or a direct community post — reactivating existing subscribers costs far less than acquiring new ones`
      );
    }

    // Content diversification
    if (analytics.contentDiversity < 35) {
      recommendations.push(
        `Run a 30-day content experiment: publish 2 videos in a new adjacent format and compare retention and click-through rates against the channel's baseline`
      );
    }

    return recommendations.length > 0
      ? recommendations.slice(0, 4)
      : [`Continue optimising thumbnail CTR and video title packaging while maintaining current publishing cadence.`];
  }

  // ─────────────────────────────────────────────────────────────
  // OVERALL SCORE — incorporates channel-level data (subs, total views)
  // not just analytics from the last 50 videos
  // ─────────────────────────────────────────────────────────────
  private calculateOverallScore(
    channel: YouTubeChannel,
    analytics: VideoAnalytics
  ): number {
    // Channel-level signals (lifetime)
    const subscriberScore = Math.min((channel.subscriberCount / 10_000_000) * 20, 20);
    const lifetimeViewScore = Math.min((channel.viewCount / 1_000_000_000) * 15, 15);

    // Recent content signals (last 50 videos)
    const avgViewScore = Math.min((analytics.averageViews / 1_000_000) * 25, 25);
    const engagementScore = Math.min(analytics.engagementRate * 1.5, 15);
    const consistencyScore = (analytics.uploadConsistency / 100) * 10;
    const frequencyScore = Math.min((analytics.uploadFrequency / 20) * 8, 8);
    const diversityScore = (analytics.contentDiversity / 100) * 7;

    const total =
      subscriberScore +
      lifetimeViewScore +
      avgViewScore +
      engagementScore +
      consistencyScore +
      frequencyScore +
      diversityScore;

    return Math.round(Math.min(total, 100) * 100) / 100;
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────
  private isShortVideo(duration: string): boolean {
    return this.parseDuration(duration) <= 180;
  }

  private parseDuration(duration: string): number {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const match = duration.match(regex);
    const hours = parseInt(match?.[1] || '0', 10);
    const minutes = parseInt(match?.[2] || '0', 10);
    const seconds = parseInt(match?.[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  private calculateUploadFrequency(videos: YouTubeVideo[]): number {
  if (videos.length < 2) return 0;

  const sorted = videos
    .map(v => new Date(v.publishedAt).getTime())
    .sort((a, b) => a - b);

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const totalDays = Math.max(
    (last - first) / (1000 * 60 * 60 * 24),
    1
  );

  const uploadsPerMonth = (videos.length / totalDays) * 30;

  return Math.round(uploadsPerMonth * 10) / 10;
}

  private calculateAverageDuration(videos: YouTubeVideo[]): string {
    const avgSeconds =
      videos.reduce((sum, v) => sum + this.parseDuration(v.duration), 0) / videos.length;
    const hours = Math.floor(avgSeconds / 3600);
    const minutes = Math.floor((avgSeconds % 3600) / 60);
    const seconds = Math.floor(avgSeconds % 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  private extractTopTopics(
    videos: YouTubeVideo[]
  ): { topic: string; frequency: number }[] {
    const topicFreq: { [key: string]: number } = {};
    videos.forEach((video) => {
      const topics = this.extractTopicsFromText(video.title, video.description);
      topics.forEach((topic) => {
        topicFreq[topic] = (topicFreq[topic] || 0) + 1;
      });
    });
    return Object.entries(topicFreq)
      .map(([topic, frequency]) => ({ topic, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private extractTopicsFromText(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();

  const keywordGroups = {
    trailers: ['trailer', 'teaser', 'official trailer'],
    interview: ['interview', 'cast', 'director'],
    behindScenes: ['behind the scenes', 'bts', 'making of'],
    shorts: ['shorts'],
    review: ['review', 'reaction'],
    announcement: ['announcement', 'revealed'],
    clips: ['clip', 'scene'],
    live: ['live', 'livestream'],
    tutorial: ['tutorial', 'guide', 'explained'],
    vlog: ['vlog'],
    podcast: ['podcast'],
    gaming: ['gameplay', 'gaming'],
    promotion: ['promo', 'featurette'],
  };

  const foundTopics: string[] = [];

  Object.entries(keywordGroups).forEach(([topic, keywords]) => {
    if (keywords.some(k => text.includes(k))) {
      foundTopics.push(topic);
    }
  });

  return foundTopics;
}

  private identifyViralVideos(
    videos: YouTubeVideo[],
    averageViews: number
  ): YouTubeVideo[] {
    return videos
      .filter((v) => v.viewCount > averageViews * 1.5)
      .sort((a, b) => b.viewCount - a.viewCount);
  }

  private calculateContentDiversity(videos: YouTubeVideo[]): number {
  const topics = new Set<string>();

  videos.forEach(video => {
    const extracted = this.extractTopicsFromText(
      video.title,
      video.description
    );

    extracted.forEach(topic => topics.add(topic));
  });

  const diversity = Math.min((topics.size / 10) * 100, 100);

  return Math.round(diversity);
}

  private calculateUploadConsistency(videos: YouTubeVideo[]): number {
    if (videos.length < 2) return 0;
    const dates = videos
      .map((v) => new Date(v.publishedAt).getTime())
      .sort((a, b) => a - b);
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (avgInterval === 0) return 100;
    const variance =
      intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgInterval;
    return Math.max(0, (1 - Math.min(cv, 1)) * 100);
  }

  private calculateVideoPerformanceScore(
    avgViews: number,
    engagementRate: number,
    uploadConsistency: number
  ): number {
    const viewScore = Math.min((avgViews / 1_000_000) * 100, 100) * 0.5;
    const engagementScore = Math.min(engagementRate * 10, 100) * 0.35;
    const consistencyScore = uploadConsistency * 0.15;
    return viewScore + engagementScore + consistencyScore;
  }

  private identifyContentGap(competitors: CompetitorAnalysis[]): string {
    const allTopics = new Map<string, number>();
    competitors.forEach((comp) => {
      comp.analytics.topTopics.forEach(({ topic, frequency }) => {
        allTopics.set(topic, (allTopics.get(topic) || 0) + frequency);
      });
    });

    const topicScores = Array.from(allTopics.entries())
      .map(([topic, freq]) => {
        const coverage = competitors.filter((c) =>
          c.analytics.topTopics.some((t) => t.topic === topic)
        ).length;
        return { topic, freq, coverage };
      })
      .sort((a, b) => a.coverage - b.coverage || b.freq - a.freq);

    const gap = topicScores[0];
    if (gap && gap.coverage < competitors.length * 0.7) {
      return `"${gap.topic}" content represents a significant opportunity — only ${gap.coverage} of ${competitors.length} competitors publish in this space`;
    }
    return 'The competitive set converges on similar formats — whitespace exists in educational and creator-collaboration content';
  }

  private generateExecutiveSummary(competitors: CompetitorAnalysis[]): string {
    const top = competitors[0];
    const la = top.analytics;
    return `${top.company} leads the competitive set with ${this.fmt(la.averageViews)} average views per video${la.engagementRate > 0 ? `, a ${la.engagementRate.toFixed(2)}% engagement rate` : ''}, and ${la.uploadFrequency.toFixed(1)} uploads/month. Their combination of reach, consistency, and content volume creates a compounding advantage that rivals will need to close systematically — starting with upload cadence, then short-form distribution, then engagement optimisation.`;
  }

  private getAverageMetric(
    allAnalytics: { [key: string]: VideoAnalytics },
    metric: keyof VideoAnalytics
  ): number {
    const values = Object.values(allAnalytics).map((a) => a[metric] as number);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private fmt(num: number): string {
    if (!num || isNaN(num)) return '0';
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return String(Math.round(num));
  }

  private getEmptyAnalytics(): VideoAnalytics {
    return {
      totalVideos: 0, averageViews: 0, averageLikes: 0, averageComments: 0,
      engagementRate: 0, uploadFrequency: 0, shortsPercentage: 0, avgDuration: '0s',
      topTopics: [], viralVideos: [], contentDiversity: 0, uploadConsistency: 0,
      videoPerformanceScore: 0,
    };
  }
}

export const analyticsEngine = new AnalyticsEngine();