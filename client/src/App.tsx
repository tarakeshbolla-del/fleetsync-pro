import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import type { RootState } from './store';
import { store } from './store';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { FleetPage } from './pages/Fleet';
import { DriversPage } from './pages/Drivers';
import { RentalsPage } from './pages/Rentals';
import { InvoicesPage } from './pages/Invoices';
import { CompliancePage } from './pages/Compliance';
import { LoginPage } from './pages/Login';
import { OnboardingPage } from './pages/Onboarding';
import { DriverOperations } from './pages/DriverOperations';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding/:token" element={<OnboardingPage />} />
      <Route path="/dashboard/operations" element={
        <ProtectedRoute>
          <DriverOperations />
        </ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="fleet" element={<FleetPage />} />
        <Route path="drivers" element={<DriversPage />} />
        <Route path="rentals" element={<RentalsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="compliance" element={<CompliancePage />} />
      </Route>
    </Routes>
  );
}


function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
