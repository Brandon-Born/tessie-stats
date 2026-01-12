/**
 * Tessie Stats - Main Application Component
 *
 * @description Root component for the Tesla & Powerwall dashboard
 * @see ARCHITECTURE.md for component structure
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages will be imported here as they are created:
// import { Dashboard } from './pages/Dashboard';
// import { VehicleDetail } from './pages/VehicleDetail';
// import { ChargingHistory } from './pages/ChargingHistory';
// import { EnergyAnalytics } from './pages/EnergyAnalytics';
// import { Settings } from './pages/Settings';
// import { Login } from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Placeholder until pages are implemented */}
        <Routes>
          <Route path="/" element={<PlaceholderDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

/**
 * Placeholder component until dashboard is implemented
 */
function PlaceholderDashboard() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-6 p-8">
        <div className="text-6xl">🚗⚡</div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-tesla-red to-solar-400 bg-clip-text text-transparent">
          Tessie Stats
        </h1>
        <p className="text-slate-400 max-w-md">
          Tesla & Powerwall Dashboard
        </p>
        <div className="pt-4">
          <p className="text-sm text-slate-500">
            Project initialized. Start building!
          </p>
          <p className="text-xs text-slate-600 mt-2">
            See PROJECT.md for documentation
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
