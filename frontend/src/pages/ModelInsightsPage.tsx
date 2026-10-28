import React, { useEffect, useState } from 'react';
import {
  Layers,
  Scale,
  BarChart2,
  AlertTriangle,
  Database,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import type { ModelsResponse } from '../types';

export const ModelInsightsPage: React.FC = () => {
  const [modelsData, setModelsData] = useState<ModelsResponse | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getModels()
      .then((data) => {
        if (isMounted) {
          setModelsData(data);
          setIsLive(true);
        }
      })
      .catch(() => {
        // Fall back to verified stored benchmarks
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Verified exact metrics on the 5,951 untouched holdout set
  const comparisonData = [
    {
      metric: 'Accuracy',
      'Logistic Regression': modelsData?.models.find(m => m.name === 'Logistic Regression')?.metrics.accuracy ?? 0.6554,
      'Random Forest': modelsData?.models.find(m => m.name === 'Random Forest')?.metrics.accuracy ?? 0.7701,
    },
    {
      metric: 'Default Recall',
      'Logistic Regression': modelsData?.models.find(m => m.name === 'Logistic Regression')?.metrics.recall ?? 0.6128,
      'Random Forest': modelsData?.models.find(m => m.name === 'Random Forest')?.metrics.recall ?? 0.3013,
    },
    {
      metric: 'Precision',
      'Logistic Regression': modelsData?.models.find(m => m.name === 'Logistic Regression')?.metrics.precision ?? 0.3139,
      'Random Forest': modelsData?.models.find(m => m.name === 'Random Forest')?.metrics.precision ?? 0.3996,
    },
    {
      metric: 'F1-Score',
      'Logistic Regression': modelsData?.models.find(m => m.name === 'Logistic Regression')?.metrics.f1_score ?? 0.4152,
      'Random Forest': modelsData?.models.find(m => m.name === 'Random Forest')?.metrics.f1_score ?? 0.3436,
    },
  ];

  const aucData = [
    {
      name: 'ROC-AUC',
      'Logistic Regression': modelsData?.models.find(m => m.name === 'Logistic Regression')?.metrics.roc_auc ?? 0.6963,
      'Random Forest': modelsData?.models.find(m => m.name === 'Random Forest')?.metrics.roc_auc ?? 0.6936,
    },
    {
      name: 'PR-AUC',
      'Logistic Regression': modelsData?.models.find(m => m.name === 'Logistic Regression')?.metrics.pr_auc ?? 0.3568,
      'Random Forest': modelsData?.models.find(m => m.name === 'Random Forest')?.metrics.pr_auc ?? 0.3617,
    },
  ];

  // Exact confusion matrices from verified Phase 10 evaluation
  const lrCm = modelsData?.models.find(m => m.name === 'Logistic Regression')?.confusion_matrix ?? {
    tn: 3172, fp: 1591, fn: 460, tp: 728
  };
  const rfCm = modelsData?.models.find(m => m.name === 'Random Forest')?.confusion_matrix ?? {
    tn: 4225, fp: 538, fn: 830, tp: 358
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-moderate">Empirical ML Evaluation</span>
            <span className="badge badge-low">5,951 Holdout Test Samples</span>
            {isLive && (
              <span className="badge badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={10} /> Live API Synced
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
            Model Comparative Insights & The Accuracy Paradox
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Trade-off analysis between Logistic Regression and Random Forest under imbalanced default loss asymmetry (5,951 loans).
          </p>
        </div>
      </div>

      {/* Accuracy Paradox Feature Card */}
      <div className="card" style={{ borderLeft: '3px solid var(--accent-teal)', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.625rem' }}>
          <Scale size={16} color="var(--accent-teal)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            The Accuracy Paradox in Credit Risk Underwriting
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '1.25rem', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '0.5rem' }}>
              In consumer lending portfolios, defaults are relatively rare (~20% of loans).
              A naive model predicting that every applicant will repay achieves <strong>80% accuracy</strong> while catching <strong>zero defaults</strong>.
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              While <strong>Random Forest reaches 77.01% accuracy</strong>, its <strong>Default Recall is only 30.13%</strong> (missing 830 defaulters out of 1,188).
              <strong> Logistic Regression achieves 61.28% recall</strong> (catching 728 defaulters). Because charge-off losses dwarf false-positive lost interest margins, <strong>recall is the vital risk metric</strong>.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', padding: '0.875rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              5,951 Test Set Defaulter Capture Rate
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-primary)' }}>Logistic Regression (728 caught)</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)' }}>61.28%</span>
              </div>
              <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '61.28%', height: '100%', background: 'var(--accent-teal)', borderRadius: '3px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-primary)' }}>Random Forest (358 caught)</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--status-elevated)' }}>30.13%</span>
              </div>
              <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '30.13%', height: '100%', background: 'var(--status-elevated)', borderRadius: '3px' }} />
              </div>
            </div>

            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Total actual defaulters in test split: 1,188 loans (4,763 Fully Paid, 1,188 Charged Off).
            </div>
          </div>
        </div>
      </div>

      {/* Visual Chart Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <BarChart2 size={15} color="var(--accent-teal)" />
              <span>Core Classification Metrics</span>
            </div>
            <div className="card-subtitle">Verified on 5,951 Phase 10 Holdout Split</div>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="metric" stroke="var(--text-muted)" fontSize={11} tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 1]} tick={{ fill: 'var(--text-secondary)' }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', color: '#17243A', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(2)}%`]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#475569' }} />
                <Bar dataKey="Logistic Regression" fill="#0D9488" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Random Forest" fill="#17243A" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <Layers size={15} color="var(--accent-blue)" />
              <span>Discrimination: AUC Metrics</span>
            </div>
            <div className="card-subtitle">Ranking capability across thresholds</div>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aucData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 0.8]} tick={{ fill: 'var(--text-secondary)' }} tickFormatter={(v) => v.toFixed(2)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', color: '#17243A', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}
                  formatter={(val: any) => [Number(val).toFixed(4)]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#475569' }} />
                <Bar dataKey="Logistic Regression" fill="#0D9488" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Random Forest" fill="#0284C7" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confusion Matrix Breakdown */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <span>Empirical Confusion Matrix Breakdown (5,951 Test Loans)</span>
            </div>
            <div className="card-subtitle">
              Exact count of loans classified at 0.50 decision threshold on untouched test partition
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* LR Matrix */}
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-teal)', marginBottom: '0.5rem' }}>
              Logistic Regression Matrix (Total: {lrCm.tn + lrCm.fp + lrCm.fn + lrCm.tp} loans)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>True Negatives (Paid)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {lrCm.tn.toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'var(--status-elevated-bg)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--status-elevated-border)' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--status-elevated)', fontWeight: 500 }}>False Positives (Lost Deals)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-elevated)', marginTop: '0.2rem' }}>
                  {lrCm.fp.toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'var(--status-high-bg)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--status-high-border)' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--status-high)', fontWeight: 500 }}>False Negatives (Missed)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-high)', marginTop: '0.2rem' }}>
                  {lrCm.fn.toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'var(--status-low-bg)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--status-low-border)' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--status-low)', fontWeight: 500 }}>True Positives (Caught)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-low)', marginTop: '0.2rem' }}>
                  {lrCm.tp.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* RF Matrix */}
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-navy)', marginBottom: '0.5rem' }}>
              Random Forest Matrix (Total: {rfCm.tn + rfCm.fp + rfCm.fn + rfCm.tp} loans)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>True Negatives (Paid)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {rfCm.tn.toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'var(--status-elevated-bg)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--status-elevated-border)' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--status-elevated)', fontWeight: 500 }}>False Positives (Lost Deals)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-elevated)', marginTop: '0.2rem' }}>
                  {rfCm.fp.toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'var(--status-high-bg)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--status-high-border)' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--status-high)', fontWeight: 500 }}>False Negatives (Missed)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-high)', marginTop: '0.2rem' }}>
                  {rfCm.fn.toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'var(--status-low-bg)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--status-low-border)' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--status-low)', fontWeight: 500 }}>True Positives (Caught)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--status-low)', marginTop: '0.2rem' }}>
                  {rfCm.tp.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Head-to-Head Table */}
      <div className="card" style={{ marginBottom: 0 }}>
        <div className="card-header">
          <div className="card-title">
            <span>Model Comparison Table (Including Linear Regression Baseline)</span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Task Type</th>
                <th>Evaluation Metric</th>
                <th>Score (Test Set N=5,951)</th>
                <th>Role in Architecture</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>Logistic Regression</td>
                <td>Classification</td>
                <td>Accuracy / Recall / ROC-AUC</td>
                <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>65.54% / 61.28% / 0.6963</td>
                <td>Primary risk detector: balances default capture and interpretability via class weighting.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--accent-navy)' }}>Random Forest</td>
                <td>Classification</td>
                <td>Accuracy / Recall / ROC-AUC</td>
                <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>77.01% / 30.13% / 0.6936</td>
                <td>Conservative classifier: minimizes false positives at cost of lower default recall.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Linear Regression Baseline</td>
                <td>Regression (LPM)</td>
                <td>RMSE / MAE / R²</td>
                <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>0.3833 / 0.2952 / 0.0806</td>
                <td>Phase 2 benchmark only; unbounded regressor with near-zero default recall (2.02%).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
