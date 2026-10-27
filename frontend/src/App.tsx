import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ApplicantAssessmentPage } from './pages/ApplicantAssessmentPage';
import { RetrospectiveScoringPage } from './pages/RetrospectiveScoringPage';
import { ModelInsightsPage } from './pages/ModelInsightsPage';
import { FeasibilityAuditPage } from './pages/FeasibilityAuditPage';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="assess" element={<ApplicantAssessmentPage />} />
          <Route path="retrospective" element={<RetrospectiveScoringPage />} />
          <Route path="insights" element={<ModelInsightsPage />} />
          <Route path="audit" element={<FeasibilityAuditPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
