'use client';

import { useState } from 'react';
import { Download, BarChart3, Zap, Target, TrendingUp, Activity } from 'lucide-react';
import { AnalysisReport } from '@/lib/types';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

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

function safeNum(val: unknown): number {
  const n = Number(val);
  return isFinite(n) ? n : 0;
}

// FIX: robust array extraction — guards against undefined, null, non-array
function safeArr(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v) => typeof v === 'string' && v.length > 0);
  return [];
}

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
  const [showDebug, setShowDebug] = useState(false);

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

  if (!report || !Array.isArray(report.competitors) || report.competitors.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontFamily: 'system-ui,sans-serif' }}>
        <p>No report data available. Please run an analysis first.</p>
      </div>
    );
  }

  const sorted = [...report.competitors].sort((a, b) => safeNum(b.overallScore) - safeNum(a.overallScore));
  const maxScore = Math.max(...sorted.map(c => safeNum(c.overallScore)), 1);
  const avgScore = report.competitors.reduce((s, c) => s + safeNum(c.overallScore), 0) / report.competitors.length;

  const subscriberData = report.competitors.map(c => ({
    name: c.company,
    subscribers: safeNum(c.subscriberCount),
  }));

  const engagementData = report.competitors.map(c => ({
    name: c.company,
    engagement: safeNum(c.analytics?.engagementRate),
    avgViews: safeNum(c.analytics?.averageViews),
    avgLikes: safeNum(c.analytics?.averageLikes),
    avgComments: safeNum(c.analytics?.averageComments),
  }));

  const frequencyData = report.competitors.map(c => ({
    name: c.company,
    uploadsPerMonth: safeNum(c.analytics?.uploadFrequency),
    consistency: safeNum(c.analytics?.uploadConsistency),
  }));

  const maxSubs = Math.max(...report.competitors.map(c => safeNum(c.subscriberCount)), 1);
  const maxViews = Math.max(...report.competitors.map(c => safeNum(c.totalViews)), 1);
  const maxVids = Math.max(...report.competitors.map(c => safeNum(c.totalVideos)), 1);

  const radarData = report.competitors.map(c => ({
    name: c.company,
    subscribers: Math.round((safeNum(c.subscriberCount) / maxSubs) * 100),
    views: Math.round((safeNum(c.totalViews) / maxViews) * 100),
    videos: Math.round((safeNum(c.totalVideos) / maxVids) * 100),
  }));

  const allEngagementZero = engagementData.every(d => d.engagement === 0);
  const allFrequencyZero = frequencyData.every(d => d.uploadsPerMonth === 0 && d.consistency === 0);

  return (
    <div style={{ minHeight: '100vh', width: '100vw', backgroundColor: C.bg, fontFamily: 'system-ui,-apple-system,sans-serif', color: C.text }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
          <div>
            <div style={{ fontSize: '11px', color: C.primary, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>
              Analysis Complete
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 700, color: C.text, margin: '0 0 8px' }}>Video Intelligence Report</h1>
            <p style={{ fontSize: '14px', color: C.muted, margin: 0 }}>
              Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <div style={{ marginBottom: '32px', background: '#0A0A1A', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px', overflow: 'auto' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: C.warning, margin: '0 0 12px' }}>⚠ Debug: Raw Analytics Data</p>
            <pre style={{ fontSize: '11px', color: C.muted, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(
                report.competitors.map(c => ({
                  company: c.company,
                  overallScore: c.overallScore,
                  subscriberCount: c.subscriberCount,
                  totalViews: c.totalViews,
                  totalVideos: c.totalVideos,
                  strengths: c.strengths,
                  weaknesses: c.weaknesses,
                  opportunities: c.opportunities,
                  analytics: c.analytics,
                })),
                null, 2
              )}
            </pre>
          </div>
        )}

        {/* Executive Summary */}
        <div style={{ marginBottom: '48px' }}>
          <SectionTitle>Executive Summary</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Market Leader', value: report.summary?.topPerformer ?? sorted[0]?.company ?? '—', sub: 'Highest overall competitive score', color: C.primary },
              { label: 'Average Performance', value: `${avgScore.toFixed(1)}/100`, sub: 'Across all analyzed competitors', color: C.success },
              { label: 'Channels Analyzed', value: String(report.competitors.length), sub: 'Professional YouTube channels', color: C.secondary },
            ].map((m, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${m.color}`, borderRadius: '16px', padding: '24px' }}>
                <p style={{ fontSize: '12px', color: C.muted, margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</p>
                <p style={{ fontSize: '28px', fontWeight: 700, color: C.text, margin: '0 0 6px' }}>{m.value}</p>
                <p style={{ fontSize: '12px', color: C.faint, margin: 0 }}>{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rankings */}
        <div style={{ marginBottom: '48px' }}>
          <SectionTitle>Competitive Rankings</SectionTitle>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sorted.map((comp, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: idx === 0 ? C.primary : C.cardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: C.text, margin: '0 0 2px', fontSize: '15px' }}>{comp.company}</p>
                    <p style={{ fontSize: '12px', color: C.faint, margin: 0 }}>
                      {fmt(safeNum(comp.subscriberCount))} subscribers · {fmt(safeNum(comp.totalVideos))} videos
                    </p>
                  </div>
                  <div style={{ width: '200px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, background: C.cardAlt, borderRadius: '6px', height: '8px' }}>
                      <div style={{ width: `${(safeNum(comp.overallScore) / maxScore) * 100}%`, background: safeNum(comp.overallScore) >= 70 ? C.success : safeNum(comp.overallScore) >= 40 ? C.warning : C.danger, borderRadius: '6px', height: '8px' }} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.text, minWidth: '45px', textAlign: 'right' }}>{safeNum(comp.overallScore).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Channel Comparison Table */}
        <div style={{ marginBottom: '48px' }}>
          <SectionTitle>Channel Comparison</SectionTitle>
          <Card>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Company', 'Subscribers', 'Total Views', 'Videos', 'Avg Views', 'Engagement', 'Uploads/Mo'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.competitors.map((comp, idx) => {
                  const an = comp.analytics ?? {};
                  const avgViews = safeNum(an.averageViews) ||
                    (safeNum(comp.totalViews) > 0 && safeNum(comp.totalVideos) > 0
                      ? Math.round(safeNum(comp.totalViews) / safeNum(comp.totalVideos))
                      : 0);
                  return (
                    <tr key={idx} style={{ borderBottom: `1px solid ${C.border}`, background: idx % 2 === 0 ? 'transparent' : C.bgAlt }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: C.text, fontSize: '14px' }}>{comp.company}</td>
                      <td style={{ padding: '14px 16px', color: C.muted, fontSize: '14px' }}>{fmt(safeNum(comp.subscriberCount))}</td>
                      <td style={{ padding: '14px 16px', color: C.muted, fontSize: '14px' }}>{fmt(safeNum(comp.totalViews))}</td>
                      <td style={{ padding: '14px 16px', color: C.muted, fontSize: '14px' }}>{fmt(safeNum(comp.totalVideos))}</td>
                      <td style={{ padding: '14px 16px', color: C.muted, fontSize: '14px' }}>{fmt(avgViews)}</td>
                      <td style={{ padding: '14px 16px', color: C.success, fontSize: '14px', fontWeight: 600 }}>
                        {safeNum(an.engagementRate).toFixed(2)}%
                      </td>
                      <td style={{ padding: '14px 16px', color: C.secondary, fontSize: '14px', fontWeight: 600 }}>
                        {safeNum(an.uploadFrequency).toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <Card>
            <ChartTitle icon={<BarChart3 size={18} color={C.secondary} />}>Subscriber Analysis</ChartTitle>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={subscriberData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" stroke={C.faint} tick={{ fill: C.muted, fontSize: 12 }} />
                <YAxis stroke={C.faint} tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={v => fmt(v)} />
                <Tooltip formatter={(v) => [fmt(v as number), 'Subscribers']} contentStyle={tooltipStyle} labelStyle={{ color: '#FFFFFF' }} itemStyle={{ color: '#FFFFFF' }} />
                <Bar dataKey="subscribers" radius={[6, 6, 0, 0]}>
                  {subscriberData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <ChartTitle icon={<Target size={18} color={C.primary} />}>Competitive Landscape</ChartTitle>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={C.border} />
                <PolarAngleAxis dataKey="name" tick={{ fill: C.muted, fontSize: 12 }} />
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {!allEngagementZero && (
            <Card>
              <ChartTitle icon={<Activity size={18} color={C.success} />}>Engagement Rate Comparison</ChartTitle>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" stroke={C.faint} tick={{ fill: C.muted, fontSize: 12 }} />
                  <YAxis stroke={C.faint} tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v) => `${(v as number).toFixed(2)}%`} contentStyle={tooltipStyle} />
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
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={frequencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" stroke={C.faint} tick={{ fill: C.muted, fontSize: 12 }} />
                  <YAxis stroke={C.faint} tick={{ fill: C.muted, fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ color: C.muted, fontSize: '12px' }} />
                  <Bar dataKey="uploadsPerMonth" name="Uploads/Month" fill={C.warning} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="consistency" name="Consistency Score" fill={C.secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Strategic Insights — FIXED */}
        <div style={{ marginBottom: '48px' }}>
          <SectionTitle>Strategic Insights</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {report.competitors.map((comp, idx) => {
              // FIX: use safeArr() instead of (comp.x || []) to properly handle
              // undefined, null, and non-array values coming from API serialization
              const strengths     = safeArr(comp.strengths);
              const weaknesses    = safeArr(comp.weaknesses);
              const opportunities = safeArr(comp.opportunities);

              return (
                <div
                  key={idx}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: '16px',
                    padding: '24px',
                  }}
                >
                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#1A1040', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={18} color={C.primary} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '16px', color: C.text, margin: 0 }}>{comp.company}</p>
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

        {/* Export button */}
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