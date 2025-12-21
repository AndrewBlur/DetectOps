import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Authenticated Pages (will be under /app)
import AppLayout from './components/AppLayout';
import ImagesPage from './pages/ImagesPage'; // Will be renamed to ImagesPage
import PredictionsPage from './pages/PredictionsPage';
import SettingsPage from './pages/SettingsPage';
import AnnotatedImagesPage from './pages/AnnotatedImagesPage';
import AnnotationPage from './pages/AnnotationPage';


function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route path="/app" element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                {/* Nested routes within AppLayout */}
                <Route path="images" element={<ImagesPage />} />
                <Route path="annotate" element={<AnnotationPage />} />
                <Route path="annotated" element={<AnnotatedImagesPage />} />

                <Route path="predictions" element={<PredictionsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                {/* Default route for /app will redirect to /app/images */}
                <Route index element={<ImagesPage />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
