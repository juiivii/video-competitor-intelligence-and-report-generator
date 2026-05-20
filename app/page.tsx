'use client';

import { useState } from 'react';
import { LandingPage } from '@/components/LandingPage';
import { ChannelDiscovery } from '@/components/ChannelDiscovery';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { AnalysisReport } from '@/lib/types';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<'landing' | 'discovery' | 'analysis'>('landing');
  const [mainCompany, setMainCompany] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyzeClick = (main: string, comps: string[]) => {
    setMainCompany(main);
    setCompetitors(comps);
    setCurrentStep('discovery');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleChannelsSelected = async (channels: Record<string, string>) => {
    setIsLoading(true);
    try {
      const allCompanies = [mainCompany, ...competitors];
      const competitorData = allCompanies.map((name) => ({
        name,
        channelId: channels[name],
      }));

      console.log('[Page] Calling analysis API with:', { mainCompany, competitorData });

      const response = await fetch('/api/analysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainCompany,
          competitors: competitorData,
        }),
      });

      console.log('[Page] Analysis response status:', response.status);
      const data = await response.json();
      console.log('[Page] Analysis response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setReport(data);
      setCurrentStep('analysis');
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (error) {
      console.error('[Page] Error in handleChannelsSelected:', error);
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', maxWidth: '100vw', overflowX: 'hidden', backgroundColor: '#0B1020' }}>
      {currentStep === 'landing' && (
        <LandingPage onAnalyze={handleAnalyzeClick} isLoading={isLoading} />
      )}
      {currentStep === 'discovery' && (
        <ChannelDiscovery
          companies={[mainCompany, ...competitors]}
          onChannelsSelected={handleChannelsSelected}
          isLoading={isLoading}
        />
      )}
      {currentStep === 'analysis' && report && (
        <div>
          <div style={{ backgroundColor: '#0B1020', padding: '20px 48px', borderBottom: '1px solid #1E293B' }}>
            <button
              onClick={() => {
                setCurrentStep('landing');
                setReport(null);
              }}
              style={{ color: '#8B5CF6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, padding: 0, fontFamily: 'inherit' }}
            >
              ← Start New Analysis
            </button>
          </div>
          <AnalyticsDashboard report={report} />
        </div>
      )}
    </div>
  );
}