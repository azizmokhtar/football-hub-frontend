import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard, GuestGuard } from './guards';
import { AdminGuard } from './guards'; // <-- add this
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Auth
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// App
const DashboardPage = () => <div>Dashboard Page</div>;
const CalendarPage = () => <div>Calendar Page</div>;
const CommunicationPage = () => <div>Communication Page</div>;
const DocumentsPage = () => <div>Documents Page</div>;
const TeamPage = () => <div>Team Page</div>;
const ProfilePage = () => <div>Profile Page</div>;

// Admin
import AdminPage from '@/pages/admin/AdminPage'; // <-- add this

const NotFoundPage = () => <div>404 Not Found</div>;

export const AppRouter = () => {
  return (
    <Routes>
      {/* Auth routes (for guests) */}
      <Route
        element={
          <GuestGuard>
            <AuthLayout />
          </GuestGuard>
        }
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* App routes (for authenticated users) */}
      <Route
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      >
        <Route path="/app/dashboard" element={<DashboardPage />} />
        <Route path="/app/calendar" element={<CalendarPage />} />
        <Route path="/app/communication" element={<CommunicationPage />} />
        <Route path="/app/documents" element={<DocumentsPage />} />
        <Route path="/app/team" element={<TeamPage />} />
        <Route path="/app/profile" element={<ProfilePage />} />

        {/* Admin-only route */}
        <Route
          path="/app/admin"
          element={
            <AdminGuard>
              <AdminPage />
            </AdminGuard>
          }
        />

        {/* Default app route */}
        <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/app" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
