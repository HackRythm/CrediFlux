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

interface FeatureAuditEntry {
  name: string;
  category: 'Direct Applicant' | 'Derivable' | 'Post-Underwriting';
  description: string;
  leakageRisk: 'High (Target Leakage)' | 'None' | 'Low';
  availability: 'Available at Intake' | 'Derivable from Intake' | 'Post-Underwriting Only';
}

const FEATURE_AUDIT_DATA: FeatureAuditEntry[] = [
  // 4 Post-Underwriting
  {
    name: 'sub_grade_num',
    category: 'Post-Underwriting',
    description: 'Internal lender risk subgrade (A1-G5 mapped to 1-35). Determined by credit committee or pricing engine.',
    leakageRisk: 'High (Target Leakage)',
    availability: 'Post-Underwriting Only',
  },
  {
    name: 'int_rate',
    category: 'Post-Underwriting',
    description: 'Contractual interest rate percentage. Set by lender according to risk pricing tier.',
    leakageRisk: 'High (Target Leakage)',
    availability: 'Post-Underwriting Only',
  },
  {
    name: 'installment',
    category: 'Post-Underwriting',
    description: 'Monthly repayment dollar amount. Function of loan amount, interest rate, and term.',
    leakageRisk: 'High (Target Leakage)',
    availability: 'Post-Underwriting Only',
  },
  {
    name: 'verification_status_Source Verified',
    category: 'Post-Underwriting',
    description: 'Lender underwriting team verified borrower paystubs/tax documents.',
    leakageRisk: 'High (Target Leakage)',
    availability: 'Post-Underwriting Only',
  },
  // Direct Applicant / Bureau
  {
    name: 'loan_amnt',
    category: 'Direct Applicant',
    description: 'Requested borrowing amount.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'annual_inc',
    category: 'Direct Applicant',
    description: 'Borrower stated annual earnings before taxes.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'fico_score',
    category: 'Direct Applicant',
    description: 'Average of FICO low and high bounds from credit bureau.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'dti',
    category: 'Direct Applicant',
    description: 'Debt-to-income percentage from credit report.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'open_acc',
    category: 'Direct Applicant',
    description: 'Number of active credit lines currently open.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'total_acc',
    category: 'Direct Applicant',
    description: 'Historical count of all credit lines ever opened.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'revol_bal',
    category: 'Direct Applicant',
    description: 'Unpaid balance across all revolving credit lines.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'revol_util',
    category: 'Direct Applicant',
    description: 'Revolving line utilization ratio.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'delinq_2yrs',
    category: 'Direct Applicant',
    description: 'Past-due 30+ day payments in previous 24 months.',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  {
    name: 'pub_rec',
    category: 'Direct Applicant',
    description: 'Number of derogatory public records (bankruptcies, liens).',
    leakageRisk: 'None',
    availability: 'Available at Intake',
  },
  // Derivable
  {
    name: 'log_annual_inc',
    category: 'Derivable',
    description: 'Log(annual_inc + 1) for variance stabilization.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'log_loan_amnt',
    category: 'Derivable',
    description: 'Log(loan_amnt + 1) transform.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'log_revol_bal',
    category: 'Derivable',
    description: 'Log(revol_bal + 1) transform.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'loan_to_income',
    category: 'Derivable',
    description: 'loan_amnt / (annual_inc + 1). Ratio of principal to earnings.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'credit_history_years',
    category: 'Derivable',
    description: 'Years since earliest credit line opening date.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'term_int',
    category: 'Derivable',
    description: 'Ordinal integer (36 or 60 months).',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'emp_length_num',
    category: 'Derivable',
    description: 'Numeric parsing of employment duration string.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'home_ownership_MORTGAGE',
    category: 'Derivable',
    description: 'One-hot encoding of home ownership status.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'home_ownership_RENT',
    category: 'Derivable',
    description: 'One-hot encoding of rental status.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'home_ownership_OWN',
    category: 'Derivable',
    description: 'One-hot encoding of outright ownership.',
    leakageRisk: 'None',
    availability: 'Derivable from Intake',
  },
  {
    name: 'home_ownership_OTHER',
    category: 'Derivable',
    description: 'One-hot encoding for alternative housing.',
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

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-high">Phase 0 Governance Report</span>
          <span className="badge badge-moderate">35-Feature Availability Matrix</span>
        </div>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Model Feasibility & Target Leakage Audit
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Detailed classification of all 35 features: direct applicant fields, derivations, and post-underwriting blockers.
        </p>
      </div>

      {/* Crisp KPI Bar */}
      <div className="kpi-bar">
        <div className="kpi-card">
          <div className="kpi-label">Total Features</div>
          <div className="kpi-value">35 Features</div>
          <div className="kpi-subtext">Serialized schema definition</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Intake Available</div>
          <div className="kpi-value" style={{ color: 'var(--status-low)' }}>20 Direct</div>
          <div className="kpi-subtext">Borrower & credit bureau</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-label">Derivable</div>
          <div className="kpi-value" style={{ color: 'var(--accent-blue)' }}>11 Derived</div>
          <div className="kpi-subtext">Log & ratio transforms</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-label">Post-Underwriting</div>
          <div className="kpi-value" style={{ color: 'var(--status-high)' }}>4 Blockers</div>
          <div className="kpi-subtext">Require lender underwriting</div>
        </div>
      </div>

      {/* Deep-Dive Analysis on the 4 Blockers */}
      <div className="card" style={{ borderLeft: '4px solid var(--status-high)' }}>
        <div className="card-header">
          <div className="card-title">
            <AlertOctagon size={18} color="var(--status-high)" />
            <span>The 4 Post-Underwriting Blockers</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--status-high)', fontSize: '0.875rem' }}>
              sub_grade_num
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.5rem' }}>
              Subgrade (A1 = 1 to G5 = 35)
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              The lender's internal grading committee assigns this after reviewing all credit information. It is already a summary score of risk; feeding it into the model causes circular reasoning.
            </p>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--status-high)', fontSize: '0.875rem' }}>
              int_rate
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.5rem' }}>
              Contractual Interest Rate
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              The interest rate is determined by the lender's risk premium. Higher-risk borrowers are charged higher rates. Using this to predict default leaks the lender's existing decision.
            </p>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--status-high)', fontSize: '0.875rem' }}>
              installment
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.5rem' }}>
              Monthly Repayment Dollar Amount
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Computed directly via loan amortization formula using <code>loan_amnt</code>, <code>term</code>, and <code>int_rate</code>. Without knowing <code>int_rate</code>, installment cannot be calculated.
            </p>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--status-high)', fontSize: '0.875rem' }}>
              verification_status
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.5rem' }}>
              Document Verification Flag
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Indicates whether the lender's manual operations or document-checking department verified W-2s or tax filings. Not available before underwriting begins.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Search and Filter */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FileSearch size={18} color="var(--accent-teal)" />
            <span>Interactive Feature Matrix</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search features..."
              className="form-input"
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', width: '200px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="form-select"
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Post-Underwriting">Post-Underwriting Only (Blockers)</option>
              <option value="Direct Applicant">Direct Applicant / Bureau</option>
              <option value="Derivable">Derivable Features</option>
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
                <th>Description</th>
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
                    <span style={{ color: feat.leakageRisk.startsWith('High') ? 'var(--status-high)' : 'var(--text-muted)' }}>
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
      <div className="card" style={{ background: 'var(--bg-input)', border: '1px solid var(--accent-teal)' }}>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--accent-teal)', marginBottom: '0.5rem' }}>
          Recommended Industry Path: Two-Stage Credit Model
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          To enable safe prospective applicant scoring in a production environment, the modeling pipeline should be partitioned into two distinct models:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Stage 1: Prospective Application Scorer
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Trained exclusively on 20 applicant/bureau features (FICO, DTI, income, credit lines). Predicts pre-underwriting approval odds without requiring interest rates or internal grades.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
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
