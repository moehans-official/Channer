import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { ChannelsPage } from './pages/Channels';
import { ModelsPage } from './pages/Models';
import { KeysPage } from './pages/Keys';
import { LogsPage } from './pages/Logs';
import { SettingsPage } from './pages/Settings';
import { useAuthStore } from './stores/authStore';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/channels"
          element={
            <PrivateRoute>
              <ChannelsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/models"
          element={
            <PrivateRoute>
              <ModelsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/keys"
          element={
            <PrivateRoute>
              <KeysPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <PrivateRoute>
              <LogsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
