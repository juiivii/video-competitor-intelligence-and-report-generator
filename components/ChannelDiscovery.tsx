'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { ChannelSearchResult } from '@/lib/types';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

interface ChannelDiscoveryProps {
  companies: string[];
  onChannelsSelected: (channels: Record<string, string>) => void;
  isLoading: boolean;
}

export function ChannelDiscovery({
  companies,
  onChannelsSelected,
  isLoading: externalLoading,
}: ChannelDiscoveryProps) {
  const [channels, setChannels] = useState<Record<string, ChannelSearchResult[]>>({});
  const [selectedChannels, setSelectedChannels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isMobile = useIsMobile();

  useEffect(() => {
    searchChannels();
  }, [companies]);

  const searchChannels = async () => {
    setLoading(true);
    const newChannels: Record<string, ChannelSearchResult[]> = {};
    const newErrors: Record<string, string> = {};

    for (const company of companies) {
      try {
        const response = await fetch('/api/channels/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: company }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to search');
        newChannels[company] = data.channels || [];
        if (data.channels && data.channels.length > 0) {
          setSelectedChannels((prev) => ({ ...prev, [company]: data.channels[0].id }));
        } else {
          newErrors[company] = `No channels found for ${company}`;
        }
      } catch (err) {
        newErrors[company] = `Failed to find channel for ${company}`;
      }
    }

    setChannels(newChannels);
    setErrors(newErrors);
    setLoading(false);
  };

  const handleChannelSelect = (company: string, channelId: string) => {
    setSelectedChannels((prev) => ({ ...prev, [company]: channelId }));
  };

  const handleContinue = () => {
    if (companies.every((c) => selectedChannels[c])) {
      onChannelsSelected(selectedChannels);
    }
  };

  const allSelected = companies.every((c) => selectedChannels[c]);

  const fmtSubs = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M subscribers`
    : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K subscribers`
    : `${n} subscribers`;

  const px = isMobile ? '16px' : '48px';

  return (
    <div style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#0B1020', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#F8FAFC', padding: px }}>
      {/* Header */}
      <div style={{ maxWidth: '860px', margin: '0 auto 40px' }}>
        <div style={{ fontSize: '11px', color: '#8B5CF6', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
          Step 2 of 3
        </div>
        <h2 style={{ fontSize: isMobile ? '26px' : '36px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 10px' }}>
          Channel Discovery
        </h2>
        <p style={{ fontSize: isMobile ? '14px' : '15px', color: '#94A3B8', margin: 0 }}>
          Confirm or select the official YouTube channel for each company
        </p>
      </div>

      {/* Company sections */}
      <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {companies.map((company) => (
          <div
            key={company}
            style={{ background: '#121A2B', border: '1px solid #1E293B', borderRadius: '16px', padding: isMobile ? '18px' : '24px' }}
          >
            {/* Company header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>{company}</h3>
              {selectedChannels[company]
                ? <CheckCircle size={22} color="#10B981" />
                : <AlertCircle size={22} color="#F59E0B" />}
            </div>

            {errors[company] && (
              <div style={{ background: '#2D1515', border: '1px solid #EF4444', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
                <p style={{ color: '#FCA5A5', fontSize: '13px', margin: 0 }}>{errors[company]}</p>
              </div>
            )}

            {loading && !channels[company] ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px' }}>
                <Loader size={24} color="#8B5CF6" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                {channels[company]?.map((channel) => {
                  const isSelected = selectedChannels[company] === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelSelect(company, channel.id)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '10px',
                        border: `1px solid ${isSelected ? '#8B5CF6' : '#243049'}`,
                        background: isSelected ? '#1A1040' : '#0B1020',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s, background 0.2s',
                        width: '100%',
                      }}
                    >
                      <p style={{ fontWeight: 600, color: '#F8FAFC', margin: '0 0 4px', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {channel.title}
                      </p>
                      {channel.subscribers && (
                        <p style={{ fontSize: '12px', color: isSelected ? '#C4B5FD' : '#64748B', margin: '0 0 4px' }}>
                          {fmtSubs(channel.subscribers)}
                        </p>
                      )}
                      <p style={{ fontSize: '11px', color: '#4A5568', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {channel.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!allSelected || externalLoading}
          style={{
            width: '100%',
            background: !allSelected || externalLoading ? '#4C1D95' : '#7C3AED',
            border: 'none',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#fff',
            cursor: !allSelected || externalLoading ? 'not-allowed' : 'pointer',
            opacity: !allSelected || externalLoading ? 0.6 : 1,
            fontFamily: 'inherit',
            marginBottom: '48px',
          }}
        >
          {externalLoading ? 'Processing...' : 'Continue to Analysis →'}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
