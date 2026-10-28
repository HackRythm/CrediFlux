import React, { useState } from 'react';
import {
  FileSearch,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  Filter,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface FeatureAuditEntry {
  name: string;
  category: 'Direct Applicant' | 'Derivable' | 'Post-Underwriting';
  description: string;
  leakageRisk: 'High (Target Leakage)' | 'Derived Leakage' | 'None';
  availability: 'Available at Intake' | 'Derivable from Intake' | 'Post-Underwriting Only';
}

export const FEATURE_AUDIT_DATA: FeatureAuditEntry[] = [
  // 1. Post-Underwriting Blockers (5 features representing 4 lender decisions)
  {
    name: 'sub_grade_num',
    category: 'Post-Underwriting',
    description: 'Internal lender risk subgrade (A1-G5 mapped continuously from 1 to 35). Established by credit underwriting committee.',
    leakageRisk: 'High (Target Leakage)',
    availability: 'Post-Underwriting Only',
  },
  {
    name: 'int_rate',
    category: 'Post-Underwriting',
    description: 'Contractual interest rate percentage. Established by lender based on risk-based pricing and margin targets.',
    leakageRisk: 'High (Target Leakage)',
    availability: 'Post-Underwriting Only',
  },
  {
    name: 'installment',
    category: 'Post-Underwriting',
    description: 'Monthly repayment dollar amount. Derived via amortization formula requiring loan amount, term, and lender interest rate.',
    leakageRisk: 'High (Target Leakage)',
    availability: 'Post-Underwriting Only',
  },
  {
    name: 'ver_Source_Verified',
    category: 'Post-Underwriting',
    description: 'Binary flag indicating lender operations team directly verified borrower W-2s, paystubs, or tax returns.',
    leakageRisk: 'High (Target Leakage)',
    availability: 'Post-Underwriting Only',
  },
  {
    name: 'ver_Verified',
    category: 'Post-Underwriting',
    description: 'Binary flag indicating third-party or formal employer verification completed post-intake.',
    leakageRisk: 'High (Target Leakage)',
    availability: 'Post-Underwriting Only',
  },

  // 2. Direct Applicant & Bureau (8 features)
  {
    name: 'loan_amnt',
    category: 'Direct Applicant',
    description: 'Stated principal borrowing amount requested by applicant ($500 to $100k).',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'dti',
    category: 'Direct Applicant',
    description: 'Debt-to-income percentage calculated from existing monthly debt payments and stated income.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'fico_score',
    category: 'Direct Applicant',
    description: 'Credit bureau FICO score (300 to 850 range) fetched at initial inquiry.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'revol_util',
    category: 'Direct Applicant',
    description: 'Revolving line credit utilization ratio percentage across all open lines.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'open_acc',
    category: 'Direct Applicant',
    description: 'Number of currently active, open credit lines on borrower credit file.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'total_acc',
    category: 'Direct Applicant',
    description: 'Historical lifetime count of credit accounts recorded by bureau.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'delinq_2yrs',
    category: 'Direct Applicant',
    description: 'Number of past-due payments (30+ days overdue) occurring in previous 24 months.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'credit_history_years',
    category: 'Direct Applicant',
    description: 'Calculated duration in years from earliest opened trade-line date to application date.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },

  // 3. Derivable / Engineered Features (22 features)
  {
    name: 'log_annual_inc',
    category: 'Derivable',
    description: 'Log-transformed annual earnings: log(annual_inc + 1) for distribution variance stabilization.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'log_revol_bal',
    category: 'Derivable',
    description: 'Log-transformed revolving credit balance: log(revol_bal + 1) to tame heavy right-tail skewness.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'installment_to_income',
    category: 'Derivable',
    description: 'Ratio of monthly debt service to monthly earnings: installment / (annual_inc / 12 + 1). Leaks target because it uses post-underwriting installment.',
    leakageRisk: 'Derived Leakage',
    availability: 'Derivable from Intake',
  },
  {
    name: 'loan_to_income',
    category: 'Derivable',
    description: 'Leverage ratio: loan_amnt / (annual_inc + 1). Quantifies borrower principal burden relative to income.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'open_to_total_acc_ratio',
    category: 'Derivable',
    description: 'Credit velocity metric: open_acc / (total_acc + 1). Measures active versus inactive portfolio utilization.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'revol_util_over_100',
    category: 'Derivable',
    description: 'Binary risk flag indicating revolving credit balances exceed maximum credit limits (revol_util > 100).',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'has_delinq_2yrs',
    category: 'Derivable',
    description: 'Binary derogatory flag indicating whether borrower has any delinquency in past 24 months (delinq_2yrs > 0).',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'term_60m',
    category: 'Derivable',
    description: 'Binary indicator for extended 60-month loan tenor (1 = 60 months, 0 = 36 months).',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'is_joint_app',
    category: 'Derivable',
    description: 'Binary indicator for co-borrower / joint credit application (1 = Joint App, 0 = Individual).',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'emp_length_num',
    category: 'Derivable',
    description: 'Continuous ordinal numeric mapping of employment duration string (0 for < 1 year to 10 for 10+ years).',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'emp_length_missing',
    category: 'Derivable',
    description: 'Binary missingness indicator flagging records where employment tenure was not supplied.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'home_RENT',
    category: 'Derivable',
    description: 'One-hot indicator for residential tenancy (housing tenure: RENT).',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'home_OWN',
    category: 'Derivable',
    description: 'One-hot indicator for outright home ownership without mortgage.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'home_OTHER',
    category: 'Derivable',
    description: 'One-hot indicator for alternative residential tenure (living with relatives, military, other).',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'purpose_debt_consolidation',
    category: 'Derivable',
    description: 'One-hot indicator for debt refinancing and credit consolidation loan purpose.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'purpose_credit_card',
    category: 'Derivable',
    description: 'One-hot indicator for revolving credit card payoff financing.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'purpose_home_improvement',
    category: 'Derivable',
    description: 'One-hot indicator for residential renovation and structural property improvements.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'purpose_small_business',
    category: 'Derivable',
    description: 'One-hot indicator for small commercial enterprise operations or capital expenditure.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'purpose_major_purchase',
    category: 'Derivable',
    description: 'One-hot indicator for high-ticket durable consumer goods purchases.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'purpose_medical',
    category: 'Derivable',
    description: 'One-hot indicator for healthcare, hospitalization, or medical procedure financing.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'purpose_car',
    category: 'Derivable',
    description: 'One-hot indicator for automotive financing or personal vehicle acquisition.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'purpose_other',
    category: 'Derivable',
    description: 'One-hot indicator for miscellaneous consumer borrowing needs.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
];

export const FeasibilityAuditPage: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFeatures = FEATURE_AUDIT_DATA.filter((feat) => {
    const matchesCat =
      filterCategory === 'all' || feat.category === filterCategory;
    const matchesSearch =
      feat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const postUnderwritingCount = FEATURE_AUDIT_DATA.filter(f => f.category === 'Post-Underwriting').length;
  const directApplicantCount = FEATURE_AUDIT_DATA.filter(f => f.category === 'Direct Applicant').length;
  const derivableCount = FEATURE_AUDIT_DATA.filter(f => f.category === 'Derivable').length;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <span className="badge badge-high">Phase 0 Governance Report</span>
          <span className="badge badge-moderate">35-Feature Availability Matrix</span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
          Model Feasibility & Target Leakage Audit
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Comprehensive reconciliation of all 35 pipeline features: 8 direct intake fields, 22 derivations, and 5 post-underwriting blockers.
        </p>
      </div>

      {/* Crisp KPI Bar */}
      <div className="kpi-bar">
        <div className="kpi-card">
          <div className="kpi-label">Total Pipeline Features</div>
          <div className="kpi-value">{FEATURE_AUDIT_DATA.length} Dims</div>
          <div className="kpi-subtext">Exact serialized schema alignment</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Intake Available</div>
          <div className="kpi-value" style={{ color: 'var(--status-low)' }}>{directApplicantCount} Direct</div>
          <div className="kpi-subtext">Stated by applicant or credit bureau</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-label">Derivable from Intake</div>
          <div className="kpi-value" style={{ color: 'var(--accent-blue)' }}>{derivableCount} Derived</div>
          <div className="kpi-subtext">Log, ratio, and one-hot transforms</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-label">Post-Underwriting Blockers</div>
          <div className="kpi-value" style={{ color: 'var(--status-high)' }}>{postUnderwritingCount} Features</div>
          <div className="kpi-subtext">Require lender underwriting decisions</div>
        </div>
      </div>

      {/* Deep-Dive Analysis on the 4 Core Underwriting Blockers */}
      <div className="card" style={{ borderLeft: '4px solid var(--status-high)' }}>
        <div className="card-header">
          <div className="card-title">
            <AlertOctagon size={18} color="var(--status-high)" />
            <span>The 4 Post-Underwriting Blockers</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--status-high)', fontSize: '0.875rem' }}>
              sub_grade_num
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.5rem' }}>
              Subgrade (A1 = 1 to G5 = 35)
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              The lender's internal underwriting committee assigns this after synthesizing all credit data. Because it summarizes default risk, feeding it to the model introduces severe circular endogeneity.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--status-high)', fontSize: '0.875rem' }}>
              int_rate
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.5rem' }}>
              Contractual Interest Rate (%)
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              The interest rate is determined by the lender's risk premium. Higher-risk borrowers are charged higher rates. Using rate to predict default leaks the lender's prior assessment.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--status-high)', fontSize: '0.875rem' }}>
              installment
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.5rem' }}>
              Monthly Repayment Dollar Amount
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Calculated via loan amortization formula using <code>loan_amnt</code>, <code>term</code>, and <code>int_rate</code>. Without an agreed interest rate, installment is undefined.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--status-high)', fontSize: '0.875rem' }}>
              ver_Source_Verified / ver_Verified
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.5rem' }}>
              Lender Documentation Verification Flags
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Indicates whether the lender's manual operations department verified tax returns or paystubs. This operational milestone occurs post-intake during underwriting review.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Search and Filter */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <FileSearch size={18} color="var(--accent-teal)" />
              <span>Interactive 35-Feature Audit Matrix</span>
            </div>
            <div className="card-subtitle">
              Showing {filteredFeatures.length} of {FEATURE_AUDIT_DATA.length} model features
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search 35 features..."
              className="form-input"
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', width: '220px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="form-select"
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories (35)</option>
              <option value="Post-Underwriting">Post-Underwriting Only (5 Blockers)</option>
              <option value="Direct Applicant">Direct Applicant / Bureau (8)</option>
              <option value="Derivable">Derivable Features (22)</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Feature Name</th>
                <th>Category</th>
                <th>Availability Timing</th>
                <th>Data Leakage Assessment</th>
                <th>Description & Formula</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map((feat) => (
                <tr key={feat.name}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: feat.category === 'Post-Underwriting' ? 'var(--status-high)' : 'var(--text-primary)' }}>
                    {feat.name}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        feat.category === 'Post-Underwriting'
                          ? 'badge-high'
                          : feat.category === 'Derivable'
                          ? 'badge-moderate'
                          : 'badge-low'
                      }`}
                    >
                      {feat.category}
                    </span>
                  </td>
                  <td>{feat.availability}</td>
                  <td>
                    <span style={{
                      color: feat.leakageRisk.startsWith('High')
                        ? 'var(--status-high)'
                        : feat.leakageRisk === 'Derived Leakage'
                        ? 'var(--status-elevated)'
                        : 'var(--text-muted)',
                      fontWeight: feat.leakageRisk !== 'None' ? 600 : 400
                    }}>
                      {feat.leakageRisk}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                    {feat.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Solution: 2-Stage Architecture */}
      <div className="card" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-teal)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Recommended Industry Path: Two-Stage Credit Model
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '1rem' }}>
          To enable safe prospective applicant scoring in a production environment, the modeling pipeline should be partitioned into two distinct models:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Stage 1: Prospective Application Scorer
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Trained exclusively on 30 non-leakage applicant/bureau features (8 direct + 22 safe derivations). Predicts pre-underwriting approval odds without requiring interest rates or internal grades.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Stage 2: Pricing & Portfolio Monitoring
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              The existing 35-feature models serve Stage 2. Once loan terms are assigned, they monitor portfolio default probability, calculate capital reserves, and stress-test historical tranches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
