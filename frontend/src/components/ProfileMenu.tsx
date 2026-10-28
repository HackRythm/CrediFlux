import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, ChevronDown, Check, Sliders, ExternalLink } from 'lucide-react';
import type { UserProfile } from '../types';

interface ProfileMenuProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ profile, onUpdateProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roles: UserProfile['role'][] = [
    'Model Risk Auditor',
    'Credit Underwriter',
    'ML Engineer',
  ];

  const tolerances: UserProfile['riskTolerance'][] = [
    'Conservative',
    'Moderate',
    'Aggressive',
  ];

  return (
    <div className="profile-menu-container" ref={menuRef}>
      <button
        type="button"
        className="profile-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="profile-avatar">
          <User size={14} />
        </div>
        <span>{profile.name}</span>
        <ChevronDown size={14} style={{ opacity: 0.7 }} />
      </button>

      {isOpen && (
        <div className="profile-dropdown" role="menu">
          <div className="profile-dropdown-header">
            <div className="profile-name">{profile.name}</div>
            <div className="profile-role">{profile.title}</div>
            <div className="profile-org">{profile.organization}</div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldCheck size={12} /> Active Perspective
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.375rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    backgroundColor: profile.role === r ? 'var(--accent-teal-subtle)' : 'transparent',
                    color: profile.role === r ? 'var(--accent-teal)' : 'var(--text-secondary)',
                    fontWeight: profile.role === r ? 600 : 500,
                    textAlign: 'left',
                  }}
                  onClick={() => onUpdateProfile({ role: r })}
                >
                  <span>{r}</span>
                  {profile.role === r && <Check size={14} color="var(--accent-teal)" />}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Sliders size={12} /> Underwriting Posture
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {tolerances.map((t) => (
                <button
                  key={t}
                  type="button"
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.375rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.6875rem',
                    fontWeight: profile.riskTolerance === t ? 600 : 500,
                    border: profile.riskTolerance === t ? '1px solid var(--accent-teal-border)' : '1px solid var(--border-color)',
                    backgroundColor: profile.riskTolerance === t ? 'var(--accent-teal-subtle)' : 'var(--bg-surface)',
                    color: profile.riskTolerance === t ? 'var(--accent-teal)' : 'var(--text-secondary)',
                    textAlign: 'center',
                  }}
                  onClick={() => onUpdateProfile({ riskTolerance: t })}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>Runtime Engine:</span>
              <span style={{ color: 'var(--text-secondary)' }}>Scikit-Learn 1.7.2</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Phase 0 Audit:</span>
              <span style={{ color: 'var(--accent-teal)' }}>Verified (223 Lines)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigate('/audit');
                setIsOpen(false);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: 'var(--accent-teal)',
                fontSize: '0.75rem',
                textDecoration: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              View Feasibility Audit Matrix <ExternalLink size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
