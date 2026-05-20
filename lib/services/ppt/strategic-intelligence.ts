/**
 * Strategic Intelligence Engine
 * Deep competitive analysis and insight generation
 */

interface CompetitorMetrics {
  company: string;
  subscriberCount: number;
  totalViews: number;
  totalVideos: number;
  avgViews?: number;
  avgLikes?: number;
  avgComments?: number;
  engagementRate?: number;
  uploadFrequency?: string;
  uploadConsistency?: number;
  shortsPercentage?: number;
  contentDiversity?: number;
  videoPerformanceScore?: number;
}

interface StrategicInsights {
  executiveSummary: string;
  winner: string;
  winningReasons: string[];
  opportunities: Array<{ company: string; opportunity: string }>;
  threats: Array<{ company: string; threat: string }>;
  competitiveGaps: string[];
  recommendations: Array<{ company: string; recommendation: string; impact: 'high' | 'medium' | 'low' }>;
}

export class StrategicIntelligenceEngine {
  /**
   * Generate comprehensive competitive analysis
   */
  generateStrategicInsights(competitors: CompetitorMetrics[]): StrategicInsights {
    const sorted = this.sortByPerformance(competitors);
    const leader = sorted[0];
    
    return {
      executiveSummary: this.generateExecutiveSummary(sorted),
      winner: leader.company,
      winningReasons: this.identifyWinningReasons(leader, sorted),
      opportunities: this.identifyOpportunities(sorted),
      threats: this.identifyThreats(sorted),
      competitiveGaps: this.identifyCompetitiveGaps(sorted),
      recommendations: this.generateConsultantRecommendations(sorted),
    };
  }

  /**
   * Sort companies by overall performance
   */
  private sortByPerformance(competitors: CompetitorMetrics[]): CompetitorMetrics[] {
    return [...competitors].sort((a, b) => {
      const scoreA = this.calculateOverallScore(a);
      const scoreB = this.calculateOverallScore(b);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate overall performance score (0-100)
   */
  private calculateOverallScore(c: CompetitorMetrics): number {
    const viewsScore = Math.min((c.totalViews / 1000000) * 10, 25); // Max 25
    const engagementScore = (c.engagementRate || 0) * 0.5; // Max 5+ based on rate
    const consistencyScore = (c.uploadConsistency || 0.5) * 20; // Max 20
    const diversityScore = (c.contentDiversity || 0.5) * 15; // Max 15
    const performanceScore = (c.videoPerformanceScore || 50) / 10; // Max 10
    
    return Math.round(
      Math.min(viewsScore + engagementScore + consistencyScore + diversityScore + performanceScore, 100)
    );
  }

  /**
   * Generate AI-written executive summary
   */
  private generateExecutiveSummary(sorted: CompetitorMetrics[]): string {
    const leader = sorted[0];
    const follower = sorted[1];
    
    const leaderStrength = this.getLeaderStrength(leader);
    const competitiveContext = this.getCompetitiveContext(sorted);
    
    return `${leader.company} leads the competitive landscape through ${leaderStrength}. The market shows clear ${competitiveContext}. Strategic positioning indicates growth opportunities for challengers through differentiated content strategy and optimized engagement tactics.`;
  }

  /**
   * Identify why the leader is winning
   */
  private getLeaderStrength(leader: CompetitorMetrics): string {
    const avgViews = leader.avgViews || 0;
    const engagement = leader.engagementRate || 0;
    const consistency = leader.uploadConsistency || 0;
    const views = leader.totalViews;
    
    if (avgViews > 500000 && engagement > 5) return 'exceptional audience engagement combined with high-reach content';
    if (consistency > 0.8 && views > 10000000) return 'consistent publishing and audience authority';
    if (engagement > 6) return 'superior audience resonance and content quality';
    return 'comprehensive channel authority and scale';
  }

  /**
   * Get competitive context
   */
  private getCompetitiveContext(sorted: CompetitorMetrics[]): string {
    const spread = sorted[0].totalViews - sorted[sorted.length - 1].totalViews;
    const avgViews = sorted.reduce((sum, c) => sum + c.totalViews, 0) / sorted.length;
    
    if (spread > avgViews * 2) return 'clear leader-follower differentiation';
    if (Math.max(...sorted.map(c => c.uploadConsistency || 0)) > 0.9) return 'tightening competition with consistent performers';
    return 'fragmented market with opportunity concentration';
  }

  /**
   * Identify what makes the winner win
   */
  private identifyWinningReasons(leader: CompetitorMetrics, all: CompetitorMetrics[]): string[] {
    const reasons: string[] = [];
    const avgConsistency = all.reduce((s, c) => s + (c.uploadConsistency || 0), 0) / all.length;
    const avgEngagement = all.reduce((s, c) => s + (c.engagementRate || 0), 0) / all.length;
    
    if ((leader.uploadConsistency || 0) > avgConsistency * 1.2) {
      reasons.push(`${Math.round((leader.uploadConsistency || 0) * 100)}% upload consistency drives predictable audience retention`);
    }
    
    if ((leader.engagementRate || 0) > avgEngagement * 1.2) {
      reasons.push(`${(leader.engagementRate || 0).toFixed(1)}% engagement rate indicates superior content resonance`);
    }
    
    if (leader.shortsPercentage && leader.shortsPercentage > 40) {
      reasons.push(`${leader.shortsPercentage}% shorts utilization captures growing short-form audience`);
    }
    
    if (leader.avgViews && leader.avgViews > 100000) {
      reasons.push(`Average views of ${(leader.avgViews / 1000).toFixed(0)}K per video demonstrates proven audience reach`);
    }
    
    return reasons.length > 0 ? reasons : ['Market leadership through scale and consistency'];
  }

  /**
   * Identify untapped opportunities for each competitor
   */
  private identifyOpportunities(sorted: CompetitorMetrics[]): Array<{ company: string; opportunity: string }> {
    const leader = sorted[0];
    const result: Array<{ company: string; opportunity: string }> = [];
    
    sorted.forEach((competitor, idx) => {
      if (idx === 0) return; // Skip leader
      
      // Engagement opportunity
      if ((competitor.engagementRate || 0) < (leader.engagementRate || 0) * 0.8) {
        result.push({
          company: competitor.company,
          opportunity: `Engagement gap of ${((leader.engagementRate || 0) - (competitor.engagementRate || 0)).toFixed(1)}% indicates untapped audience interaction potential`,
        });
      }
      
      // Consistency opportunity
      if ((competitor.uploadConsistency || 0) < (leader.uploadConsistency || 0) * 0.9) {
        result.push({
          company: competitor.company,
          opportunity: 'Inconsistent upload cadence losing audience retention; regular publishing could recapture lapsed viewers',
        });
      }
      
      // Shorts opportunity
      if ((competitor.shortsPercentage || 0) < 25) {
        result.push({
          company: competitor.company,
          opportunity: 'Underutilized shorts format; expansion could reach growing short-form audience demographic',
        });
      }
    });
    
    return result;
  }

  /**
   * Identify competitive threats
   */
  private identifyThreats(sorted: CompetitorMetrics[]): Array<{ company: string; threat: string }> {
    const result: Array<{ company: string; threat: string }> = [];
    const leader = sorted[0];
    
    // Check for rising challengers
    if (sorted.length > 1) {
      const follower = sorted[1];
      const leaderScore = this.calculateOverallScore(leader);
      const followerScore = this.calculateOverallScore(follower);
      
      if (followerScore > leaderScore * 0.85) {
        result.push({
          company: leader.company,
          threat: `${follower.company} approaching competitive parity with ${(leaderScore - followerScore).toFixed(0)} point gap`,
        });
      }
    }
    
    // High growth indicators
    sorted.forEach(c => {
      if (c.videoPerformanceScore && c.videoPerformanceScore > 70) {
        result.push({
          company: c.company,
          threat: `Rising content performance (score: ${c.videoPerformanceScore.toFixed(0)}) indicates growing audience resonance`,
        });
      }
    });
    
    return result;
  }

  /**
   * Identify competitive gaps and whitespace
   */
  private identifyCompetitiveGaps(sorted: CompetitorMetrics[]): string[] {
    const gaps: string[] = [];
    const avgConsistency = sorted.reduce((s, c) => s + (c.uploadConsistency || 0), 0) / sorted.length;
    const avgEngagement = sorted.reduce((s, c) => s + (c.engagementRate || 0), 0) / sorted.length;
    const avgShorts = sorted.reduce((s, c) => s + (c.shortsPercentage || 0), 0) / sorted.length;
    
    if (avgConsistency < 0.6) {
      gaps.push('Market lacks consistent, reliable publishers; schedule reliability is competitive advantage');
    }
    
    if (avgEngagement < 3) {
      gaps.push('Low engagement baseline market; quality over quantity approach could differentiate');
    }
    
    if (avgShorts < 30) {
      gaps.push('Shorts market underutilized; short-form content strategy provides significant opportunity');
    }
    
    gaps.push('Niche topic coverage gaps; underexplored content categories present growth vectors');
    
    return gaps;
  }

  /**
   * Generate consultant-grade recommendations
   */
  private generateConsultantRecommendations(
    sorted: CompetitorMetrics[]
  ): Array<{ company: string; recommendation: string; impact: 'high' | 'medium' | 'low' }> {
    const recommendations: Array<{ company: string; recommendation: string; impact: 'high' | 'medium' | 'low' }> = [];
    const leader = sorted[0];
    
    sorted.forEach((competitor, idx) => {
      if (idx === 0) {
        // Leader recommendations (maintain position)
        if ((competitor.uploadConsistency || 0) < 0.95) {
          recommendations.push({
            company: competitor.company,
            recommendation: 'Strengthen upload consistency to 95%+ to maximize algorithmic favorability and audience habit formation',
            impact: 'high',
          });
        }
        recommendations.push({
          company: competitor.company,
          recommendation: 'Expand into underexplored content subcategories to capture adjacent audience segments',
          impact: 'medium',
        });
      } else {
        // Challenger recommendations (catch up)
        const consistencyGap = (leader.uploadConsistency || 0) - (competitor.uploadConsistency || 0);
        if (consistencyGap > 0.15) {
          recommendations.push({
            company: competitor.company,
            recommendation: `Implement systematic publishing schedule (+${(consistencyGap * 100).toFixed(0)}% improvement target) to match leader consistency`,
            impact: 'high',
          });
        }
        
        const engagementGap = (leader.engagementRate || 0) - (competitor.engagementRate || 0);
        if (engagementGap > 1) {
          recommendations.push({
            company: competitor.company,
            recommendation: `Optimize content hooks and CTAs to close ${engagementGap.toFixed(1)}% engagement gap`,
            impact: 'high',
          });
        }
        
        if ((competitor.shortsPercentage || 0) < 25) {
          recommendations.push({
            company: competitor.company,
            recommendation: 'Allocate 25-30% of content production to shorts format for short-form audience capture',
            impact: 'medium',
          });
        }
      }
    });
    
    return recommendations;
  }

  /**
   * Calculate engagement efficiency (views per engagement rate)
   */
  calculateEngagementEfficiency(c: CompetitorMetrics): number {
    if (!c.avgViews || !c.engagementRate) return 0;
    return Math.round((c.engagementRate / c.avgViews) * 100000) / 100;
  }

  /**
   * Get ranking score for final leaderboard
   */
  getRankingScore(c: CompetitorMetrics): number {
    return this.calculateOverallScore(c);
  }

  /**
   * Format metric for display
   */
  formatMetric(value: number, type: 'views' | 'engagement' | 'percentage' | 'score'): string {
    switch (type) {
      case 'views':
        if (value > 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value > 1000) return `${(value / 1000).toFixed(0)}K`;
        return String(value);
      case 'engagement':
        return `${value.toFixed(1)}%`;
      case 'percentage':
        return `${Math.round(value)}%`;
      case 'score':
        return `${Math.round(value)}/100`;
      default:
        return String(value);
    }
  }
}

export const intelligenceEngine = new StrategicIntelligenceEngine();
