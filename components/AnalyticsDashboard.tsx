'use client';

import { useState } from 'react';
import { Download, BarChart3, Zap, Target, TrendingUp, Activity } from 'lucide-react';
import { AnalysisReport } from '@/lib/types';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

interface AnalyticsDashboardProps {
  report: AnalysisReport;
}

const C = {
  bg: '#0B1020', bgAlt: '#0E1428', card: '#121A2B', cardAlt: '#1A2440',
  primary: '#8B5CF6', secondary: '#3B82F6', success: '#10B981',
  warning: '#F59E0B', danger: '#EF4444', pink: '#EC4899',
  text: '#F8FAFC', muted: '#94A3B8', faint: '#64748B', border: '#1E293B',
};

const CHART_COLORS = [C.primary, C.secondary, C.success, C.warning, C.danger, C.pink];

const tooltipStyle = {
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: '8px', color: C.text, fontSize: '13px',
};

function fmt(num: number): string {
  if (!num || isNaN(num)) return '0';
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return String(Math.round(num));
}

// ─────────────────────────────────────────────────────────────
// BULLETPROOF EXTRACTION ENGINES
// ─────────────────────────────────────────────────────────────

function extractNumber(val: any): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') return isFinite(val) ? val : null;
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace(/[^0-9.-]+/g, ''));
    return !isNaN(parsed) && isFinite(parsed) ? parsed : null;
  }
  if (typeof val === 'object') {
    const numericKeys = ['value', 'rate', 'score', 'amount', 'count', 'frequency', 'consistency', 'avg', 'average'];
    for (const k of numericKeys) {
      const num = extractNumber(val[k]);
      if (num !== null) return num;
    }
    for (const key in val) {
      const num = extractNumber(val[key]);
      if (num !== null) return num;
    }
  }
  return null;
}

function findMetric(obj: any, possibleKeys: string[]): number {
  if (!obj || typeof obj !== 'object') return 0;

  for (const k of possibleKeys) {
    if (obj[k] !== undefined && obj[k] !== null) {
      const num = extractNumber(obj[k]);
      if (num !== null) return num;
    }
  }

  for (const key in obj) {
    const child = obj[key];
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      for (const k of possibleKeys) {
        if (child[k] !== undefined && child[k] !== null) {
          const num = extractNumber(child[k]);
          if (num !== null) return num;
        }
      }
    }
  }
  return 0;
}

function extractStringFromItem(item: any): string {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'object') {
    const candidates = ['text', 'description', 'value', 'strength', 'weakness', 'opportunity', 'content', 'title', 'message'];
    for (const c of candidates) {
      if (item[c] && typeof item[c] === 'string') return item[c];
    }
    if (item.title && item.description) {
      return `${item.title}: ${item.description}`;
    }
    for (const key in item) {
      if (typeof item[key] === 'string') return item[key];
    }
  }
  return String(item);
}

function cleanStringList(arr: any[]): string[] {
  return arr
    .map(extractStringFromItem)
    .map(s => s.replace(/^[-*•\d.\s]+/, '').trim())
    .filter(s => s.length > 0 && s !== '[object Object]');
}

function extractArrayLocally(val: unknown): string[] | null {
  if (!val) return null;
  if (Array.isArray(val)) {
    const cleaned = cleanStringList(val);
    if (cleaned.length > 0) return cleaned;
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        const cleaned = cleanStringList(parsed);
        if (cleaned.length > 0) return cleaned;
      }
    } catch {
      if (val.includes('\n')) {
        const cleaned = cleanStringList(val.split('\n'));
        if (cleaned.length > 0) return cleaned;
      }
      const cleaned = cleanStringList([val]);
      if (cleaned.length > 0) return cleaned;
    }
  }
  return null;
}

function findArray(obj: any, possibleKeys: string[]): string[] {
  if (!obj || typeof obj !== 'object') return [];

  for (const k of possibleKeys) {
    const found = extractArrayLocally(obj[k]);
    if (found) return found;
  }

  for (const key in obj) {
    const child = obj[key];
    if (child && typeof child === 'object') {
      for (const k of possibleKeys) {
        const found = extractArrayLocally(child[k]);
        if (found) return found;
      }
    }
  }
  return [];
}

// ─────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: '22px', fontWeight: 700, color: C.text, margin: '0 0 20px' }}>
      {children}
    </h2>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', ...style }}>
      {children}
    </div>
  );
}

function ChartTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: '15px', fontWeight: 600, color: C.text, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {icon}{children}
    </h3>
  );
}

export function AnalyticsDashboard({ report }: AnalyticsDashboardProps) {
  const [isExporting, setIsExporting] = useState(false);
  const isMobile = useIsMobile();

  if (!report || !Array.isArray(report.competitors) || report.competitors.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontFamily: 'system-ui,sans-serif' }}>
        <p>No report data available. Please run an analysis first.</p>
      </div>
    );
  }

  const sorted = [...report.competitors].sort((a, b) => findMetric(b, ['overallScore', 'score']) - findMetric(a, ['overallScore', 'score']));
  const maxScore = Math.max(...sorted.map(c => findMetric(c, ['overallScore', 'score'])), 1);
  const avgScore = report.competitors.reduce((s, c) => s + findMetric(c, ['overallScore', 'score']), 0) / report.competitors.length;

  const subscriberData = report.competitors.map(c => ({
    name: c.company || 'Unknown',
    subscribers: findMetric(c, ['subscriberCount', 'subscribers', 'subscriber_count']),
  }));

  const engagementData = report.competitors.map(c => ({
    name: c.company || 'Unknown',
    engagement: findMetric(c, ['engagementRate', 'engagement', 'engagement_rate', 'engagementPercentage']),
    avgViews: findMetric(c, ['averageViews', 'avgViews', 'average_views']),
  }));

  const frequencyData = report.competitors.map(c => ({
    name: c.company || 'Unknown',
    uploadsPerMonth: findMetric(c, ['uploadFrequency', 'uploadsPerMonth', 'uploads_per_month', 'frequency']),
    consistency: findMetric(c, ['uploadConsistency', 'consistency']),
  }));

  const maxSubs = Math.max(...report.competitors.map(c => findMetric(c, ['subscriberCount', 'subscribers'])), 1);
  const maxViews = Math.max(...report.competitors.map(c => findMetric(c, ['totalViews', 'views'])), 1);
  const maxVids = Math.max(...report.competitors.map(c => findMetric(c, ['totalVideos', 'videos'])), 1);

  const radarData = report.competitors.map(c => ({
    name: c.company || 'Unknown',
    subscribers: Math.round((findMetric(c, ['subscriberCount', 'subscribers']) / maxSubs) * 100) || 0,
    views: Math.round((findMetric(c, ['totalViews', 'views']) / maxViews) * 100) || 0,
    videos: Math.round((findMetric(c, ['totalVideos', 'videos']) / maxVids) * 100) || 0,
  }));

  const allEngagementZero = engagementData.every(d => d.engagement === 0);
  const allFrequencyZero = frequencyData.every(d => d.uploadsPerMonth === 0 && d.consistency === 0);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/export/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      if (!response.ok) { alert('Export failed'); return; }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'video-intelligence-report.pptx';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('PowerPoint export failed'); }
    finally { setIsExporting(false); }
  };

  const px = isMobile ? '16px' : '48px';
  const twoCol = isMobile ? '1fr' : '1fr 1fr';
  const threeCol = isMobile ? '1fr' : 'repeat(3, 1fr)';
  const chartHeight = isMobile ? 200 : 260;

  return (
    <div style={{ minHeight: '100vh', width: '100vw', backgroundColor: C.bg, fontFamily: 'system-ui,-apple-system,sans-serif', color: C.text }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '28px 16px' : '48px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: '16px', marginBottom: '40px' }}>
          <div>
            <div style={{ fontSize: '11px', color: C.primary, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>
              Analysis Complete
            </div>
            <h1 style={{ fontSize: isMobile ? '26px' : '36px', fontWeight: 700, color: C.text, margin: '0 0 8px' }}>Video Intelligence Report</h1>
            <p style={{ fontSize: '14px', color: C.muted, margin: 0 }}>
              Generated on {new Date(report.generatedAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{ flexShrink: 0, background: C.primary, border: 'none', borderRadius: '12px', padding: '12px 20px', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: isExporting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit', opacity: isExporting ? 0.7 : 1, width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
          >
            <Download size={16} />
            {isExporting ? 'Generating...' : 'Export as PowerPoint'}
          </button>
        </div>

        {/* Executive Summary */}
        <div style={{ marginBottom: '40px' }}>
          <SectionTitle>Executive Summary</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: threeCol, gap: '16px' }}>
            {[
              { label: 'Market Leader', value: report.summary?.topPerformer ?? sorted[0]?.company ?? '—', sub: 'Highest overall competitive score', color: C.primary },
              { label: 'Average Performance', value: `${avgScore.toFixed(1)}/100`, sub: 'Across all analyzed competitors', color: C.success },
              { label: 'Channels Analyzed', value: String(report.competitors.length), sub: 'Professional YouTube channels', color: C.secondary },
            ].map((m, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${m.color}`, borderRadius: '16px', padding: isMobile ? '18px' : '24px' }}>
                <p style={{ fontSize: '12px', color: C.muted, margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</p>
                <p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: C.text, margin: '0 0 6px' }}>{m.value}</p>
                <p style={{ fontSize: '12px', color: C.faint, margin: 0 }}>{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rankings */}
        <div style={{ marginBottom: '40px' }}>
          <SectionTitle>Competitive Rankings</SectionTitle>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sorted.map((comp, idx) => {
                const score = findMetric(comp, ['overallScore', 'score']);
                const subs = findMetric(comp, ['subscriberCount', 'subscribers']);
                const vids = findMetric(comp, ['totalVideos', 'videos']);
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: idx === 0 ? C.primary : C.cardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: C.text, margin: '0 0 2px', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comp.company}</p>
                      <p style={{ fontSize: '12px', color: C.faint, margin: 0 }}>
                        {fmt(subs)} subs · {fmt(vids)} videos
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {!isMobile && (
                        <div style={{ width: '120px', background: C.cardAlt, borderRadius: '6px', height: '8px' }}>
                          <div style={{ width: `${(score / maxScore) * 100}%`, background: score >= 70 ? C.success : score >= 40 ? C.warning : C.danger, borderRadius: '6px', height: '8px' }} />
                        </div>
                      )}
                      <span style={{ fontSize: '13px', fontWeight: 700, color: C.text, minWidth: '38px', textAlign: 'right' }}>{score.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Channel Comparison Table */}
        <div style={{ marginBottom: '40px' }}>
          <SectionTitle>Channel Comparison</SectionTitle>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Company', 'Subscribers', 'Total Views', 'Videos', 'Avg Views', 'Engagement', 'Uploads/Mo'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.competitors.map((comp, idx) => {
                    const subs = findMetric(comp, ['subscriberCount', 'subscribers']);
                    const totalViews = findMetric(comp, ['totalViews', 'views']);
                    const totalVideos = findMetric(comp, ['totalVideos', 'videos']);
                    const avgViews = findMetric(comp, ['averageViews', 'avgViews']) ||
                      (totalViews > 0 && totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0);

                    const engagementRate = findMetric(comp, ['engagementRate', 'engagement', 'engagement_rate', 'engagementPercentage']);
                    const uploadFrequency = findMetric(comp, ['uploadFrequency', 'uploadsPerMonth', 'uploads_per_month', 'frequency']);

                    return (
                      <tr key={idx} style={{ borderBottom: `1px solid ${C.border}`, background: idx % 2 === 0 ? 'transparent' : C.bgAlt }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: C.text, fontSize: '13px', whiteSpace: 'nowrap' }}>{comp.company}</td>
                        <td style={{ padding: '12px 14px', color: C.muted, fontSize: '13px', whiteSpace: 'nowrap' }}>{fmt(subs)}</td>
                        <td style={{ padding: '12px 14px', color: C.muted, fontSize: '13px', whiteSpace: 'nowrap' }}>{fmt(totalViews)}</td>
                        <td style={{ padding: '12px 14px', color: C.muted, fontSize: '13px', whiteSpace: 'nowrap' }}>{fmt(totalVideos)}</td>
                        <td style={{ padding: '12px 14px', color: C.muted, fontSize: '13px', whiteSpace: 'nowrap' }}>{fmt(avgViews)}</td>
                        <td style={{ padding: '12px 14px', color: C.success, fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {engagementRate.toFixed(2)}%
                        </td>
                        <td style={{ padding: '12px 14px', color: C.secondary, fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {uploadFrequency.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: twoCol, gap: '24px', marginBottom: '24px' }}>
          <Card>
            <ChartTitle icon={<BarChart3 size={18} color={C.secondary} />}>Subscriber Analysis</ChartTitle>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={subscriberData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" stroke={C.faint} tick={{ fill: C.muted, fontSize: isMobile ? 10 : 12 }} />
                <YAxis stroke={C.faint} tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={v => fmt(v)} width={40} />
                <Tooltip formatter={(v) => [fmt(v as number), 'Subscribers']} contentStyle={tooltipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} />
                <Bar dataKey="subscribers" radius={[6, 6, 0, 0]}>
                  {subscriberData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <ChartTitle icon={<Target size={18} color={C.primary} />}>Competitive Landscape</ChartTitle>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={C.border} />
                <PolarAngleAxis dataKey="name" tick={{ fill: C.muted, fontSize: isMobile ? 10 : 12 }} />
                <PolarRadiusAxis tick={{ fill: C.faint, fontSize: 10 }} />
                <Radar name="Subscribers" dataKey="subscribers" stroke={C.secondary} fill={C.secondary} fillOpacity={0.2} />
                <Radar name="Views" dataKey="views" stroke={C.success} fill={C.success} fillOpacity={0.2} />
                <Radar name="Videos" dataKey="videos" stroke={C.warning} fill={C.warning} fillOpacity={0.2} />
                <Legend wrapperStyle={{ color: C.muted, fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: twoCol, gap: '24px', marginBottom: '24px' }}>
          {!allEngagementZero && (
            <Card>
              <ChartTitle icon={<Activity size={18} color={C.success} />}>Engagement Rate Comparison</ChartTitle>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" stroke={C.faint} tick={{ fill: C.muted, fontSize: isMobile ? 10 : 12 }} />
                  <YAxis stroke={C.faint} tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={(v) => `${v}%`} width={40} />
                  <Tooltip formatter={(v) => [`${(v as number).toFixed(2)}%`, 'Engagement']} contentStyle={tooltipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} />
                  <Bar dataKey="engagement" name="Engagement %" radius={[6, 6, 0, 0]}>
                    {engagementData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {!allFrequencyZero && (
            <Card>
              <ChartTitle icon={<TrendingUp size={18} color={C.warning} />}>Upload Frequency & Consistency</ChartTitle>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={frequencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" stroke={C.faint} tick={{ fill: C.muted, fontSize: isMobile ? 10 : 12 }} />
                  <YAxis stroke={C.faint} tick={{ fill: C.muted, fontSize: 11 }} width={36} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} />
                  <Legend wrapperStyle={{ color: C.muted, fontSize: '12px' }} />
                  <Bar dataKey="uploadsPerMonth" name="Uploads/Month" fill={C.warning} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="consistency" name="Consistency Score" fill={C.secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Strategic Insights */}
        <div style={{ marginBottom: '40px' }}>
          <SectionTitle>Strategic Insights</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: twoCol, gap: '20px' }}>
            {report.competitors.map((comp, idx) => {
              const strengths = findArray(comp, ['strengths', 'strength', 'keyStrengths']);
              const weaknesses = findArray(comp, ['weaknesses', 'weakness', 'areasForImprovement']);
              const opportunities = findArray(comp, ['opportunities', 'opportunity', 'growthOpportunities']);

              return (
                <div
                  key={idx}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: '16px',
                    padding: isMobile ? '18px' : '24px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '10px', background: '#1A1040', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={18} color={C.primary} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '16px', color: C.text, margin: 0 }}>{comp.company || 'Unknown Channel'}</p>
                      <p style={{ fontSize: '11px', color: C.faint, margin: 0 }}>Strategic channel intelligence</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                    {/* Strengths */}
                    <div>
                      <p style={{ color: C.success, fontWeight: 700, fontSize: '13px', margin: '0 0 8px' }}>
                        ✓ Strengths
                      </p>
                      {strengths.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '16px', color: C.muted, fontSize: '13px', lineHeight: 1.8 }}>
                          {strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      ) : (
                        <p style={{ fontSize: '12px', color: C.faint, margin: 0, fontStyle: 'italic' }}>
                          No strengths data available
                        </p>
                      )}
                    </div>

                    {/* Weaknesses */}
                    <div>
                      <p style={{ color: C.danger, fontWeight: 700, fontSize: '13px', margin: '0 0 8px' }}>
                        ⚠ Weaknesses
                      </p>
                      {weaknesses.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '16px', color: C.muted, fontSize: '13px', lineHeight: 1.8 }}>
                          {weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      ) : (
                        <p style={{ fontSize: '12px', color: C.faint, margin: 0, fontStyle: 'italic' }}>
                          No weaknesses data available
                        </p>
                      )}
                    </div>

                    {/* Opportunities */}
                    <div>
                      <p style={{ color: C.secondary, fontWeight: 700, fontSize: '13px', margin: '0 0 8px' }}>
                        ✦ Opportunities
                      </p>
                      {opportunities.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '16px', color: C.muted, fontSize: '13px', lineHeight: 1.8 }}>
                          {opportunities.map((o, i) => <li key={i}>{o}</li>)}
                        </ul>
                      ) : (
                        <p style={{ fontSize: '12px', color: C.faint, margin: 0, fontStyle: 'italic' }}>
                          No opportunities data available
                        </p>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{ width: '100%', background: C.primary, border: 'none', borderRadius: '14px', padding: '18px', fontSize: '16px', fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontFamily: 'inherit', marginBottom: '48px' }}
        >
          <Download size={18} />
          {isExporting ? 'Generating PowerPoint...' : 'Export as PowerPoint'}
        </button>

      </div>
    </div>
  );
}
