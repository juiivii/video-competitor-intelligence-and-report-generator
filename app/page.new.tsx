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
  };

  const handleChannelsSelected = async (channels: Record<string, string>) => {
    setIsLoading(true);
    try {
      const competitorData = competitors.map((name) => ({
        name,
        channelId: channels[name],
      }));

      const response = await fetch('/api/analysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainCompany,
          competitors: competitorData,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      setReport(data);
      setCurrentStep('analysis');
    } catch (error) {
      console.error('Error:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentStep === 'landing' && (
          <LandingPage onAnalyze={handleAnalyzeClick} isLoading={isLoading} />
        )}
        {currentStep === 'discovery' && (
          <ChannelDiscovery
            companies={competitors}
            onChannelsSelected={handleChannelsSelected}
            isLoading={isLoading}
          />
        )}
        {currentStep === 'analysis' && report && (
          <div>
            <button
              onClick={() => {
                setCurrentStep('landing');
                setReport(null);
              }}
              className="mb-6 text-blue-600 hover:text-blue-700 font-semibold"
            >
              ← Start New Analysis
            </button>
            <AnalyticsDashboard report={report} />
          </div>
        )}
      </div>
    </div>
  );
}
