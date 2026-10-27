import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import { RetrospectiveScoringPage } from '../pages/RetrospectiveScoringPage';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    assessRetrospective: vi.fn(),
    assessRetrospectiveBatch: vi.fn(),
  },
}));

vi.mock('recharts', async () => {
  const actual: any = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div style={{ width: '400px', height: '200px' }}>{children}</div>,
  };
});

describe('RetrospectiveScoringPage', () => {
  it('renders single loan form and switches tabs', async () => {
    const user = userEvent.setup();
    render(
      <HashRouter>
        <RetrospectiveScoringPage />
      </HashRouter>
    );

    expect(screen.getByText('Retrospective Historical Scoring Engine')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Score Historical Loan/i })).toBeInTheDocument();

    const batchTab = screen.getByRole('button', { name: /Batch CSV Portfolio Evaluation/i });
    await user.click(batchTab);

    expect(screen.getByText('Batch Loan Portfolio Evaluation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Sample CSV/i })).toBeInTheDocument();
  });

  it('submits historical record and displays risk probability and band', async () => {
    (api.assessRetrospective as any).mockResolvedValueOnce({
      status: 'ok',
      model: 'Logistic Regression',
      default_probability: 0.1845,
      repayment_probability: 0.8155,
      predicted_class: 0,
      predicted_label: 'Fully Paid',
      risk_band: 'Low Risk',
      band_rationale: 'Favorable credit profile with low debt-to-income',
      threshold_used: 0.5,
      feature_contributions: [
        { feature: 'sub_grade_num', contribution: -0.42, direction: 'decreases_risk', description: '' },
      ],
      disclaimer: 'Retrospective Historical Assessment Only',
      evaluation_type: 'Retrospective Historical Scoring',
      is_prospective_approval: false,
    });

    render(
      <HashRouter>
        <RetrospectiveScoringPage />
      </HashRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Score Historical Loan/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('18.45%')).toBeInTheDocument();
      expect(screen.getByText('81.55%')).toBeInTheDocument();
      expect(screen.getAllByText('Low Risk').length).toBeGreaterThan(0);
      expect(screen.getByText(/Favorable credit profile/i)).toBeInTheDocument();
    });
  });
});
