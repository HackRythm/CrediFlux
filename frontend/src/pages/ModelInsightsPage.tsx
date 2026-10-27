import React from 'react';
import {
  Layers,
  Scale,
  BarChart2,
  AlertTriangle,
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

export const ModelInsightsPage: React.FC = () => {
  const comparisonData = [
    { metric: 'Accuracy', 'Logistic Regression': 0.6554, 'Random Forest': 0.7701 },
    { metric: 'Default Recall', 'Logistic Regression': 0.6128, 'Random Forest': 0.3013 },
    { metric: 'Precision', 'Logistic Regression': 0.3139, 'Random Forest': 0.3996 },
    { metric: 'F1-Score', 'Logistic Regression': 0.4152, 'Random Forest': 0.3436 },
  ];

  const aucData = [
    { name: 'ROC-AUC', 'Logistic Regression': 0.6963, 'Random Forest': 0.6936 },
    { name: 'PR-AUC', 'Logistic Regression': 0.3568, 'Random Forest': 0.3617 },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-moderate">Empirical ML Evaluation</span>
          <span className="badge badge-low">10,000 Holdout Test Samples</span>
        </div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Model Comparative Insights & The Accuracy Paradox
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Trade-off analysis between Logistic Regression and Random Forest under imbalanced default loss asymmetry.
        </p>
      </div>

      {/* Accuracy Paradox Feature Card */}
      <div className="card" style={{ borderLeft: '3px solid var(--accent-teal)', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.625rem' }}>
          <Scale size={16} color="var(--accent-teal)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            The Accuracy Paradox in Credit Risk Underwriting
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '1.25rem', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '0.5rem' }}>
              In consumer lending portfolios, defaults are relatively rare (~20% of loans).
              A naive model predicting that every applicant will repay achieves <strong>80% accuracy</strong> while catching <strong>zero defaults</strong>.
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              While <strong>Random Forest reaches 77.01% accuracy</strong>, its <strong>Default Recall is only 30.13%</strong> (missing 1,396 defaulters).
              <strong> Logistic Regression achieves 61.28% recall</strong> (catching 1,224 defaulters). Because charge-off losses dwarf false-positive lost interest margins, <strong>recall is the vital risk metric</strong>.
            </p>
          </div>

          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', padding: '0.875rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              10,000 Test Set Defaulter Capture Rate
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                <span>Logistic Regression (1,224 caught)</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>61.28%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '61.28%', height: '100%', background: 'var(--accent-teal)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                <span>Random Forest (602 caught)</span>
                <span style={{ fontWeight: 700, color: 'var(--status-elevated)' }}>30.13%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '30.13%', height: '100%', background: 'var(--status-elevated)' }} />
              </div>
            </div>

            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Total actual defaulters in test split: 1,998 loans.
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
            <div className="card-subtitle">Verified on Phase 10 Holdout Split</div>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="metric" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', fontSize: '11px' }}
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(2)}%`]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Logistic Regression" fill="#00f5a0" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Random Forest" fill="#00d2ff" radius={[3, 3, 0, 0]} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 0.8]} tickFormatter={(v) => v.toFixed(2)} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', fontSize: '11px' }}
                  formatter={(val: any) => [Number(val).toFixed(4)]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Logistic Regression" fill="#00f5a0" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Random Forest" fill="#6366f1" radius={[3, 3, 0, 0]} />
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
              <span>Empirical Confusion Matrix Breakdown (10,000 Test Loans)</span>
            </div>
            <div className="card-subtitle">
              Exact count of loans classified at 0.50 decision threshold
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* LR Matrix */}
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-teal)', marginBottom: '0.5rem' }}>
              Logistic Regression Matrix
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-input)', padding: '0.625rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>True Negatives (Paid)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>5,330</div>
              </div>
              <div style={{ background: 'rgba(255, 184, 0, 0.05)', padding: '0.625rem', borderRadius: '4px', border: '1px solid rgba(255, 184, 0, 0.2)' }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--status-elevated)' }}>False Positives (Lost Deals)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--status-elevated)' }}>2,672</div>
              </div>
              <div style={{ background: 'rgba(255, 71, 87, 0.05)', padding: '0.625rem', borderRadius: '4px', border: '1px solid rgba(255, 71, 87, 0.2)' }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--status-high)' }}>False Negatives (Missed)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--status-high)' }}>774</div>
              </div>
              <div style={{ background: 'rgba(0, 245, 160, 0.08)', padding: '0.625rem', borderRadius: '4px', border: '1px solid rgba(0, 245, 160, 0.3)' }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--accent-teal)' }}>True Positives (Caught)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--accent-teal)' }}>1,224</div>
              </div>
            </div>
          </div>

          {/* RF Matrix */}
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
              Random Forest Matrix
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-input)', padding: '0.625rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>True Negatives (Paid)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>7,099</div>
              </div>
              <div style={{ background: 'rgba(255, 184, 0, 0.05)', padding: '0.625rem', borderRadius: '4px', border: '1px solid rgba(255, 184, 0, 0.2)' }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--status-elevated)' }}>False Positives (Lost Deals)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--status-elevated)' }}>903</div>
              </div>
              <div style={{ background: 'rgba(255, 71, 87, 0.05)', padding: '0.625rem', borderRadius: '4px', border: '1px solid rgba(255, 71, 87, 0.2)' }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--status-high)' }}>False Negatives (Missed)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--status-high)' }}>1,396</div>
              </div>
              <div style={{ background: 'rgba(0, 245, 160, 0.08)', padding: '0.625rem', borderRadius: '4px', border: '1px solid rgba(0, 245, 160, 0.3)' }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--accent-teal)' }}>True Positives (Caught)</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--accent-teal)' }}>602</div>
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
                <th>Score</th>
                <th>Role in Architecture</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>Logistic Regression</td>
                <td>Classification</td>
                <td>Accuracy / Recall / ROC-AUC</td>
                <td style={{ fontWeight: 600 }}>65.54% / 61.28% / 0.6963</td>
                <td>Primary risk detector: balances default capture and interpretability.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>Random Forest</td>
                <td>Classification</td>
                <td>Accuracy / Recall / ROC-AUC</td>
                <td style={{ fontWeight: 600 }}>77.01% / 30.13% / 0.6936</td>
                <td>Conservative classifier: minimizes false positives at cost of lower default recall.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Linear Regression Baseline</td>
                <td>Regression</td>
                <td>RMSE / MAE / R²</td>
                <td style={{ fontWeight: 600 }}>0.3871 / 0.3013 / 0.0898</td>
                <td>Benchmark baseline only; does not output calibrated probabilities.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
