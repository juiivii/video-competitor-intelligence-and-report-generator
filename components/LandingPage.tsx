'use client';

import { useState } from 'react';
import { Play, TrendingUp, BarChart3, Zap } from 'lucide-react';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

interface LandingPageProps {
  onAnalyze: (mainCompany: string, competitors: string[]) => void;
  isLoading: boolean;
}

export function LandingPage({ onAnalyze, isLoading }: LandingPageProps) {
  const [mainCompany, setMainCompany] = useState<string>('');
  const [competitors, setCompetitors] = useState<string[]>(['', '', '', '']);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const isMobile = useIsMobile();

  const handleMainCompanyChange = (value: string) => setMainCompany(value);

  const handleCompetitorChange = (index: number, value: string) => {
    const newCompetitors = [...competitors];
    newCompetitors[index] = value;
    setCompetitors(newCompetitors);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!mainCompany.trim()) newErrors.mainCompany = 'Company name is required';
    const filled = competitors.filter((c) => c.trim().length > 0);
    if (filled.length === 0) newErrors.competitors = 'At least one competitor is required';
    const all = [mainCompany, ...competitors].map((c) => c.toLowerCase());
    const unique = new Set(all.filter((c) => c.length > 0));
    if (unique.size < all.filter((c) => c.length > 0).length)
      newErrors.duplicates = 'Duplicate company names detected';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const filled = competitors.filter((c) => c.trim().length > 0);
      onAnalyze(mainCompany, filled);
    }
  };

  const loadExample = (main: string, comps: string[]) => {
    setMainCompany(main);
    setCompetitors([...comps, '', '', ''].slice(0, 4));
    setErrors({});
  };

  const features = [
    { icon: TrendingUp, title: 'Real-Time Analytics', description: 'Live YouTube data for accurate competitor insights' },
    { icon: BarChart3, title: 'Strategic Intelligence', description: 'Deep analysis of engagement, content & growth patterns' },
    { icon: Zap, title: 'Instant Reports', description: 'Professional PowerPoint exports in seconds' },
  ];

  const examples = [
    { main: 'Apple', competitors: ['Microsoft', 'Google', 'Samsung'] },
    { main: 'Netflix', competitors: ['Disney+', 'Amazon Prime', 'HBO Max'] },
    { main: 'Tesla', competitors: ['BMW', 'Audi', 'Mercedes'] },
  ];

  const px = isMobile ? '16px' : '48px';

  return (
    <div style={{ minHeight: "100vh", width: "100vw", maxWidth: "100vw", overflowX: "hidden", backgroundColor: '#0B1020', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#F8FAFC' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `18px ${px}`, borderBottom: '1px solid #1E293B' }}>
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#F8FAFC' }}>
          Video<span style={{ color: "#8B5CF6" }}>IQ</span>
        </span>
        <span style={{ fontSize: '11px', background: '#1A2440', color: '#8B5CF6', border: '1px solid #2D1F6E', borderRadius: '20px', padding: '4px 12px', fontWeight: 500, letterSpacing: '0.5px' }}>
          YouTube Intelligence
        </span>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: isMobile ? '40px 16px 32px' : '64px 48px 48px' }}>
        <div style={{ fontSize: '11px', color: '#8B5CF6', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>
          YouTube Competitor Intelligence
        </div>
        <h1 style={{ fontSize: isMobile ? '30px' : '52px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 16px', lineHeight: 1.15 }}>
          Video Intelligence <span style={{ color: '#8B5CF6' }}>Report</span>
        </h1>
        <p style={{ fontSize: isMobile ? '15px' : '17px', color: '#94A3B8', maxWidth: '500px', margin: '0 auto 36px', lineHeight: 1.65 }}>
          Analyze your competitors' YouTube strategy in minutes. Get actionable insights, download professional reports, and stay ahead of the competition.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => loadExample(ex.main, ex.competitors)}
              style={{ fontSize: '12px', background: '#121A2B', color: '#94A3B8', border: '1px solid #1E293B', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer' }}
            >
              {ex.main} vs {ex.competitors[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', maxWidth: '900px', margin: '0 auto 48px', padding: `0 ${px}` }}>
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} style={{ background: '#121A2B', border: '1px solid #1E293B', borderRadius: '16px', padding: isMobile ? '18px' : '24px', display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'flex-start', gap: isMobile ? '14px' : '0' }}>
              <div style={{ width: '40px', height: '40px', flexShrink: 0, background: '#1A1040', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: isMobile ? 0 : '14px' }}>
                <Icon size={20} color="#8B5CF6" />
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC', margin: '0 0 6px' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>{f.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: `0 ${px} 48px` }}>
        <div style={{ background: '#121A2B', border: '1px solid #1E293B', borderRadius: '20px', padding: isMobile ? '24px 20px' : '36px' }}>
          <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 28px' }}>Start Your Analysis</h2>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Your Company Name *
            </label>
            <input
              placeholder="e.g., TechCorp Marketing"
              value={mainCompany}
              onChange={(e) => handleMainCompanyChange(e.target.value)}
              disabled={isLoading}
              style={{ width: '100%', boxSizing: 'border-box', background: '#0B1020', border: `1px solid ${errors.mainCompany ? '#EF4444' : '#243049'}`, borderRadius: '10px', padding: '12px 16px', fontSize: '14px', color: '#F8FAFC', outline: 'none', fontFamily: 'inherit' }}
            />
            {errors.mainCompany && <p style={{ color: '#EF4444', fontSize: '12px', margin: '6px 0 0' }}>{errors.mainCompany}</p>}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Competitors (Add up to 4)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
              {competitors.map((competitor, idx) => (
                <input
                  key={idx}
                  placeholder={`Competitor ${idx + 1}`}
                  value={competitor}
                  onChange={(e) => handleCompetitorChange(idx, e.target.value)}
                  disabled={isLoading}
                  style={{ background: '#0B1020', border: '1px solid #243049', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', color: '#F8FAFC', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
                />
              ))}
            </div>
            {errors.competitors && <p style={{ color: '#EF4444', fontSize: '12px', margin: '8px 0 0' }}>{errors.competitors}</p>}
            {errors.duplicates && <p style={{ color: '#EF4444', fontSize: '12px', margin: '8px 0 0' }}>{errors.duplicates}</p>}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{ width: '100%', background: isLoading ? '#4C1D95' : '#7C3AED', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontFamily: 'inherit' }}
          >
            {isLoading ? (
              <>
                <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Analyzing...
              </>
            ) : (
              <>
                <Play size={17} />
                Generate Report
              </>
            )}
          </button>
        </div>

        {/* Popular analyses */}
        <div style={{ marginTop: '32px' }}>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#4A5568', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>
            Popular Analyses
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
            {examples.map((ex, i) => (
              <div
                key={i}
                onClick={() => loadExample(ex.main, ex.competitors)}
                style={{ background: '#121A2B', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: isMobile ? 'row' : 'column', justifyContent: isMobile ? 'space-between' : 'flex-start', alignItems: isMobile ? 'center' : 'flex-start' }}
              >
                <p style={{ fontWeight: 600, color: '#F8FAFC', margin: isMobile ? 0 : '0 0 4px', fontSize: '14px' }}>{ex.main}</p>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>vs {ex.competitors.slice(0, 2).join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: `20px ${px} 28px`, borderTop: '1px solid #1E293B' }}>
        <p style={{ fontSize: '13px', color: '#4A5568', margin: 0 }}>
          Built by <span style={{ color: '#8B5CF6', fontWeight: 600 }}>Jivesh Karthikeyan</span>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #4A5568 !important; }
        input:focus { border-color: #8B5CF6 !important; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15); }
        button:hover:not(:disabled) { background: #6D28D9 !important; }
      `}</style>
    </div>
  );
}
