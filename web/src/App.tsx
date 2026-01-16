/**
 * Tessie Stats - Main Application Component
 *
 * @description Root component for the Tesla & Powerwall dashboard
 * @see ARCHITECTURE.md for component structure
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import {
  ChargingPage,
  DashboardPage,
  EnergyPage,
  LoginPage,
  NotFoundPage,
  SettingsPage,
  VehiclesPage,
} from '@/pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/energy" element={<EnergyPage />} />
            <Route path="/charging" element={<ChargingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
