import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { CallCardPage } from './pages/CallCard/CallCardPage';
import { CallsPage } from './pages/Calls/CallsPage';
import { UploadPage } from './pages/Upload/UploadPage';
import { AuthPage } from './pages/Auth/AuthPage';
import { useAuth } from './store/authStore';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/calls" replace />} />
        <Route path="/calls"     element={<CallsPage />} />
        <Route path="/calls/new" element={<UploadPage />} />
        <Route path="/calls/:id" element={<CallCardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/calls" replace />} />
    </Routes>
  );
};

export default App;
