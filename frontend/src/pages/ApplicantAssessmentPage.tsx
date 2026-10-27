import React, { useState } from 'react';
import { api } from '../services/api';
import type { ProspectiveApplicantRequest, AssessResponseUnavailable } from '../types';
import {
  ShieldAlert,
  Send,
  RotateCcw,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DEFAULT_APPLICANT: ProspectiveApplicantRequest = {
  loan_amnt: 15000,
  term: '36 months',
  annual_inc: 75000,
  fico_score: 710,
  dti: 18.5,
  revol_bal: 8500,
  revol_util: 45.0,
  open_acc: 9,
  total_acc: 22,
  delinq_2yrs: 0,
  credit_history_years: 12.5,
  emp_length: '5 years',
  home_ownership: 'MORTGAGE',
  purpose: 'debt_consolidation',
  application_type: 'Individual',
};

export const ApplicantAssessmentPage: React.FC = () => {
  const [formData, setFormData] = useState<ProspectiveApplicantRequest>(DEFAULT_APPLICANT);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessResponseUnavailable | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleLoadPreset = (preset: 'prime' | 'moderate' | 'high_risk') => {
    setError(null);
    setResult(null);
    if (preset === 'prime') {
      setFormData({
        loan_amnt: 20000,
        term: '36 months',
        annual_inc: 110000,
        fico_score: 760,
        dti: 11.2,
        revol_bal: 4500,
        revol_util: 18.0,
        open_acc: 12,
        total_acc: 28,
        delinq_2yrs: 0,
        credit_history_years: 16.0,
        emp_length: '8 years',
        home_ownership: 'MORTGAGE',
        purpose: 'debt_consolidation',
        application_type: 'Individual',
      });
    } else if (preset === 'moderate') {
      setFormData(DEFAULT_APPLICANT);
    } else {
      setFormData({
        loan_amnt: 28000,
        term: '60 months',
        annual_inc: 48000,
        fico_score: 615,
        dti: 36.8,
        revol_bal: 18500,
        revol_util: 86.5,
        open_acc: 14,
        total_acc: 18,
        delinq_2yrs: 2,
        credit_history_years: 6.0,
        emp_length: '2 years',
        home_ownership: 'RENT',
        purpose: 'credit_card',
        application_type: 'Individual',
      });
    }
  };

  const handleReset = () => {
    setFormData(DEFAULT_APPLICANT);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await api.assessProspective(formData);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during intake assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-high">Pre-Underwriting Boundary</span>
          <span className="badge badge-elevated">Governance Check</span>
        </div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Prospective Borrower Intake Assessment
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Submit prospective applicant financial parameters to test the underwriting boundary filter.
        </p>
      </div>

      {/* Preset Action Bar */}
      <div className="preset-bar">
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.25rem' }}>
          Presets:
        </span>
        <button
          type="button"
          className="preset-pill"
          onClick={() => handleLoadPreset('prime')}
        >
          <Sparkles size={11} color="var(--accent-teal)" />
          Load Sample
        </button>
        <button
          type="button"
          className="preset-pill"
          onClick={() => handleLoadPreset('prime')}
        >
          <Zap size={11} color="var(--accent-teal)" />
          Prime (760 FICO)
        </button>
        <button
          type="button"
          className="preset-pill"
          onClick={() => handleLoadPreset('moderate')}
        >
          <Zap size={11} color="var(--accent-blue)" />
          Moderate (710 FICO)
        </button>
        <button
          type="button"
          className="preset-pill"
          onClick={() => handleLoadPreset('high_risk')}
        >
          <Zap size={11} color="var(--status-high)" />
          High-Risk (615 FICO)
        </button>
        <button
          type="button"
          className="preset-pill"
          onClick={handleReset}
          style={{ marginLeft: 'auto' }}
        >
          <RotateCcw size={11} />
          Reset
        </button>
      </div>

      <div className="page-split-grid">
        {/* Form Column */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Section 1: Loan Terms */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                1. Loan Request Terms
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="loan_amnt">
                    <span>Requested Amount ($)</span>
                    <span className="form-hint">500 – 100k</span>
                  </label>
                  <input
                    id="loan_amnt"
                    name="loan_amnt"
                    type="number"
                    min="500"
                    max="100000"
                    step="500"
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
                  <label className="form-label" htmlFor="purpose">
                    <span>Purpose</span>
                  </label>
                  <select
                    id="purpose"
                    name="purpose"
                    className="form-select"
                    value={formData.purpose}
                    onChange={handleInputChange}
                  >
                    <option value="debt_consolidation">Debt Consolidation</option>
                    <option value="credit_card">Credit Card Refinance</option>
                    <option value="home_improvement">Home Improvement</option>
                    <option value="small_business">Small Business</option>
                    <option value="major_purchase">Major Purchase</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="application_type">
                    <span>Type</span>
                  </label>
                  <select
                    id="application_type"
                    name="application_type"
                    className="form-select"
                    value={formData.application_type}
                    onChange={handleInputChange}
                  >
                    <option value="Individual">Individual</option>
                    <option value="Joint App">Joint App</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Borrower Financials */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                2. Income & Financial Burden
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="annual_inc">
                    <span>Annual Income ($)</span>
                  </label>
                  <input
                    id="annual_inc"
                    name="annual_inc"
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    className="form-input"
                    value={formData.annual_inc}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dti">
                    <span>DTI (%)</span>
                    <span className="form-hint">Debt / Income</span>
                  </label>
                  <input
                    id="dti"
                    name="dti"
                    type="number"
                    min="0"
                    max="150"
                    step="0.1"
                    required
                    className="form-input"
                    value={formData.dti}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="emp_length">
                    <span>Employment</span>
                  </label>
                  <select
                    id="emp_length"
                    name="emp_length"
                    className="form-select"
                    value={formData.emp_length || '5 years'}
                    onChange={handleInputChange}
                  >
                    <option value="< 1 year">&lt; 1 year</option>
                    <option value="1 year">1 year</option>
                    <option value="2 years">2 years</option>
                    <option value="3 years">3 years</option>
                    <option value="4 years">4 years</option>
                    <option value="5 years">5 years</option>
                    <option value="6 years">6 years</option>
                    <option value="7 years">7 years</option>
                    <option value="8 years">8 years</option>
                    <option value="9 years">9 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="home_ownership">
                    <span>Housing</span>
                  </label>
                  <select
                    id="home_ownership"
                    name="home_ownership"
                    className="form-select"
                    value={formData.home_ownership}
                    onChange={handleInputChange}
                  >
                    <option value="MORTGAGE">Mortgage</option>
                    <option value="RENT">Rent</option>
                    <option value="OWN">Own (Free)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Credit Bureau Fields */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                3. Credit Bureau History
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="fico_score">
                    <span>FICO Score</span>
                    <span className="form-hint">300 – 850</span>
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
                    <span>Utilization (%)</span>
                  </label>
                  <input
                    id="revol_util"
                    name="revol_util"
                    type="number"
                    min="0"
                    max="200"
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
                    <span>History (Yrs)</span>
                  </label>
                  <input
                    id="credit_history_years"
                    name="credit_history_years"
                    type="number"
                    min="0"
                    max="80"
                    step="0.5"
                    required
                    className="form-input"
                    value={formData.credit_history_years}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="open_acc">
                    <span>Open Lines</span>
                  </label>
                  <input
                    id="open_acc"
                    name="open_acc"
                    type="number"
                    min="0"
                    max="100"
                    required
                    className="form-input"
                    value={formData.open_acc}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="total_acc">
                    <span>Total Lines</span>
                  </label>
                  <input
                    id="total_acc"
                    name="total_acc"
                    type="number"
                    min="1"
                    max="150"
                    required
                    className="form-input"
                    value={formData.total_acc}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="delinq_2yrs">
                    <span>Delinquencies (2yr)</span>
                  </label>
                  <input
                    id="delinq_2yrs"
                    name="delinq_2yrs"
                    type="number"
                    min="0"
                    max="30"
                    required
                    className="form-input"
                    value={formData.delinq_2yrs}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.625rem' }}
            >
              {submitting ? (
                <span>Executing Audit Check...</span>
              ) : (
                <>
                  <Send size={14} />
                  <span>Run Pre-Underwriting Risk Assessment</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Diagnostic Output Column */}
        <div>
          {error && (
            <div className="alert-banner danger">
              <div className="alert-header">
                <AlertCircle size={15} />
                <span>Intake Error</span>
              </div>
              <div className="alert-body">{error}</div>
            </div>
          )}

          {result ? (
            <div className="card" style={{ borderLeft: '3px solid var(--status-high)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="badge badge-high">Status: {result.status.toUpperCase()}</span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--status-high)' }}>
                  VERDICT: {result.verdict}
                </span>
              </div>

              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Prospective Prediction Blocked by Governance Policy
              </h2>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '0.875rem' }}>
                {result.reason}
              </p>

              {/* Missing Fields */}
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.75rem', marginBottom: '0.875rem' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--status-elevated)', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <HelpCircle size={12} />
                  <span>Missing Post-Underwriting Features ({result.missing_features.length})</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {result.missing_features.map((feat) => (
                    <span
                      key={feat}
                      style={{
                        background: 'rgba(255, 71, 87, 0.12)',
                        border: '1px solid rgba(255, 71, 87, 0.25)',
                        color: 'var(--status-high)',
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '3px',
                      }}
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Recommended Action
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  {result.recommended_action}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    to="/retrospective"
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', flex: 1 }}
                  >
                    <span>Go to Retrospective Scoring</span>
                    <ExternalLink size={12} />
                  </Link>
                  <Link
                    to="/audit"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                  >
                    <span>Audit Matrix</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ borderStyle: 'dashed', textAlign: 'center', padding: '2.5rem 1rem' }}>
              <ShieldAlert size={28} color="var(--accent-teal)" style={{ margin: '0 auto 0.75rem', opacity: 0.7 }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Boundary Verification Ready
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto', lineHeight: 1.5 }}>
                Click "Run Pre-Underwriting Risk Assessment" to test the 35-feature schema check.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
