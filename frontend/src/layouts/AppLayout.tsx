import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';
import type { HealthResponse, UserProfile } from '../types';
import { ShieldAlert, Terminal, Cpu } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Auditor Terminal',
    title: 'Lead Credit Risk Architect',
    organization: 'CrediFlux Governance Lab',
    role: 'Model Risk Auditor',
    riskTolerance: 'Conservative',
  });

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      try {
        const data = await api.getHealth();
        if (isMounted) {
          setHealth(data);
          setHealthError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setHealth(null);
          setHealthError(err.message || 'Failed to connect');
        }
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  return (
    <div className="app-container">
      <Navbar
        health={health}
        healthError={healthError}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
      />

      <main className="main-content">
        <Outlet context={{ health, profile }} />
      </main>

      <footer className="app-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)' }}>
            <Cpu size={14} color="var(--accent-teal)" />
            <span>FastAPI + Scikit-Learn 1.7.2 + React 18</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Terminal size={14} />
            <span>Branch: <code>feature/crediflux-app</code></span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <ShieldAlert size={14} color="var(--status-elevated)" />
          <span>Responsible AI Notice: Prospective predictions are blocked to prevent underwriting leakage.</span>
        </div>
      </footer>
    </div>
  );
};
