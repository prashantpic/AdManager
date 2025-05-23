import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Layouts - Placeholders, will be defined in src/layouts/
const MainLayout = React.lazy(() => import('./layouts/MainLayout'));
const AuthLayout = React.lazy(() => import('./layouts/AuthLayout'));

// Guard - Placeholder, will be defined in src/core/guards/RequireAuth.tsx
const RequireAuth = React.lazy(() => import('./core/guards/RequireAuth'));

// Page Components - Placeholders, will be defined in src/features/
const LoginPage = React.lazy(() => import('./features/auth/pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./features/auth/pages/RegisterPage'));
const MfaSetupPage = React.lazy(() => import('./features/auth/pages/MfaSetupPage'));
const DashboardPage = React.lazy(() => import('./features/dashboard/pages/DashboardPage'));
const ProductCatalogListPage = React.lazy(() => import('./features/productCatalog/pages/ProductCatalogListPage'));
const CampaignListPage = React.lazy(() => import('./features/campaigns/pages/CampaignListPage'));
const ReportingPage = React.lazy(() => import('./features/reporting/pages/ReportingPage'));
const AccountSettingsPage = React.lazy(() => import('./features/settings/pages/AccountSettingsPage'));
// Add more lazy-loaded pages as they are defined

import * as routePaths from './router/routePaths'; // Placeholder: will be defined in src/router/routePaths.ts

// ComponentId: merchant-frontend-application-shell-001
// REQ-FE-001: Orchestrates page structure, global layouts, routing.
// REQ-FE-005: Root component for the SPA.
// REQ-FE-013: Responsive design handled by MUI and layouts.

// Placeholder for ErrorBoundary - Will be defined in src/core/errors/ErrorBoundary.tsx
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => <>{children}</>;


const App: React.FC = () => {
  // Basic loading spinner for lazy loaded components
  const SuspenseFallback = (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <ErrorBoundary>
      <Suspense fallback={SuspenseFallback}>
        <Routes>
          {/* Public routes */}
          <Route element={<AuthLayout />}>
            <Route path={routePaths.LOGIN_PATH} element={<LoginPage />} />
            <Route path={routePaths.REGISTER_PATH} element={<RegisterPage />} />
            {/* Add other public routes like Forgot Password, Reset Password here */}
          </Route>

          {/* Protected routes */}
          <Route element={<RequireAuth />}>
            <Route element={<MainLayout />}>
              <Route path={routePaths.DASHBOARD_PATH} element={<DashboardPage />} />
              <Route path={routePaths.MFA_SETUP_PATH} element={<MfaSetupPage />} /> {/* Usually part of auth flow but might be post-login setup */}
              <Route path={routePaths.PRODUCT_CATALOG_LIST_PATH} element={<ProductCatalogListPage />} />
              <Route path={routePaths.CAMPAIGN_LIST_PATH} element={<CampaignListPage />} />
              <Route path={routePaths.REPORTING_PATH} element={<ReportingPage />} />
              <Route path={routePaths.ACCOUNT_SETTINGS_PATH} element={<AccountSettingsPage />} />
              {/* Add more protected routes here */}
              <Route path="/" element={<Navigate to={routePaths.DASHBOARD_PATH} replace />} />
            </Route>
          </Route>

          {/* Fallback for undefined routes - can be a NotFoundPage component */}
          <Route path="*" element={<Navigate to={routePaths.DASHBOARD_PATH} replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;