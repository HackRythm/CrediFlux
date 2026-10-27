import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { FeasibilityAuditPage } from '../pages/FeasibilityAuditPage';

describe('FeasibilityAuditPage', () => {
  it('renders summary stats and 4 post-underwriting blockers', () => {
    render(
      <HashRouter>
        <FeasibilityAuditPage />
      </HashRouter>
    );

    expect(screen.getByText('Model Feasibility & Target Leakage Audit')).toBeInTheDocument();
    expect(screen.getByText('The 4 Post-Underwriting Blockers')).toBeInTheDocument();
    expect(screen.getAllByText('sub_grade_num').length).toBeGreaterThan(0);
    expect(screen.getAllByText('int_rate').length).toBeGreaterThan(0);
    expect(screen.getAllByText('installment').length).toBeGreaterThan(0);
  });

  it('filters features using category dropdown', () => {
    render(
      <HashRouter>
        <FeasibilityAuditPage />
      </HashRouter>
    );

    const categorySelect = screen.getByRole('combobox');
    fireEvent.change(categorySelect, { target: { value: 'Post-Underwriting' } });

    expect(screen.getAllByText('Post-Underwriting').length).toBeGreaterThan(0);
    expect(screen.queryByText('fico_score')).not.toBeInTheDocument();
  });
});
