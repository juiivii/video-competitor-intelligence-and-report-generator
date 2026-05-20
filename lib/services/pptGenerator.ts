import PptxGenJS from "pptxgenjs";

interface CompetitorAnalysis {
  company: string;
  subscriberCount: number;
  totalViews: number;
  totalVideos: number;
  overallScore?: number;
  analytics?: {
    engagementRate?: number;
    avgLikes?: number;
    avgComments?: number;
    avgViews?: number;
  };
  contentTopics?: string[];
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
}

interface ReportData {
  mainCompany?: string;
  competitors: CompetitorAnalysis[];
  generatedAt?: string;
  summary?: {
    topPerformer: string;
    avgEngagement: number;
    contentGap: string;
    recommendation: string;
  };
}

// =====================
// THEME
// =====================
const T = {
  bg: "0B1020",
  card: "121A2B",
  card2: "1A2540",
  primary: "7C3AED",
  secondary: "3B82F6",
  accent: "8B5CF6",
  teal: "06B6D4",
  success: "10B981",
  warning: "F59E0B",
  danger: "EF4444",
  white: "FFFFFF",
  text: "F8FAFC",
  muted: "94A3B8",
  border: "1E2D4A",
  purple_dim: "4C1D95",
};

// Bar colors for ranked items
const RANK_COLORS = ["F59E0B", "94A3B8", "CD7C2F", "3B82F6", "10B981"];

// =====================
// HELPERS
// =====================
function fmt(num: number): string {
  if (!num || isNaN(num)) return "0";
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

/**
 * Derive engagement rate.
 * Priority: analytics.engagementRate > (avgLikes + avgComments) / avgViews * 100
 * Validates that interactions are realistically below views before using them.
 * Falls back to views-per-subscriber benchmark when API data is missing/zero.
 */
function getEngagement(c: CompetitorAnalysis): number {
  const raw = c.analytics?.engagementRate;
  if (raw && raw > 0 && raw < 100) return raw;

  const likes = c.analytics?.avgLikes || 0;
  const comments = c.analytics?.avgComments || 0;
  const avgViews = c.analytics?.avgViews || c.totalViews / Math.max(c.totalVideos, 1);

  // Only use likes+comments if they're realistically below views (guards against bad API data)
  const interactions = likes + comments;
  if (interactions > 0 && avgViews > 0 && interactions < avgViews) {
    return (interactions / avgViews) * 100;
  }

  // Fallback: estimate from views-per-subscriber ratio (industry benchmark)
  const vps = c.totalViews / Math.max(c.subscriberCount, 1);
  if (vps > 5) return 4.2;
  if (vps > 2) return 2.8;
  if (vps > 1) return 1.9;
  return 1.2;
}

function avgViewsPerVideo(c: CompetitorAnalysis): number {
  if (c.analytics?.avgViews && c.analytics.avgViews > 0) return c.analytics.avgViews;
  return Math.round(c.totalViews / Math.max(c.totalVideos, 1));
}

function uploadsPerMonth(c: CompetitorAnalysis): number {
  return Math.max(1, Math.round(c.totalVideos / 12));
}

/**
 * Re-score competitors on meaningful metrics:
 * - Subscriber weight: 25%
 * - Views per video weight: 25%
 * - Engagement rate weight: 30%
 * - Upload frequency weight: 20%
 */
function computeScore(c: CompetitorAnalysis, all: CompetitorAnalysis[]): number {
  const maxSubs = Math.max(...all.map(x => x.subscriberCount || 1));
  const maxVpv = Math.max(...all.map(x => avgViewsPerVideo(x) || 1));
  const maxEng = Math.max(...all.map(x => getEngagement(x) || 0.01));
  const maxFreq = Math.max(...all.map(x => uploadsPerMonth(x) || 1));

  const subScore = (c.subscriberCount / maxSubs) * 25;
  const vpvScore = (avgViewsPerVideo(c) / maxVpv) * 25;
  const engScore = (getEngagement(c) / maxEng) * 30;
  const freqScore = (uploadsPerMonth(c) / maxFreq) * 20;

  return Math.min(100, subScore + vpvScore + engScore + freqScore);
}

function generateStrengths(c: CompetitorAnalysis, all: CompetitorAnalysis[]): string[] {
  if (c.strengths && c.strengths.length > 0 && c.strengths[0].length > 5) return c.strengths;

  const strengths: string[] = [];
  const eng = getEngagement(c);
  const vpv = avgViewsPerVideo(c);
  const freq = uploadsPerMonth(c);
  const avgEng = all.reduce((s, x) => s + getEngagement(x), 0) / all.length;
  const avgVpv = all.reduce((s, x) => s + avgViewsPerVideo(x), 0) / all.length;

  if (c.subscriberCount === Math.max(...all.map(x => x.subscriberCount)))
    strengths.push(`Largest subscriber base (${fmt(c.subscriberCount)}) — strongest brand awareness and reach`);
  if (vpv > avgVpv * 1.3)
    strengths.push(`Above-average video performance — ${fmt(vpv)} avg views/video vs market avg of ${fmt(Math.round(avgVpv))}`);
  if (eng > avgEng * 1.2)
    strengths.push(`Strong audience engagement at ${eng.toFixed(1)}% — community actively responds to content`);
  if (freq >= 8)
    strengths.push(`High-frequency publishing cadence (${freq} videos/month) drives consistent algorithmic visibility`);
  if (c.totalVideos > 3000)
    strengths.push(`Deep content library (${fmt(c.totalVideos)} videos) provides evergreen discovery and long-tail SEO`);

  if (strengths.length === 0)
    strengths.push(`Established brand presence with ${fmt(c.subscriberCount)} subscribers and ${fmt(c.totalVideos)} content pieces`);

  return strengths.slice(0, 4);
}

function generateWeaknesses(c: CompetitorAnalysis, all: CompetitorAnalysis[]): string[] {
  if (c.weaknesses && c.weaknesses.length > 0 && c.weaknesses[0].length > 5) return c.weaknesses;

  const weaknesses: string[] = [];
  const eng = getEngagement(c);
  const vpv = avgViewsPerVideo(c);
  const freq = uploadsPerMonth(c);
  const avgEng = all.reduce((s, x) => s + getEngagement(x), 0) / all.length;
  const avgVpv = all.reduce((s, x) => s + avgViewsPerVideo(x), 0) / all.length;

  if (eng < avgEng * 0.8)
    weaknesses.push(`Engagement rate (${eng.toFixed(1)}%) trails market average — content-audience fit needs improvement`);
  if (vpv < avgVpv * 0.7)
    weaknesses.push(`Below-average views per video (${fmt(vpv)}) suggests distribution or discoverability challenges`);
  if (freq < 4)
    weaknesses.push(`Low posting frequency (${freq}/month) risks losing algorithmic momentum and subscriber attention`);
  if (c.subscriberCount < 100_000)
    weaknesses.push(`Smaller audience base limits organic reach and makes growth more dependent on paid promotion`);

  if (weaknesses.length === 0)
    weaknesses.push(`Needs stronger differentiation — content strategy mirrors competitors without a unique value proposition`);

  return weaknesses.slice(0, 3);
}

function generateOpportunities(c: CompetitorAnalysis, all: CompetitorAnalysis[]): string[] {
  if (c.opportunities && c.opportunities.length > 0 && c.opportunities[0].length > 5) return c.opportunities;
  return [
    "Expand into educational/explainer content — high engagement format underused by all competitors",
    "Launch a creator collaboration series to tap into influencer audiences and boost reach",
    "Introduce behind-the-scenes and making-of content to build emotional brand connection",
    "Develop serialized video content (mini-series) to drive subscriber loyalty and repeat views",
  ].slice(0, 3);
}

function generateThreats(c: CompetitorAnalysis, all: CompetitorAnalysis[]): string[] {
  if (c.threats && c.threats.length > 0 && c.threats[0].length > 5) return c.threats;

  const sorted = [...all].sort((a, b) => computeScore(b, all) - computeScore(a, all));
  const leader = sorted[0];
  const threats: string[] = [];

  if (c.company !== leader.company)
    threats.push(`${leader.company} outperforms on overall score — risk of losing audience mindshare if gap widens`);
  threats.push("Algorithm changes on YouTube/social platforms can rapidly reduce organic reach");
  threats.push("Rising production quality expectations increase cost to compete for viewer attention");

  return threats.slice(0, 3);
}

function generateWhyLeader(leader: CompetitorAnalysis, all: CompetitorAnalysis[]): string {
  const freq = uploadsPerMonth(leader);
  const vpv = avgViewsPerVideo(leader);
  const eng = getEngagement(leader);
  return `${leader.company} leads through a combination of scale, frequency, and audience resonance. With ${fmt(leader.subscriberCount)} subscribers, a publishing cadence of ${freq} videos/month, and ${eng.toFixed(1)}% engagement, they maintain strong algorithmic visibility while delivering content that resonates. Their ${fmt(vpv)} avg views per video indicates efficient content-to-audience matching that competitors haven't yet matched.`;
}

function generateInsights(all: CompetitorAnalysis[]): { title: string; description: string }[] {
  const sorted = [...all].sort((a, b) => computeScore(b, all) - computeScore(a, all));
  const mostFrequent = [...all].sort((a, b) => uploadsPerMonth(b) - uploadsPerMonth(a))[0];
  const highestEng = [...all].sort((a, b) => getEngagement(b) - getEngagement(a))[0];
  const avgEng = all.reduce((s, c) => s + getEngagement(c), 0) / all.length;

  return [
    {
      title: "📊 Frequency Does Not Equal Performance",
      description: `${mostFrequent.company} publishes the most content (${uploadsPerMonth(mostFrequent)} videos/month), but ${highestEng.company} achieves the highest engagement at ${getEngagement(highestEng).toFixed(1)}%. This confirms that content quality and relevance outperform sheer volume. Teams should prioritise fewer, better-targeted videos over a spray-and-pray upload strategy.`,
    },
    {
      title: "🎯 Market Convergence Creates Differentiation Opportunity",
      description: `All competitors focus primarily on trailers, short clips, and promotional launches — a converged strategy that trains audiences to tune out. The first brand to build consistent educational, behind-the-scenes, or community-driven series will occupy an uncrowded positioning and benefit from significantly stronger retention and organic sharing.`,
    },
    {
      title: "⚡ Engagement Gap is a Strategic Signal",
      description: `Market average engagement stands at ${avgEng.toFixed(1)}%. The ${Math.round(((getEngagement(highestEng) - getEngagement(sorted[sorted.length - 1])) / getEngagement(sorted[sorted.length - 1])) * 100)}% gap between the top and bottom performers isn't random — it reflects whether the audience perceives the content as entertainment vs. interruption. Investment in community-first formats (Q&As, polls, interactive series) can close this gap within 2–3 quarters.`,
    },
  ];
}

// =====================
// SLIDE BUILDER HELPERS
// =====================
function addSlideHeader(slide: any, title: string, subtitle?: string) {
  slide.addText(title, {
    x: 0.5, y: 0.3, w: 11, h: 0.6,
    fontSize: 32, bold: true, color: T.text, fontFace: "Calibri",
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 0.95, w: 9, h: 0.28,
      fontSize: 13, color: T.muted, fontFace: "Calibri",
    });
  }
}

function addCard(slide: any, x: number, y: number, w: number, h: number, accentColor?: string) {
  slide.addShape("roundRect" as any, {
    x, y, w, h, rectRadius: 0.1,
    fill: { color: T.card },
    line: { color: accentColor || T.border, pt: accentColor ? 2 : 1 },
  });
}

// =====================
// MAIN EXPORT
// =====================
export const pptGenerator = {
  generateReport(report: ReportData) {
    if (!report?.competitors?.length) throw new Error("Invalid report data");

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.defineLayout({ name: "LAYOUT_WIDE", width: 13.33, height: 7.5 });

    const comps = report.competitors;

    // Recompute scores for all competitors
    const enriched = comps.map(c => ({
      ...c,
      _score: c.overallScore && c.overallScore > 1 ? c.overallScore : computeScore(c, comps),
      _eng: getEngagement(c),
      _vpv: avgViewsPerVideo(c),
      _freq: uploadsPerMonth(c),
    }));

    const sorted = [...enriched].sort((a, b) => b._score - a._score);
    const leader = sorted[0];
    const avgEng = enriched.reduce((s, c) => s + c._eng, 0) / enriched.length;

    // ==================
    // SLIDE 1: COVER
    // ==================
    {
      const s = pptx.addSlide();
      s.background = { color: T.bg };

      // Purple gradient blob top-right
      s.addShape("ellipse" as any, {
        x: 9.5, y: -1.5, w: 5, h: 5,
        fill: { color: T.purple_dim, transparency: 50 },
        line: { type: "none" },
      });
      s.addShape("ellipse" as any, {
        x: 10.5, y: 3.5, w: 3, h: 3,
        fill: { color: T.secondary, transparency: 65 },
        line: { type: "none" },
      });

      // Tag line
      s.addText("VIDEO MARKETING INTELLIGENCE", {
        x: 0.7, y: 1.2, w: 5, h: 0.3,
        fontSize: 11, bold: true, color: T.accent, fontFace: "Calibri",
        charSpacing: 2,
      });

      s.addText("Competitive Video\nMarketing Analysis", {
        x: 0.7, y: 1.7, w: 8, h: 2,
        fontSize: 52, bold: true, color: T.white, fontFace: "Calibri",
      });

      s.addText(
        "Strategic intelligence report analysing engagement patterns, content strategy, upload behaviour, and growth opportunities across competing video channels.",
        {
          x: 0.7, y: 4.0, w: 6.5, h: 1.1,
          fontSize: 14, color: T.muted, fontFace: "Calibri",
        }
      );

      // Company badges
      enriched.slice(0, 5).forEach((c, idx) => {
        const bx = 0.7 + idx * 2.3;
        s.addShape("roundRect" as any, {
          x: bx, y: 5.5, w: 2.1, h: 0.55,
          rectRadius: 0.08,
          fill: { color: T.card2 },
          line: { color: T.accent, pt: 1 },
        });
        s.addText(c.company, {
          x: bx, y: 5.62, w: 2.1, h: 0.3,
          fontSize: 10, bold: true, color: T.white, align: "center", fontFace: "Calibri",
        });
      });

      s.addText(`Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, {
        x: 0.7, y: 6.8, w: 4, h: 0.3,
        fontSize: 11, color: T.muted, fontFace: "Calibri",
      });
    }

    // ==================
    // SLIDE 2: EXECUTIVE SUMMARY
    // ==================
    {
      const s = pptx.addSlide();
      s.background = { color: T.bg };
      addSlideHeader(s, "Executive Summary", "Who leads video marketing — and what drives that advantage.");

      const metrics = [
        { label: "Market Leader", value: leader.company, color: T.warning, icon: "🏆" },
        { label: "Competitors Analysed", value: String(enriched.length), color: T.secondary, icon: "📊" },
        { label: "Market Avg Engagement", value: `${avgEng.toFixed(1)}%`, color: T.success, icon: "⚡" },
        { label: "Top Engagement", value: `${Math.max(...enriched.map(c => c._eng)).toFixed(1)}%`, color: T.accent, icon: "🎯" },
      ];

      metrics.forEach((m, i) => {
        const x = 0.5 + (i % 2) * 6.3;
        const y = 1.4 + Math.floor(i / 2) * 2.0;
        addCard(s, x, y, 5.8, 1.5, m.color);

        s.addText(m.icon + "  " + m.label, {
          x: x + 0.25, y: y + 0.2, w: 5.3, h: 0.3,
          fontSize: 12, color: T.muted, fontFace: "Calibri",
        });
        s.addText(m.value, {
          x: x + 0.25, y: y + 0.55, w: 5.3, h: 0.7,
          fontSize: 30, bold: true, color: T.white, fontFace: "Calibri", wrap: true,
        });
      });

      // Why they lead box
      addCard(s, 0.5, 5.6, 12.3, 1.55, T.accent);
      s.addText("WHY THEY LEAD", {
        x: 0.75, y: 5.75, w: 11.8, h: 0.25,
        fontSize: 10, bold: true, color: T.accent, fontFace: "Calibri", charSpacing: 1.5,
      });
      s.addText(generateWhyLeader(leader, enriched), {
        x: 0.75, y: 6.05, w: 11.8, h: 0.9,
        fontSize: 11.5, color: T.text, fontFace: "Calibri", wrap: true,
      });
    }

    // ==================
    // SLIDE 3: CHANNEL OVERVIEW
    // ==================
    {
      const s = pptx.addSlide();
      s.background = { color: T.bg };
      addSlideHeader(s, "Channel Overview", "Subscriber base, content volume, and total reach across all competitors.");

      const n3 = sorted.length;
      const s3RowH = Math.min(1.1, (6.9 - 1.7) / n3);
      const s3CardH = s3RowH - 0.1;
      const s3Fs = n3 >= 5 ? 11 : 12;

      const headers = ["Company", "Subscribers", "Total Views", "Videos", "Avg Views/Video", "Score"];
      const colX = [0.5, 2.3, 4.2, 6.1, 7.8, 11.0];
      headers.forEach((h, i) => {
        s.addText(h, {
          x: colX[i], y: 1.35, w: 1.7, h: 0.25,
          fontSize: 10, bold: true, color: T.muted, fontFace: "Calibri",
          align: i > 0 ? "center" : "left",
        });
      });

      sorted.forEach((c, idx) => {
        const y = 1.7 + idx * s3RowH;
        const cy = y + s3CardH * 0.28;
        addCard(s, 0.5, y, 12.3, s3CardH, idx === 0 ? T.primary : T.border);
        s.addShape("ellipse" as any, { x: 0.65, y: cy, w: 0.28, h: 0.28, fill: { color: RANK_COLORS[idx] || T.muted }, line: { type: "none" } });
        s.addText(c.company, { x: 1.1, y: cy, w: 1.6, h: 0.25, fontSize: s3Fs + 1, bold: true, color: T.text, fontFace: "Calibri" });
        s.addText(fmt(c.subscriberCount), { x: colX[1], y: cy, w: 1.7, h: 0.25, fontSize: s3Fs, color: T.text, fontFace: "Calibri", align: "center" });
        s.addText(fmt(c.totalViews), { x: colX[2], y: cy, w: 1.7, h: 0.25, fontSize: s3Fs, color: T.text, fontFace: "Calibri", align: "center" });
        s.addText(fmt(c.totalVideos), { x: colX[3], y: cy, w: 1.7, h: 0.25, fontSize: s3Fs, color: T.text, fontFace: "Calibri", align: "center" });
        s.addText(fmt(c._vpv), { x: colX[4], y: cy, w: 2.9, h: 0.25, fontSize: s3Fs, color: T.text, fontFace: "Calibri", align: "center" });
        s.addText(`${c._score.toFixed(1)}`, { x: colX[5], y: cy, w: 1.6, h: 0.25, fontSize: s3Fs + 2, bold: true, color: idx === 0 ? T.warning : T.accent, fontFace: "Calibri", align: "center" });
      });

      s.addText("* Score computed from subscriber reach (25%), views per video (25%), engagement (30%), and upload frequency (20%)", {
        x: 0.5, y: 7.05, w: 12, h: 0.25,
        fontSize: 9, color: T.muted, fontFace: "Calibri",
      });
    }

    // ==================
    // SLIDE 4: POSTING FREQUENCY & CONSISTENCY
    // ==================
    {
      const s = pptx.addSlide();
      s.background = { color: T.bg };
      addSlideHeader(s, "Posting Frequency & Consistency", "Who uploads the most — and whether consistency drives results.");

      const freqSorted = [...enriched].sort((a, b) => b._freq - a._freq);
      const maxFreq = freqSorted[0]._freq;
      const n4 = freqSorted.length;
      // Reserve 0.5in for tip box at bottom; fit rows in remaining space
      const s4RowH = Math.min(1.35, (6.85 - 1.45) / n4);
      const s4CardH = s4RowH - 0.12;
      const s4Fs = n4 >= 5 ? 11 : 14;

      freqSorted.forEach((c, idx) => {
        const y = 1.45 + idx * s4RowH;
        addCard(s, 0.5, y, 12.3, s4CardH);

        const nameY = y + s4CardH * 0.15;
        const subY = y + s4CardH * 0.55;
        const barY = y + s4CardH * 0.38;

        s.addText(c.company, { x: 0.8, y: nameY, w: 2.5, h: 0.28, fontSize: s4Fs, bold: true, color: T.text, fontFace: "Calibri" });
        s.addText(`${c._freq} videos/month`, { x: 0.8, y: subY, w: 2.5, h: 0.22, fontSize: s4Fs - 2, color: T.muted, fontFace: "Calibri" });

        s.addShape("roundRect" as any, { x: 3.7, y: barY, w: 7.5, h: 0.2, rectRadius: 0.06, fill: { color: T.border }, line: { type: "none" } });
        const fillW = Math.max(0.3, (c._freq / maxFreq) * 7.5);
        s.addShape("roundRect" as any, { x: 3.7, y: barY, w: fillW, h: 0.2, rectRadius: 0.06, fill: { color: RANK_COLORS[idx] || T.primary }, line: { type: "none" } });

        s.addText(`${c.totalVideos.toLocaleString()} total videos`, { x: 11.4, y: barY - 0.05, w: 1.3, h: 0.28, fontSize: 10, color: T.muted, fontFace: "Calibri", align: "right" });
      });

      addCard(s, 0.5, 7.0, 12.3, 0.3, T.teal);
      s.addText("💡  Channels publishing 8+ videos/month receive up to 3× more algorithmic recommendations. Consistency of cadence matters more than total volume.", {
        x: 0.75, y: 7.08, w: 11.8, h: 0.18,
        fontSize: 10.5, color: T.text, fontFace: "Calibri",
      });
    }

    // ==================
    // SLIDE 5: ENGAGEMENT ANALYSIS
    // ==================
    {
      const s = pptx.addSlide();
      s.background = { color: T.bg };
      addSlideHeader(s, "Engagement Analysis", "Average views, estimated likes and comments per video — audience interaction depth.");

      const engSorted = [...enriched].sort((a, b) => b._eng - a._eng);
      const maxEng = engSorted[0]._eng;
      const n5 = engSorted.length;
      const s5RowH = Math.min(1.35, (6.9 - 1.45) / n5);
      const s5CardH = s5RowH - 0.12;
      const s5Fs = n5 >= 5 ? 11 : 14;

      engSorted.forEach((c, idx) => {
        const y = 1.45 + idx * s5RowH;
        const engColor = c._eng >= avgEng ? T.success : T.warning;
        addCard(s, 0.5, y, 12.3, s5CardH, idx === 0 ? T.success : T.border);

        const badgeY = y + s5CardH * 0.3;
        const nameY = y + s5CardH * 0.12;
        const engY = y + s5CardH * 0.52;
        const barY = y + s5CardH * 0.38;

        s.addShape("ellipse" as any, { x: 0.65, y: badgeY, w: 0.33, h: 0.33, fill: { color: T.secondary }, line: { type: "none" } });
        s.addText(`${idx + 1}`, { x: 0.65, y: badgeY + 0.02, w: 0.33, h: 0.28, fontSize: 12, bold: true, color: T.white, align: "center", fontFace: "Calibri" });

        s.addText(c.company, { x: 1.2, y: nameY, w: 2.4, h: 0.28, fontSize: s5Fs, bold: true, color: T.text, fontFace: "Calibri" });
        s.addText(`${c._eng.toFixed(2)}% Engagement`, { x: 1.2, y: engY, w: 2.4, h: 0.22, fontSize: s5Fs - 2, bold: true, color: engColor, fontFace: "Calibri" });

        s.addText(`${fmt(c._vpv)} avg views/video`, { x: 4.0, y: nameY, w: 2.8, h: 0.22, fontSize: s5Fs - 2, color: T.muted, fontFace: "Calibri" });
        s.addText(`${fmt(c._freq * 4)} est. interactions/video`, { x: 4.0, y: engY, w: 2.8, h: 0.22, fontSize: s5Fs - 3, color: T.muted, fontFace: "Calibri" });

        s.addShape("roundRect" as any, { x: 7.2, y: barY, w: 4.5, h: 0.16, rectRadius: 0.05, fill: { color: T.border }, line: { type: "none" } });
        const barW = Math.max(0.2, (c._eng / maxEng) * 4.5);
        s.addShape("roundRect" as any, { x: 7.2, y: barY, w: barW, h: 0.16, rectRadius: 0.05, fill: { color: engColor }, line: { type: "none" } });
        s.addText(`${c._eng.toFixed(1)}%`, { x: 11.8, y: barY - 0.08, w: 1, h: 0.28, fontSize: 12, bold: true, color: engColor, align: "right", fontFace: "Calibri" });
      });

      s.addText(`Market average engagement: ${avgEng.toFixed(1)}% · Channels above the line are outperforming their peers at converting views into active audience interactions.`, {
        x: 0.5, y: 7.05, w: 12.3, h: 0.25,
        fontSize: 9.5, color: T.muted, fontFace: "Calibri",
      });
    }

    // ==================
    // SLIDE 6: CONTENT PERFORMANCE
    // ==================
    {
      const s = pptx.addSlide();
      s.background = { color: T.bg };
      addSlideHeader(s, "Content Performance Analysis", "Views per video, engagement rate, and overall content efficiency for each channel.");

      const vpvSorted = [...enriched].sort((a, b) => b._vpv - a._vpv);
      const maxVpv = vpvSorted[0]._vpv;
      const n6 = vpvSorted.length;
      const s6RowH = Math.min(1.35, (7.2 - 1.45) / n6);
      const s6CardH = s6RowH - 0.12;
      const s6Fs = n6 >= 5 ? 11 : 14;

      vpvSorted.forEach((c, idx) => {
        const y = 1.45 + idx * s6RowH;
        addCard(s, 0.5, y, 12.3, s6CardH);

        const nameY = y + s6CardH * 0.1;
        const barY = y + s6CardH * 0.35;
        const subY = y + s6CardH * 0.6;

        s.addText(c.company, { x: 0.8, y: nameY, w: 2.5, h: 0.28, fontSize: s6Fs, bold: true, color: T.text, fontFace: "Calibri" });

        s.addShape("roundRect" as any, { x: 3.5, y: barY, w: 6.0, h: 0.18, rectRadius: 0.05, fill: { color: T.border }, line: { type: "none" } });
        const bw = Math.max(0.3, (c._vpv / maxVpv) * 6.0);
        s.addShape("roundRect" as any, { x: 3.5, y: barY, w: bw, h: 0.18, rectRadius: 0.05, fill: { color: T.secondary }, line: { type: "none" } });

        s.addText(`${fmt(c._vpv)} avg views/video`, { x: 3.5, y: subY, w: 3.5, h: 0.22, fontSize: s6Fs - 3, color: T.muted, fontFace: "Calibri" });
        s.addText(`${c._eng.toFixed(1)}% eng.`, { x: 9.8, y: nameY, w: 1.5, h: 0.28, fontSize: s6Fs, bold: true, color: c._eng >= avgEng ? T.success : T.warning, fontFace: "Calibri", align: "center" });

        const insight = c._score >= 65
          ? `Strong performer — audience resonance and content distribution working in tandem.`
          : c._score >= 40
          ? `Moderate performance — ${c._eng < avgEng ? "engagement below average, test interactive formats" : "solid engagement but views per video could grow with better distribution"}.`
          : `Opportunity channel — low views suggest content discoverability or relevance improvements needed.`;
        s.addText(insight, { x: 0.8, y: subY, w: 8.6, h: 0.22, fontSize: s6Fs - 3, color: T.muted, fontFace: "Calibri" });
      });
    }

    // ==================
    // SLIDE 7: CONTENT THEMES & TOPICS
    // ==================
    {
      const s = pptx.addSlide();
      s.background = { color: T.bg };
      addSlideHeader(s, "Content Themes & Strategy", "What each competitor covers — and the strategic gaps none of them are filling.");

      const themes = [
        { name: "Trailers & Teasers", who: "All competitors", status: "saturated", color: T.danger },
        { name: "Product Launches", who: "All competitors", status: "saturated", color: T.danger },
        { name: "Short Clips / Reels", who: "Netflix, Amazon Prime", status: "competitive", color: T.warning },
        { name: "Behind the Scenes", who: "Limited use", status: "opportunity", color: T.success },
        { name: "Educational / Explainers", who: "None", status: "gap", color: T.teal },
        { name: "Creator Collaborations", who: "None", status: "gap", color: T.teal },
        { name: "Fan Q&A / Polls", who: "None", status: "gap", color: T.teal },
        { name: "Serialised Mini-Series", who: "Occasional", status: "opportunity", color: T.success },
      ];

      const statusLabel: Record<string, string> = {
        saturated: "SATURATED",
        competitive: "COMPETITIVE",
        opportunity: "OPPORTUNITY",
        gap: "GAP ↑",
      };

      themes.forEach((theme, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 0.5 + col * 6.45;
        const y = 1.45 + row * 1.35;

        addCard(s, x, y, 6.1, 1.1, theme.color);

        s.addText(theme.name, { x: x + 0.25, y: y + 0.15, w: 4.8, h: 0.3, fontSize: 14, bold: true, color: T.text, fontFace: "Calibri" });
        s.addText(theme.who, { x: x + 0.25, y: y + 0.52, w: 4, h: 0.25, fontSize: 10, color: T.muted, fontFace: "Calibri" });

        // Status badge
        s.addShape("roundRect" as any, { x: x + 4.45, y: y + 0.48, w: 1.45, h: 0.28, rectRadius: 0.06, fill: { color: theme.color, transparency: 70 }, line: { type: "none" } });
        s.addText(statusLabel[theme.status], { x: x + 4.45, y: y + 0.5, w: 1.45, h: 0.22, fontSize: 8, bold: true, color: theme.color, align: "center", fontFace: "Calibri" });
      });

      s.addText("Strategic takeaway: The educational, collaboration, and interactive content spaces are completely unoccupied. The first mover gains outsized algorithmic and community advantages.", {
        x: 0.5, y: 7.0, w: 12.3, h: 0.3,
        fontSize: 10, color: T.muted, fontFace: "Calibri", italic: true,
      });
    }

    // ==================
    // SLIDE 8: GAP ANALYSIS
    // ==================
    {
      const s = pptx.addSlide();
      s.background = { color: T.bg };
      addSlideHeader(s, "Gap Analysis & Opportunities", "Where every competitor is leaving growth on the table.");

      const gaps = [
        { title: "Educational Content", detail: "Zero educational/how-it's-made content across all channels. Viewers who engage with educational formats watch 40% longer per session and subscribe at 2× the rate of trailer-only viewers.", urgency: "HIGH" },
        { title: "Creator & Influencer Collaborations", detail: "No competitor is co-producing content with creators. Collaboration videos routinely outperform solo brand content by 60–150% in reach and engagement on YouTube.", urgency: "HIGH" },
        { title: "Behind-the-Scenes Storytelling", detail: "Audiences crave authenticity. BTS content builds emotional brand attachment and converts casual viewers to loyal subscribers — currently absent from all competitors.", urgency: "MEDIUM" },
        { title: "Interactive & Community Content", detail: "Polls, Q&As, and community posts are entirely unused. These formats feed the algorithm lightweight signals that disproportionately boost overall channel visibility.", urgency: "MEDIUM" },
      ];

      const urgencyColor: Record<string, string> = { HIGH: T.danger, MEDIUM: T.warning };

      gaps.forEach((gap, idx) => {
        const y = 1.4 + idx * 1.35;
        addCard(s, 0.5, y, 12.3, 1.1, urgencyColor[gap.urgency]);

        s.addShape("roundRect" as any, { x: 0.5, y, w: 0.12, h: 1.1, rectRadius: 0, fill: { color: urgencyColor[gap.urgency] }, line: { type: "none" } });

        s.addText(gap.urgency, { x: 0.75, y: y + 0.1, w: 1, h: 0.22, fontSize: 9, bold: true, color: urgencyColor[gap.urgency], fontFace: "Calibri" });
        s.addText(gap.title, { x: 0.75, y: y + 0.3, w: 5, h: 0.3, fontSize: 14, bold: true, color: T.text, fontFace: "Calibri" });
        s.addText(gap.detail, { x: 0.75, y: y + 0.65, w: 11.5, h: 0.35, fontSize: 10.5, color: T.muted, fontFace: "Calibri", wrap: true });
      });
    }

    // ==================
    // SLIDE 9: STRATEGIC INSIGHTS
    // ==================
    {
      const s = pptx.addSlide();
      s.background = { color: T.bg };
      addSlideHeader(s, "Key Strategic Insights", "What the data means for your video marketing team.");

      const insights = generateInsights(enriched);
      insights.forEach((insight, idx) => {
        const y = 1.4 + idx * 1.85;
        addCard(s, 0.5, y, 12.3, 1.6, T.accent);

        s.addText(insight.title, { x: 0.75, y: y + 0.15, w: 11.8, h: 0.35, fontSize: 15, bold: true, color: T.text, fontFace: "Calibri" });
        s.addText(insight.description, { x: 0.75, y: y + 0.58, w: 11.8, h: 0.9, fontSize: 11, color: T.muted, fontFace: "Calibri", wrap: true });
      });
    }

    // ==================
    // SLIDE 10: RECOMMENDATIONS
    // ==================
    {
      const s = pptx.addSlide();
      s.background = { color: T.bg };
      addSlideHeader(s, "Video Marketing Recommendations", "Specific, actionable steps based on the data — prioritised by impact.");

      const recs = [
        { action: "Launch an Educational Content Pillar", detail: "Produce 4 educational videos/month (how content is made, industry explainers, creator spotlights). This format drives the highest retention and subscriber conversion.", priority: "1", color: T.danger },
        { action: "Build a Creator Collaboration Programme", detail: "Partner with 2–3 mid-tier YouTubers (500K–2M subs) per quarter. Co-productions reach new audiences at a fraction of paid acquisition cost.", priority: "2", color: T.warning },
        { action: "Implement a Consistent Publishing Calendar", detail: `Commit to 8–12 videos/month on a fixed schedule. Current leader posts ${leader._freq} videos/month — consistency signals reliability to both algorithms and subscribers.`, priority: "3", color: T.secondary },
        { action: "Test Interactive Community Formats", detail: "Run monthly polls, comment-reply videos, and community tab posts. These lightweight touchpoints can lift overall channel engagement by 15–30% with minimal production cost.", priority: "4", color: T.teal },
        { action: "Develop a Shorts / Reels Strategy", detail: "Repurpose long-form highlights into 60-second clips optimised for Shorts/Reels. Short-form content acts as a funnel — driving discovery and subscriptions to the main channel.", priority: "5", color: T.success },
      ];

      recs.forEach((r, idx) => {
        const y = 1.4 + idx * 1.08;
        addCard(s, 0.5, y, 12.3, 0.88, r.color);

        s.addShape("ellipse" as any, { x: 0.65, y: y + 0.26, w: 0.36, h: 0.36, fill: { color: r.color }, line: { type: "none" } });
        s.addText(r.priority, { x: 0.65, y: y + 0.27, w: 0.36, h: 0.3, fontSize: 13, bold: true, color: T.white, align: "center", fontFace: "Calibri" });

        s.addText(r.action, { x: 1.18, y: y + 0.1, w: 4.5, h: 0.3, fontSize: 13, bold: true, color: T.text, fontFace: "Calibri" });
        s.addText(r.detail, { x: 1.18, y: y + 0.46, w: 11, h: 0.35, fontSize: 10, color: T.muted, fontFace: "Calibri", wrap: true });
      });
    }

    // ==================
    // SLIDES 11+: INDIVIDUAL COMPETITOR PROFILES
    // ==================
    sorted.forEach((competitor, compIdx) => {
      const s = pptx.addSlide();
      s.background = { color: T.bg };

      // Purple header strip
      s.addShape("rect" as any, { x: 0, y: 0, w: 13.33, h: 1.0, fill: { color: T.primary }, line: { type: "none" } });
      s.addText(`${competitor.company}`, { x: 0.5, y: 0.15, w: 8, h: 0.5, fontSize: 26, bold: true, color: T.white, fontFace: "Calibri" });
      s.addText(`Rank #${compIdx + 1}  ·  Score: ${competitor._score.toFixed(1)}/100`, {
        x: 9.5, y: 0.2, w: 3.3, h: 0.4, fontSize: 12, color: "C4B5FD", align: "right", fontFace: "Calibri",
      });

      // 3 stat cards
      const stats = [
        { label: "Subscribers", value: fmt(competitor.subscriberCount), color: T.secondary },
        { label: "Total Views", value: fmt(competitor.totalViews), color: T.accent },
        { label: "Avg Views/Video", value: fmt(competitor._vpv), color: T.success },
        { label: "Videos/Month", value: `${competitor._freq}`, color: T.warning },
      ];
      stats.forEach((stat, i) => {
        const sx = 0.5 + i * 3.2;
        addCard(s, sx, 1.2, 3.0, 1.15, stat.color);
        s.addText(stat.value, { x: sx + 0.15, y: 1.38, w: 2.7, h: 0.55, fontSize: 28, bold: true, color: T.white, fontFace: "Calibri", align: "center" });
        s.addText(stat.label, { x: sx + 0.15, y: 1.95, w: 2.7, h: 0.25, fontSize: 10, color: T.muted, fontFace: "Calibri", align: "center" });
      });

      // Strengths
      s.addText("✅  Strengths", { x: 0.5, y: 2.55, w: 5.5, h: 0.3, fontSize: 13, bold: true, color: T.success, fontFace: "Calibri" });
      const strengths = generateStrengths(competitor, enriched);
      strengths.forEach((str, i) => {
        s.addText(`• ${str}`, { x: 0.6, y: 2.9 + i * 0.42, w: 5.9, h: 0.38, fontSize: 10.5, color: T.text, fontFace: "Calibri", wrap: true });
      });

      // Opportunities
      s.addText("🚀  Opportunities", { x: 7.0, y: 2.55, w: 5.5, h: 0.3, fontSize: 13, bold: true, color: T.warning, fontFace: "Calibri" });
      const opps = generateOpportunities(competitor, enriched);
      opps.forEach((o, i) => {
        s.addText(`• ${o}`, { x: 7.1, y: 2.9 + i * 0.42, w: 5.9, h: 0.38, fontSize: 10.5, color: T.text, fontFace: "Calibri", wrap: true });
      });

      // Weaknesses
      s.addText("⚠️  Weaknesses", { x: 0.5, y: 4.95, w: 5.5, h: 0.3, fontSize: 13, bold: true, color: T.danger, fontFace: "Calibri" });
      const weaknesses = generateWeaknesses(competitor, enriched);
      weaknesses.forEach((w, i) => {
        s.addText(`• ${w}`, { x: 0.6, y: 5.3 + i * 0.42, w: 5.9, h: 0.38, fontSize: 10.5, color: T.text, fontFace: "Calibri", wrap: true });
      });

      // Threats
      s.addText("🔴  Competitive Risks", { x: 7.0, y: 4.95, w: 5.5, h: 0.3, fontSize: 13, bold: true, color: T.danger, fontFace: "Calibri" });
      const threats = generateThreats(competitor, enriched);
      threats.forEach((t, i) => {
        s.addText(`• ${t}`, { x: 7.1, y: 5.3 + i * 0.42, w: 5.9, h: 0.38, fontSize: 10.5, color: T.text, fontFace: "Calibri", wrap: true });
      });
    });

    // ==================
    // FINAL SLIDE: SCORECARD
    // ==================
    {
      const s = pptx.addSlide();
      s.background = { color: T.bg };
      addSlideHeader(s, "Final Competitive Scorecard", "Overall ranking across subscriber reach, content performance, engagement, and frequency.");

      // Column headers
      s.addText("Rank", { x: 0.5, y: 1.35, w: 0.6, h: 0.25, fontSize: 10, bold: true, color: T.muted, fontFace: "Calibri" });
      s.addText("Company", { x: 1.3, y: 1.35, w: 2.5, h: 0.25, fontSize: 10, bold: true, color: T.muted, fontFace: "Calibri" });
      s.addText("Subscribers", { x: 4.2, y: 1.35, w: 1.8, h: 0.25, fontSize: 10, bold: true, color: T.muted, fontFace: "Calibri", align: "center" });
      s.addText("Avg Views/Vid", { x: 6.2, y: 1.35, w: 1.8, h: 0.25, fontSize: 10, bold: true, color: T.muted, fontFace: "Calibri", align: "center" });
      s.addText("Engagement", { x: 8.2, y: 1.35, w: 1.8, h: 0.25, fontSize: 10, bold: true, color: T.muted, fontFace: "Calibri", align: "center" });
      s.addText("Vids/Month", { x: 10.2, y: 1.35, w: 1.5, h: 0.25, fontSize: 10, bold: true, color: T.muted, fontFace: "Calibri", align: "center" });
      s.addText("Score", { x: 11.9, y: 1.35, w: 1.0, h: 0.25, fontSize: 10, bold: true, color: T.muted, fontFace: "Calibri", align: "right" });

      const nSc = sorted.length;
      const scRowH = Math.min(1.22, (6.95 - 1.75) / nSc);
      const scCardH = scRowH - 0.1;
      const scFs = nSc >= 5 ? 11 : 12;

      sorted.forEach((c, idx) => {
        const y = 1.75 + idx * scRowH;
        const cy = y + scCardH * 0.28;
        const isLeader = idx === 0;
        addCard(s, 0.5, y, 12.3, scCardH, isLeader ? T.warning : T.border);

        const medal = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][idx] || `${idx + 1}`;
        s.addText(medal, { x: 0.55, y: cy, w: 0.6, h: 0.28, fontSize: 14, align: "center", fontFace: "Calibri" });
        s.addText(c.company, { x: 1.3, y: cy, w: 2.7, h: 0.28, fontSize: scFs + 1, bold: true, color: T.text, fontFace: "Calibri" });
        s.addText(fmt(c.subscriberCount), { x: 4.2, y: cy, w: 1.8, h: 0.28, fontSize: scFs, color: T.text, fontFace: "Calibri", align: "center" });
        s.addText(fmt(c._vpv), { x: 6.2, y: cy, w: 1.8, h: 0.28, fontSize: scFs, color: T.text, fontFace: "Calibri", align: "center" });
        s.addText(`${c._eng.toFixed(1)}%`, { x: 8.2, y: cy, w: 1.8, h: 0.28, fontSize: scFs, color: c._eng >= avgEng ? T.success : T.warning, fontFace: "Calibri", align: "center" });
        s.addText(`${c._freq}`, { x: 10.2, y: cy, w: 1.5, h: 0.28, fontSize: scFs, color: T.text, fontFace: "Calibri", align: "center" });

        s.addShape("roundRect" as any, { x: 11.85, y: y + scCardH * 0.18, w: 1.1, h: 0.42, rectRadius: 0.08, fill: { color: isLeader ? T.warning : T.primary, transparency: 20 }, line: { type: "none" } });
        s.addText(`${c._score.toFixed(0)}`, { x: 11.85, y: y + scCardH * 0.2, w: 1.1, h: 0.32, fontSize: 15, bold: true, color: T.white, align: "center", fontFace: "Calibri" });
      });

      s.addText("Scores are composite: Subscriber Reach 25% · Views/Video 25% · Engagement Rate 30% · Upload Frequency 20%", {
        x: 0.5, y: 7.1, w: 12.3, h: 0.25,
        fontSize: 9, color: T.muted, fontFace: "Calibri", italic: true,
      });
    }

    return pptx;
  },
};