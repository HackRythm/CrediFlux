import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  UserCheck,
  History,
  BarChart3,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { HealthResponse, UserProfile } from '../types';
import { ProfileMenu } from './ProfileMenu';

interface NavbarProps {
  health: HealthResponse | null;
  healthError: string | null;
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  healthError,
  profile,
  onUpdateProfile,
}) => {
  return (
    <header className="navbar">
      <div className="brand-section">
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="brand-logo-icon">CF</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-title">CrediFlux</span>
              <span className="brand-tag">Audited ML</span>
            </div>
          </div>
        </NavLink>
      </div>

      <nav className="nav-links" aria-label="Main Navigation">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <Activity size={16} />
          <span>Overview</span>
        </NavLink>

        <NavLink
          to="/assess"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <UserCheck size={16} />
          <span>Applicant Intake</span>
        </NavLink>

        <NavLink
          to="/retrospective"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <History size={16} />
          <span>Retrospective Scoring</span>
        </NavLink>

        <NavLink
          to="/insights"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <BarChart3 size={16} />
          <span>Model Insights</span>
        </NavLink>

        <NavLink
          to="/audit"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FileSearch size={16} />
          <span>Feasibility Audit</span>
        </NavLink>
      </nav>

      <div className="header-actions">
        {health ? (
          <div className="status-pill healthy" title={`Models loaded: ${health.loaded_models.join(', ')}`}>
            <span className="pulse-dot" />
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={12} />
              API Ready (sklearn {health.sklearn_version})
            </span>
          </div>
        ) : (
          <div className="status-pill error" title={healthError || 'Connecting to backend...'}>
            <span className="pulse-dot" />
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <AlertTriangle size={12} />
              {healthError ? 'Backend Disconnected' : 'Connecting...'}
            </span>
          </div>
        )}

        <ProfileMenu profile={profile} onUpdateProfile={onUpdateProfile} />
      </div>
    </header>
  );
};
