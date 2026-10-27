import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { ModelsResponse, ModelDetail } from '../types';
import {
  ShieldAlert,
  ArrowRight,
  Sliders,
  CheckCircle2,
  XCircle,
  Database,
  Layers,
  HelpCircle,
  TrendingDown,
  Cpu,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const [modelsData, setModelsData] = useState<ModelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadModels = async () => {
      try {
        const data = await api.getModels();
        if (isMounted) {
          setModelsData(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch model catalog');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadModels();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      {/* Crisp Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-low">Production ML</span>
            <span className="badge badge-moderate">Scikit-Learn 1.7.2</span>
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Credit Risk Command Center
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Real-time inference, model governance audit, and default prediction engine.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/retrospective" className="btn btn-primary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.75rem' }}>
            <Sliders size={13} />
            <span>Retrospective Scoring</span>
          </Link>
          <Link to="/assess" className="btn btn-secondary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.75rem' }}>
            <TrendingDown size={13} />
            <span>Test Intake</span>
          </Link>
        </div>
      </div>

      {/* High-Density KPI Bar */}
      <div className="kpi-bar">
        <div className="kpi-card">
          <div className="kpi-label">Holdout Test Set</div>
          <div className="kpi-value">10,000</div>
          <div className="kpi-subtext">Untouched Phase 10 verification</div>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-label">Feature Pipeline</div>
          <div className="kpi-value" style={{ color: 'var(--accent-blue)' }}>35 Dims</div>
          <div className="kpi-subtext">Rigorous leakage-free transforms</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Logistic Regression Recall</div>
          <div className="kpi-value" style={{ color: 'var(--accent-teal)' }}>61.28%</div>
          <div className="kpi-subtext">Catches 1,224 defaulters (balanced)</div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-label">Random Forest Accuracy</div>
          <div className="kpi-value" style={{ color: 'var(--status-elevated)' }}>77.01%</div>
          <div className="kpi-subtext">30.13% recall (Accuracy Paradox)</div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Left: Production Model Status */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                <Database size={15} color="var(--accent-teal)" />
                <span>Verified Production Models</span>
              </div>
              <div className="card-subtitle">
                Serialized joblib artifacts evaluated on Phase 10 holdout set
              </div>
            </div>
            {loading && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Syncing...</span>}
          </div>

          {error && (
            <div className="alert-banner danger">
              <div className="alert-header">Model sync error</div>
              <div className="alert-body">{error}</div>
            </div>
          )}

          {modelsData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {modelsData.models.filter(m => m.task === 'classification').map((m: ModelDetail) => (
                <div
                  key={m.name}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem',
                    padding: '0.875rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{m.type}</span>
                    </div>
                    <span className="badge badge-low">
                      <CheckCircle2 size={10} /> Active Classifier
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                    <div style={{ background: 'var(--bg-surface)', padding: '0.4rem', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Accuracy</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                        {m.metrics.accuracy ? `${(m.metrics.accuracy * 100).toFixed(2)}%` : 'N/A'}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', padding: '0.4rem', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Default Recall</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: m.name === 'Logistic Regression' ? 'var(--accent-teal)' : 'var(--text-primary)' }}>
                        {m.metrics.recall ? `${(m.metrics.recall * 100).toFixed(2)}%` : 'N/A'}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', padding: '0.4rem', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ROC-AUC</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                        {m.metrics.roc_auc ? m.metrics.roc_auc.toFixed(4) : 'N/A'}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', padding: '0.4rem', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PR-AUC</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                        {m.metrics.pr_auc ? m.metrics.pr_auc.toFixed(4) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Governance Guardrail Card */}
        <div className="card" style={{ marginBottom: 0, borderTop: '2px solid var(--status-elevated)' }}>
          <div className="card-header">
            <div className="card-title">
              <ShieldAlert size={15} color="var(--status-elevated)" />
              <span>Phase 0 Governance Guardrail</span>
            </div>
            <span className="badge badge-elevated">Strict Policy</span>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '0.75rem' }}>
            The trained models require <strong>4 lender-assigned features</strong> established during underwriting. Attempting prospective prediction prior to underwriting introduces target leakage:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginBottom: '0.875rem' }}>
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--status-high)' }}>
              sub_grade_num
            </div>
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--status-high)' }}>
              int_rate
            </div>
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--status-high)' }}>
              installment
            </div>
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--status-high)' }}>
              verification_status
            </div>
          </div>

          <div style={{ background: 'rgba(0, 245, 160, 0.05)', border: '1px solid rgba(0, 245, 160, 0.2)', padding: '0.625rem 0.75rem', borderRadius: '4px', fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--accent-teal)' }}>Operational Rule: </strong>
            Prospective intake calls receive an audited diagnostic explaining the boundary. Retrospective scoring runs authentic 35-feature inference.
          </div>
        </div>
      </div>

      {/* Quick Launch Dock */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.875rem' }}>
        <Link to="/retrospective" className="card" style={{ padding: '0.875rem', marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '6px', background: 'rgba(0, 245, 160, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-teal)' }}>
              <Sliders size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Historical Scoring Engine</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Single loan & batch portfolio evaluation</div>
            </div>
          </div>
          <ArrowUpRight size={15} color="var(--accent-teal)" />
        </Link>

        <Link to="/insights" className="card" style={{ padding: '0.875rem', marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '6px', background: 'rgba(0, 210, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
              <Layers size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>The Accuracy Paradox</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Recall vs Accuracy cost-asymmetry analysis</div>
            </div>
          </div>
          <ArrowUpRight size={15} color="var(--accent-blue)" />
        </Link>

        <Link to="/audit" className="card" style={{ padding: '0.875rem', marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)' }}>
              <HelpCircle size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>35-Feature Audit Matrix</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Inspect direct, derived & blocker features</div>
            </div>
          </div>
          <ArrowUpRight size={15} color="var(--accent-indigo)" />
        </Link>
      </div>
    </div>
  );
};
