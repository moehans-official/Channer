import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { HomePage } from './pages/Home';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { DashboardPage } from './pages/Dashboard';
import { ChannelsPage } from './pages/Channels';
import { ModelsPage } from './pages/Models';
import { KeysPage } from './pages/Keys';
import { LogsPage } from './pages/Logs';
import { SettingsPage } from './pages/Settings';
import { useAuthStore } from './stores/authStore';
import zhCN from 'antd/locale/zh_CN';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
}

function ThemedApp() {
  const { theme: currentTheme } = useTheme();
  
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
        components: {
          Card: {
            colorBgContainer: currentTheme === 'dark' ? '#141414' : '#fff',
          },
          Table: {
            colorBgContainer: currentTheme === 'dark' ? '#141414' : '#fff',
          },
          Modal: {
            colorBgElevated: currentTheme === 'dark' ? '#141414' : '#fff',
          },
          Drawer: {
            colorBgElevated: currentTheme === 'dark' ? '#141414' : '#fff',
          },
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard"
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
      </AntApp>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

export default App;
