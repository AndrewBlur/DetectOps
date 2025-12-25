import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Authenticated Pages
import AppLayout from './components/AppLayout';
import ProjectDashboard from './pages/ProjectDashboard';
import ImagesPage from './pages/ImagesPage';
import PredictionsPage from './pages/PredictionsPage';
import SettingsPage from './pages/SettingsPage';
import AnnotatedImagesPage from './pages/AnnotatedImagesPage';
import AnnotationPage from './pages/AnnotationPage';
import DatasetsPage from './pages/DatasetsPage';

// A component to handle the root URL redirection
const Root = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Navigate to="/projects" replace /> : <LandingPage />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Root />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route path="/projects" element={<ProtectedRoute />}>
              <Route index element={<ProjectDashboard />} />
              <Route path=":projectId" element={<AppLayout />}>
                <Route path="images" element={<ImagesPage />} />
                <Route path="images/:imageId/annotate" element={<AnnotationPage />} />
                <Route path="annotated" element={<AnnotatedImagesPage />} />
                <Route path="predictions" element={<PredictionsPage />} />
                <Route path="datasets" element={<DatasetsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route index element={<Navigate to="images" replace />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;

