import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Interviews } from './pages/Interviews';
import { NewInterview } from './pages/NewInterview';
import { InterviewLive } from './pages/InterviewLive';
import { Practice } from './pages/Practice';
import { Projects } from './pages/Projects';
import { Skills } from './pages/Skills';
import { Reports } from './pages/Reports';
import { Preparation } from './pages/Preparation';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated Application Shell */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/interviews/new" element={<NewInterview />} />
            <Route path="/interviews/:id" element={<InterviewLive />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/preparation" element={<Preparation />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
