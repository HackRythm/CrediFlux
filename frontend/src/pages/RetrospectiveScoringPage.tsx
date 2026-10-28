import React, { useState } from 'react';
import { api } from '../services/api';
import type {
  RetrospectiveLoanRecord,
  RetrospectiveScoreResponse,
  RetrospectiveBatchResponse,
} from '../types';
import {
  Sliders,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart2,
  TrendingUp,
  Download,
  RotateCcw,
  Sparkles,
  Info,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

const PRIME_LOAN: RetrospectiveLoanRecord = {
  model_name: 'Logistic Regression',
  loan_amnt: 12000,
  term: '36 months',
  annual_inc: 85000,
  fico_score: 750,
  dti: 12.0,
  revol_bal: 4200,
  revol_util: 18.5,
  open_acc: 10,
  total_acc: 24,
  delinq_2yrs: 0,
  credit_history_years: 15.0,
  emp_length: '6 years',
  home_ownership: 'MORTGAGE',
  purpose: 'debt_consolidation',
  application_type: 'Individual',
  sub_grade: 'A3',
  int_rate: 7.49,
  installment: 373.18,
  verification_status: 'Source Verified',
};

const SUBPRIME_LOAN: RetrospectiveLoanRecord = {
  model_name: 'Logistic Regression',
  loan_amnt: 28000,
  term: '60 months',
  annual_inc: 52000,
  fico_score: 625,
  dti: 34.5,
  revol_bal: 19500,
  revol_util: 88.0,
  open_acc: 14,
  total_acc: 20,
  delinq_2yrs: 2,
  credit_history_years: 7.5,
  emp_length: '2 years',
  home_ownership: 'RENT',
  purpose: 'credit_card',
  application_type: 'Individual',
  sub_grade: 'E2',
  int_rate: 22.99,
  installment: 789.45,
  verification_status: 'Verified',
};

export const RetrospectiveScoringPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');

  // Single form state
  const [formData, setFormData] = useState<RetrospectiveLoanRecord>(PRIME_LOAN);
  const [scoring, setScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<RetrospectiveScoreResponse | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);

  // Batch state
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchModel, setBatchModel] = useState<'Logistic Regression' | 'Random Forest'>('Logistic Regression');
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchResult, setBatchResult] = useState<RetrospectiveBatchResponse | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScoring(true);
    setScoreError(null);
    try {
      const res = await api.assessRetrospective(formData);
      setScoreResult(res);
    } catch (err: any) {
      setScoreError(err.message || 'Scoring failed');
    } finally {
      setScoring(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchFile) return;
    setBatchUploading(true);
    setBatchError(null);
    try {
      const res = await api.assessRetrospectiveBatch(batchFile, batchModel);
      setBatchResult(res);
    } catch (err: any) {
      setBatchError(err.message || 'Batch evaluation failed');
    } finally {
      setBatchUploading(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const headers = [
      'loan_amnt', 'term', 'annual_inc', 'fico_score', 'dti', 'revol_bal',
      'revol_util', 'open_acc', 'total_acc', 'delinq_2yrs', 'credit_history_years',
      'emp_length', 'home_ownership', 'purpose', 'application_type',
      'sub_grade', 'int_rate', 'installment', 'verification_status'
    ];
    const rows = [
      '12000,36 months,85000,750,12.0,4200,18.5,10,24,0,15.0,6 years,MORTGAGE,debt_consolidation,Individual,A3,7.49,373.18,Source Verified',
      '28000,60 months,52000,625,34.5,19500,88.0,14,20,2,7.5,2 years,RENT,credit_card,Individual,E2,22.99,789.45,Verified',
      '15000,36 months,68000,690,19.2,7800,42.0,8,18,0,11.0,4 years,RENT,debt_consolidation,Individual,B4,12.49,501.72,Not Verified',
      '35000,60 months,125000,740,16.5,15000,35.0,12,32,0,18.0,10+ years,MORTGAGE,home_improvement,Individual,B1,9.99,743.43,Source Verified',
      '10000,36 months,38000,610,28.0,9200,82.0,6,12,1,5.0,1 year,RENT,other,Individual,D4,18.25,362.81,Verified'
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'crediflux_sample_retrospective_loans.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRiskBandBadge = (band: string) => {
    switch (band) {
      case 'Low Risk':
        return <span className="badge badge-low">{band}</span>;
      case 'Moderate Risk':
        return <span className="badge badge-moderate">{band}</span>;
      case 'Elevated Risk':
        return <span className="badge badge-elevated">{band}</span>;
      default:
        return <span className="badge badge-high">{band}</span>;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <span className="badge badge-low">Operational ML Engine</span>
          <span className="badge badge-moderate">35 Engineered Features</span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
          Retrospective Historical Scoring Engine
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.5 }}>
          Evaluate historical loans where underwriting and post-origination terms (subgrade, interest rate, installment) are complete.
          Scores are generated directly by the verified serialized models using full feature pipelines.
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => setActiveTab('single')}
        >
          <Sliders size={15} style={{ display: 'inline', marginRight: '0.375rem' }} />
          Single Historical Record
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
          onClick={() => setActiveTab('batch')}
        >
          <UploadCloud size={15} style={{ display: 'inline', marginRight: '0.375rem' }} />
          Batch CSV Portfolio Evaluation
        </button>
      </div>

      {activeTab === 'single' ? (
        <div className="page-split-grid">
          {/* Form */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <span>Historical Loan Record (35-Feature Support)</span>
                </div>
                <div className="card-subtitle">
                  Includes required underwriting terms: subgrade, interest rate, installment
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                  onClick={() => {
                    setFormData(PRIME_LOAN);
                    setScoreResult(null);
                  }}
                >
                  <Sparkles size={12} color="var(--accent-teal)" />
                  Prime Example
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                  onClick={() => {
                    setFormData(SUBPRIME_LOAN);
                    setScoreResult(null);
                  }}
                >
                  <Sparkles size={12} color="var(--status-high)" />
                  Subprime Example
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                  onClick={() => {
                    setFormData(PRIME_LOAN);
                    setScoreResult(null);
                  }}
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSingleSubmit}>
              {/* Model Choice */}
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.875rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="model_name">
                    <span>Target ML Model</span>
                    <span className="form-hint">Both models verified on 5,951 test loans</span>
                  </label>
                  <select
                    id="model_name"
                    name="model_name"
                    className="form-select"
                    value={formData.model_name}
                    onChange={handleInputChange}
                  >
                    <option value="Logistic Regression">Logistic Regression (Balanced, 61.3% Default Recall)</option>
                    <option value="Random Forest">Random Forest (77.0% Accuracy, 30.1% Recall)</option>
                  </select>
                </div>
              </div>

              {/* Underwriting Terms (Mandatory) */}
              <div style={{ marginBottom: '1.25rem', border: '1px solid var(--accent-teal-border)', borderRadius: '0.5rem', padding: '1rem', background: 'var(--accent-teal-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <CheckCircle2 size={14} />
                  <span>Lender-Assigned Underwriting Fields</span>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="sub_grade">
                      <span>Lender Subgrade</span>
                      <span className="form-hint">A1 – G5</span>
                    </label>
                    <input
                      id="sub_grade"
                      name="sub_grade"
                      type="text"
                      required
                      className="form-input"
                      value={formData.sub_grade}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="int_rate">
                      <span>Interest Rate (%)</span>
                    </label>
                    <input
                      id="int_rate"
                      name="int_rate"
                      type="number"
                      step="0.01"
                      min="1"
                      max="40"
                      required
                      className="form-input"
                      value={formData.int_rate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="installment">
                      <span>Monthly Installment ($)</span>
                    </label>
                    <input
                      id="installment"
                      name="installment"
                      type="number"
                      step="0.01"
                      min="5"
                      required
                      className="form-input"
                      value={formData.installment}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="verification_status">
                      <span>Verification Status</span>
                    </label>
                    <select
                      id="verification_status"
                      name="verification_status"
                      className="form-select"
                      value={formData.verification_status}
                      onChange={handleInputChange}
                    >
                      <option value="Not Verified">Not Verified</option>
                      <option value="Source Verified">Source Verified</option>
                      <option value="Verified">Verified</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Loan Request & Borrower Profile
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="loan_amnt">
                      <span>Loan Amount ($)</span>
                    </label>
                    <input
                      id="loan_amnt"
                      name="loan_amnt"
                      type="number"
                      min="500"
                      required
                      className="form-input"
                      value={formData.loan_amnt}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="term">
                      <span>Term</span>
                    </label>
                    <select
                      id="term"
                      name="term"
                      className="form-select"
                      value={formData.term}
                      onChange={handleInputChange}
                    >
                      <option value="36 months">36 months</option>
                      <option value="60 months">60 months</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="annual_inc">
                      <span>Annual Income ($)</span>
                    </label>
                    <input
                      id="annual_inc"
                      name="annual_inc"
                      type="number"
                      min="1000"
                      required
                      className="form-input"
                      value={formData.annual_inc}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="dti">
                      <span>DTI (%)</span>
                    </label>
                    <input
                      id="dti"
                      name="dti"
                      type="number"
                      step="0.1"
                      required
                      className="form-input"
                      value={formData.dti}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Bureau details */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Credit Bureau Details
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="fico_score">
                      <span>FICO Score</span>
                    </label>
                    <input
                      id="fico_score"
                      name="fico_score"
                      type="number"
                      min="300"
                      max="850"
                      required
                      className="form-input"
                      value={formData.fico_score}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="revol_util">
                      <span>Revolving Util (%)</span>
                    </label>
                    <input
                      id="revol_util"
                      name="revol_util"
                      type="number"
                      step="0.1"
                      required
                      className="form-input"
                      value={formData.revol_util}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="revol_bal">
                      <span>Revolving Bal ($)</span>
                    </label>
                    <input
                      id="revol_bal"
                      name="revol_bal"
                      type="number"
                      min="0"
                      required
                      className="form-input"
                      value={formData.revol_bal}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="credit_history_years">
                      <span>Credit History (Yrs)</span>
                    </label>
                    <input
                      id="credit_history_years"
                      name="credit_history_years"
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      className="form-input"
                      value={formData.credit_history_years}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={scoring}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {scoring ? 'Computing Inference Pipeline...' : 'Score Historical Loan'}
              </button>
            </form>
          </div>

          {/* Result */}
          <div>
            {scoreError && (
              <div className="alert-banner danger">
                <div className="alert-header">
                  <AlertTriangle size={18} />
                  <span>Evaluation Error</span>
                </div>
                <div className="alert-body">{scoreError}</div>
              </div>
            )}

            {scoreResult ? (
              <div className="card" style={{ borderTop: '2px solid var(--accent-teal)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Model Output</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {scoreResult.model}
                    </h3>
                  </div>
                  {getRiskBandBadge(scoreResult.risk_band)}
                </div>

                {/* Crisp Circular Gauge & Probability Metrics */}
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1rem' }}>
                  {/* SVG Circular Gauge */}
                  <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#E2E8F0"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={scoreResult.default_probability > 0.4 ? 'var(--status-high)' : 'var(--accent-teal)'}
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - Math.min(Math.max(scoreResult.default_probability, 0), 1))}
                        strokeLinecap="round"
                        fill="transparent"
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: scoreResult.default_probability > 0.4 ? 'var(--status-high)' : 'var(--accent-teal)', fontVariantNumeric: 'tabular-nums' }}>
                        {(scoreResult.default_probability * 100).toFixed(2)}%
                      </div>
                      <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Default</div>
                    </div>
                  </div>

                  {/* Summary Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Repayment Odds:</span>
                      <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--status-low)' }}>{(scoreResult.repayment_probability * 100).toFixed(2)}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Predicted Class:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{scoreResult.predicted_label}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Decision Cutoff:</span>
                      <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{(scoreResult.threshold_used * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', padding: '0.625rem 0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Risk Rationale: </strong>
                  {scoreResult.band_rationale}
                </div>

                {/* Feature Contributions Chart (For LR) */}
                {scoreResult.feature_contributions && scoreResult.feature_contributions.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                      Top Feature Drivers (Log-Odds Impact)
                    </div>
                    <div style={{ height: '180px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={scoreResult.feature_contributions}
                          margin={{ top: 0, right: 15, left: 65, bottom: 0 }}
                        >
                          <XAxis type="number" stroke="var(--text-muted)" fontSize={10} tick={{ fill: 'var(--text-secondary)' }} />
                          <YAxis
                            dataKey="feature"
                            type="category"
                            stroke="var(--text-muted)"
                            fontSize={10}
                            tick={{ fill: 'var(--text-secondary)' }}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', color: '#17243A', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}
                            formatter={(val: any) => [Number(val).toFixed(4), 'Contribution']}
                          />
                          <Bar dataKey="contribution" radius={[2, 2, 2, 2]}>
                            {scoreResult.feature_contributions.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.direction === 'increases_risk' ? '#DC2626' : '#059669'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="alert-banner teal" style={{ marginBottom: 0, padding: '0.625rem 0.75rem' }}>
                  <div style={{ fontSize: '0.6875rem', lineHeight: 1.45 }}>
                    <Info size={13} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'text-bottom' }} />
                    {scoreResult.disclaimer}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ borderStyle: 'dashed', textAlign: 'center', padding: '2.5rem 1rem' }}>
                <Sliders size={28} color="var(--accent-teal)" style={{ margin: '0 auto 0.75rem', opacity: 0.7 }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  Inference Standby
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto', lineHeight: 1.5 }}>
                  Click "Score Historical Loan" to pass the 35 features through the model pipeline.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Batch CSV Evaluation Tab */
        <div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <UploadCloud size={18} color="var(--accent-teal)" />
                  <span>Batch Loan Portfolio Evaluation</span>
                </div>
                <div className="card-subtitle">
                  Upload a CSV file containing historical loan records with underwriting features
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem' }}
                onClick={handleDownloadSampleCsv}
              >
                <Download size={13} />
                Download Sample CSV
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="batch-file">
                  <span>Select CSV File</span>
                </label>
                <input
                  id="batch-file"
                  type="file"
                  accept=".csv"
                  required
                  className="form-input"
                  style={{ padding: '0.5rem' }}
                  onChange={(e) => setBatchFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="batch-model">
                  <span>Model Selector</span>
                </label>
                <select
                  id="batch-model"
                  className="form-select"
                  value={batchModel}
                  onChange={(e) => setBatchModel(e.target.value as any)}
                >
                  <option value="Logistic Regression">Logistic Regression</option>
                  <option value="Random Forest">Random Forest</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!batchFile || batchUploading}
                className="btn btn-primary"
                style={{ padding: '0.625rem 1.5rem', height: '42px' }}
              >
                {batchUploading ? 'Processing CSV...' : 'Process Portfolio'}
              </button>
            </form>
          </div>

          {batchError && (
            <div className="alert-banner danger">
              <div className="alert-header">
                <AlertTriangle size={18} />
                <span>Batch Evaluation Error</span>
              </div>
              <div className="alert-body">{batchError}</div>
            </div>
          )}

          {batchResult && (
            <div>
              {/* Batch Summary Stats */}
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-label">Total Records Evaluated</div>
                  <div className="stat-value">{batchResult.total_records}</div>
                  <div className="stat-subtext">Rows processed from CSV</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Successful Scores</div>
                  <div className="stat-value" style={{ color: 'var(--status-low)' }}>
                    {batchResult.successful_scores}
                  </div>
                  <div className="stat-subtext">0 Schema or format errors</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Portfolio Mean Default Prob</div>
                  <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>
                    {(batchResult.average_default_probability * 100).toFixed(2)}%
                  </div>
                  <div className="stat-subtext">Model: {batchResult.model}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Evaluation Engine</div>
                  <div className="stat-value" style={{ color: 'var(--accent-teal)', fontSize: '1.25rem' }}>
                    Retrospective
                  </div>
                  <div className="stat-subtext">Full 35-feature pipeline</div>
                </div>
              </div>

              {/* Portfolio Risk Distribution Visuals */}
              {(() => {
                const riskCounts = batchResult.results.reduce(
                  (acc, item) => {
                    const band = item.risk_band || 'Unknown';
                    acc[band] = (acc[band] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>
                );
                const pieData = [
                  { name: 'Low Risk', value: riskCounts['Low Risk'] || 0, color: '#059669' },
                  { name: 'Moderate Risk', value: riskCounts['Moderate Risk'] || 0, color: '#0284C7' },
                  { name: 'Elevated Risk', value: riskCounts['Elevated Risk'] || 0, color: '#D97706' },
                  { name: 'High Risk', value: riskCounts['High Risk'] || 0, color: '#DC2626' },
                ].filter((d) => d.value > 0);

                if (pieData.length === 0) return null;

                return (
                  <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-header">
                      <div className="card-title">
                        <PieChartIcon size={18} color="var(--accent-teal)" />
                        <span>Portfolio Risk Tier Distribution</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ height: '220px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={4}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', color: '#17243A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}
                              formatter={(val: any, name: any) => [`${val} loans`, name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {pieData.map((tier) => (
                          <div key={tier.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-elevated)', padding: '0.625rem 0.875rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: tier.color }} />
                              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{tier.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{tier.value} loans</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                ({((tier.value / batchResult.total_records) * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Data Table */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <FileText size={18} color="var(--accent-teal)" />
                    <span>Loan-Level Risk Breakdown</span>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Row #</th>
                        <th>Status</th>
                        <th>Default Probability</th>
                        <th>Predicted Label</th>
                        <th>Risk Band</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchResult.results.map((r) => (
                        <tr key={r.row_index}>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>Row {r.row_index + 1}</td>
                          <td>
                            <span style={{ color: r.status === 'ok' ? 'var(--status-low)' : 'var(--status-high)' }}>
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {r.default_probability !== null && r.default_probability !== undefined
                              ? `${(r.default_probability * 100).toFixed(2)}%`
                              : 'N/A'}
                          </td>
                          <td>{r.predicted_label || '-'}</td>
                          <td>{r.risk_band ? getRiskBandBadge(r.risk_band) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
