import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { ModelInsightsPage } from '../pages/ModelInsightsPage';

// Mock Recharts ResponsiveContainer to avoid size zero issues in jsdom
vi.mock('recharts', async () => {
  const actual: any = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div style={{ width: '500px', height: '300px' }}>{children}</div>,
  };
});

describe('ModelInsightsPage', () => {
  it('renders accuracy paradox explanation and metrics tables', () => {
    render(
      <HashRouter>
        <ModelInsightsPage />
      </HashRouter>
    );

    expect(screen.getByText('Model Comparative Insights & The Accuracy Paradox')).toBeInTheDocument();
    expect(screen.getByText('The Accuracy Paradox in Credit Risk Underwriting')).toBeInTheDocument();
    expect(screen.getByText('Empirical Confusion Matrix Breakdown (10,000 Test Loans)')).toBeInTheDocument();
    expect(screen.getByText('Logistic Regression Matrix')).toBeInTheDocument();
    expect(screen.getByText('Random Forest Matrix')).toBeInTheDocument();
    expect(screen.getByText('Model Comparison Table (Including Linear Regression Baseline)')).toBeInTheDocument();
  });
});
