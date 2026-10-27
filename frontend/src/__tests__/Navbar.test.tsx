import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { HealthResponse, UserProfile } from '../types';

const mockHealth: HealthResponse = {
  status: 'healthy',
  loaded_models: ['Logistic Regression', 'Random Forest'],
  sklearn_version: '1.7.2',
  expected_sklearn_version: '1.7.2',
  scikit_learn_match: true,
  app_version: '1.0.0',
  models_dir: 'models',
};

const mockProfile: UserProfile = {
  name: 'Auditor Terminal',
  title: 'Lead Credit Risk Architect',
  organization: 'CrediFlux Governance Lab',
  role: 'Model Risk Auditor',
  riskTolerance: 'Conservative',
};

describe('Navbar Component', () => {
  it('renders brand title and all primary navigation links', () => {
    render(
      <HashRouter>
        <Navbar
          health={mockHealth}
          healthError={null}
          profile={mockProfile}
          onUpdateProfile={vi.fn()}
        />
      </HashRouter>
    );

    expect(screen.getByText('CrediFlux')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Applicant Intake')).toBeInTheDocument();
    expect(screen.getByText('Retrospective Scoring')).toBeInTheDocument();
    expect(screen.getByText('Model Insights')).toBeInTheDocument();
    expect(screen.getByText('Feasibility Audit')).toBeInTheDocument();
  });

  it('displays API ready status pill when backend is connected', () => {
    render(
      <HashRouter>
        <Navbar
          health={mockHealth}
          healthError={null}
          profile={mockProfile}
          onUpdateProfile={vi.fn()}
        />
      </HashRouter>
    );

    expect(screen.getByText(/API Ready \(sklearn 1.7.2\)/i)).toBeInTheDocument();
  });

  it('opens and closes profile menu dropdown', async () => {
    const user = userEvent.setup();
    const handleUpdate = vi.fn();

    render(
      <HashRouter>
        <Navbar
          health={mockHealth}
          healthError={null}
          profile={mockProfile}
          onUpdateProfile={handleUpdate}
        />
      </HashRouter>
    );

    const trigger = screen.getByRole('button', { name: /Auditor Terminal/i });
    expect(screen.queryByText(/Active Perspective/i)).not.toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByText(/Active Perspective/i)).toBeInTheDocument();
    expect(screen.getByText('Credit Underwriter')).toBeInTheDocument();

    await user.click(screen.getByText('Credit Underwriter'));
    expect(handleUpdate).toHaveBeenCalledWith({ role: 'Credit Underwriter' });
  });
});
