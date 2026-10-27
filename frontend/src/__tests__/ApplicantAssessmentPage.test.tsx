import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import { ApplicantAssessmentPage } from '../pages/ApplicantAssessmentPage';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    assessProspective: vi.fn(),
  },
}));

describe('ApplicantAssessmentPage', () => {
  it('renders intake form with fields and buttons', () => {
    render(
      <HashRouter>
        <ApplicantAssessmentPage />
      </HashRouter>
    );

    expect(screen.getByText('Prospective Borrower Intake Assessment')).toBeInTheDocument();
    expect(screen.getByLabelText(/Requested Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/FICO Score/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run Pre-Underwriting Risk Assessment/i })).toBeInTheDocument();
  });

  it('populates fields when clicking Load Sample button', async () => {
    const user = userEvent.setup();
    render(
      <HashRouter>
        <ApplicantAssessmentPage />
      </HashRouter>
    );

    const loadSampleBtn = screen.getByRole('button', { name: /Load Sample/i });
    await user.click(loadSampleBtn);

    const amountInput = screen.getByLabelText(/Requested Amount/i) as HTMLInputElement;
    expect(amountInput.value).toBe('20000');
  });

  it('submits prospective application and renders unavailable diagnostic banner', async () => {
    const user = userEvent.setup();
    (api.assessProspective as any).mockResolvedValueOnce({
      status: 'unavailable',
      reason: 'Model requires 4 lender-assigned underwriting features',
      missing_features: [
        'sub_grade_num',
        'int_rate',
        'installment',
        'verification_status_Source Verified',
      ],
      limitations: [
        'Lender subgrade is assigned during underwriting',
        'Interest rate is an underwriting decision output',
      ],
      verdict: 'NOT READY',
      recommended_action: 'Use retrospective scoring or build pre-underwriting model',
    });

    render(
      <HashRouter>
        <ApplicantAssessmentPage />
      </HashRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Run Pre-Underwriting Risk Assessment/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Prospective Prediction Blocked by Governance Policy/i)).toBeInTheDocument();
      expect(screen.getByText(/sub_grade_num/i)).toBeInTheDocument();
      expect(screen.getByText(/int_rate/i)).toBeInTheDocument();
      expect(screen.getByText(/installment/i)).toBeInTheDocument();
      expect(screen.getByText(/VERDICT: NOT READY/i)).toBeInTheDocument();
    });
  });
});
