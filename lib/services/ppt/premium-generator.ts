/**
 * Premium Report Generator
 * Main orchestrator for generating consulting-grade competitive analysis PPTs
 */

import PptxGenJS from 'pptxgenjs';
import { premiumTheme } from './premium-theme';
import { PremiumSlideTemplates } from './premium-slides';

interface ReportData {
  mainCompany: string;
  competitors: Array<{
    company: string;
    channelId?: string;
    channelTitle?: string;
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
    strengths?: string[];
    weaknesses?: string[];
    topTopics?: string[];
    viralVideos?: any[];
    analytics?: any;
  }>;
}

export class PremiumReportGenerator {
  /**
   * Generate premium consulting-grade PPT report
   */
  generateReport(reportData: ReportData): any {
    const prs = new PptxGenJS();

    // Initialize slide templates
    const slideTemplates = new PremiumSlideTemplates(prs);

    // Generate slides
    try {
      // 1. Cover Slide
      slideTemplates.createCoverSlide(
        reportData.mainCompany,
        reportData.competitors,
        new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      );

      // 2. Executive Summary
      slideTemplates.createExecutiveSummary(reportData.competitors);

      // 3. Channel Overview Comparison
      slideTemplates.createChannelComparison(reportData.competitors);

      // 4. Content Performance Analysis
      slideTemplates.createContentPerformance(reportData.competitors);

      // 5. Content Themes & Positioning
      slideTemplates.createContentThemes(reportData.competitors);

      // 6. Posting Frequency & Consistency
      slideTemplates.createPostingConsistency(reportData.competitors);

      // 7. Engagement Analysis
      slideTemplates.createEngagementAnalysis(reportData.competitors);

      // 8. Gap Analysis
      slideTemplates.createGapAnalysis(reportData.competitors);

      // 9. Video Marketing Recommendations
      slideTemplates.createRecommendations(reportData.competitors);

      // 10. Final Ranking & Scorecard
      slideTemplates.createFinalRanking(reportData.competitors);
    } catch (error) {
      console.error('Error generating slides:', error);
      throw error;
    }

    // Generate and return PPTX buffer
    return prs.write({ outputType: 'nodebuffer' });
  }
}

export const premiumReportGenerator = new PremiumReportGenerator();
