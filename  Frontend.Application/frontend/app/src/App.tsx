import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Layouts (To be created)
import MainLayout from './layouts/MainLayout'; // Placeholder path
import AuthLayout from './layouts/AuthLayout'; // Placeholder path

// Pages (To be created - lazy loaded)
// Auth
const LoginPage = React.lazy(() => import('./features/auth/pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./features/auth/pages/RegisterPage'));
const MfaSetupPage = React.lazy(() => import('./features/auth/pages/MfaSetupPage'));

// Core App
const DashboardPage = React.lazy(() => import('./features/dashboard/pages/DashboardPage'));
const ProductCatalogListPage = React.lazy(() => import('./features/productCatalog/pages/ProductCatalogListPage'));
const CampaignListPage = React.lazy(() => import('./features/campaigns/pages/CampaignListPage'));
const ReportingPage = React.lazy(() => import('./features/reporting/pages/ReportingPage'));
const AppStoreMarketplacePage = React.lazy(() => import('./features/appStore/pages/AppStoreMarketplacePage'));
const AccountSettingsPage = React.lazy(() => import('./features/settings/pages/AccountSettingsPage'));

// Other Feature Pages (Placeholders)
const DiscountCodeManagementPage = React.lazy(() => import('./features/promotions/discountCodes/pages/DiscountCodeManagementPage'));
const AffiliateDashboardPage = React.lazy(() => import('./features/affiliateMarketing/pages/AffiliateDashboardPage'));
const LandingPageBuilderPage = React.lazy(() => import('./features/content/landingPages/pages/LandingPageBuilderPage'));
const BlogManagementPage = React.lazy(() => import('./features/content/blog/pages/BlogManagementPage'));


// Guards (To be created)
import RequireAuth from './core/guards/RequireAuth'; // Placeholder path

// Route Paths (To be created)
import { routePaths } from './router/routePaths'; // Placeholder path

// Fallback for Suspense
const SuspenseFallback: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

// Placeholder for a generic Not Found Page
const NotFoundPage: React.FC = () => (
  <Box sx={{ textAlign: 'center', mt: 5 }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
  </Box>
);


const App: React.FC = () => {
  // REQ-FE-001: SPA Foundation
  // REQ-FE-005: Application Entry Point (rendered by main.tsx)
  // REQ-FE-013: Responsive Design (handled by MUI Theme and GlobalStyles, layouts)
  // ComponentId: merchant-frontend-application-shell-001

  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        {/* Auth Layout Routes */}
        <Route element={<AuthLayout />}>
          <Route path={routePaths.login} element={<LoginPage />} />
          <Route path={routePaths.register} element={<RegisterPage />} />
          <Route path={routePaths.mfaSetup} element={<MfaSetupPage />} />
        </Route>

        {/* Main App Layout Routes (Protected) */}
        <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
          <Route path={routePaths.dashboard} element={<DashboardPage />} />
          <Route path={routePaths.productCatalogList} element={<ProductCatalogListPage />} />
          <Route path={routePaths.campaignList} element={<CampaignListPage />} />
          <Route path={routePaths.reporting} element={<ReportingPage />} />
          <Route path={routePaths.appStoreMarketplace} element={<AppStoreMarketplacePage />} />
          <Route path={routePaths.accountSettings} element={<AccountSettingsPage />} />
          
          {/* Placeholder routes for other features */}
          <Route path={routePaths.promotions.discountCodes} element={<DiscountCodeManagementPage />} />
          <Route path={routePaths.affiliateMarketing.dashboard} element={<AffiliateDashboardPage />} />
          <Route path={routePaths.content.landingPages.builder} element={<LandingPageBuilderPage />} />
          <Route path={routePaths.content.blog.management} element={<BlogManagementPage />} />


          {/* Default route for authenticated users, e.g., redirect to dashboard */}
          <Route path="/" element={<Navigate to={routePaths.dashboard} replace />} />
        </Route>

        {/* Fallback for unmatched routes */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default App;