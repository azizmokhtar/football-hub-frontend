import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard, GuestGuard } from './guards';
import { AdminGuard } from './guards';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Auth
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// App
// src/router/index.tsx (top of file)
import DashboardPage from "@/pages/app/DashboardPage";
import CalendarPage from "@/pages/app/CalendarPage";
import CommunicationPage from "@/pages/app/CommunicationPage";
import DocumentsPage from "@/pages/app/DocumentsPage";
import TeamPage from "@/pages/app/TeamPage";
import ProfilePage from "@/pages/app/ProfilePage";

// Admin
import AdminPage from '@/pages/admin/AdminPage'; // <-- add this
import AdminUsersListPage from "@/pages/admin/AdminUsersListPage";
import AdminUserNewPage from "@/pages/admin/AdminUserNewPage";
import AdminTeamsListPage from "@/pages/admin/AdminTeamsListPage";
import AdminTeamNewPage from "@/pages/admin/AdminTeamNewPage";
import AdminUserDetailPage from "@/pages/admin/AdminUserDetailPage";
import AdminTeamDetailPage from "@/pages/admin/AdminTeamDetailPage";
import LineupBuilderPage from "@/pages/app/LineupBuilderPage";

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
        <Route path="/app/lineup" element={<LineupBuilderPage />} />

        {/* Admin-only route */}
        <Route
          path="/app/admin"
          element={
            <AdminGuard>
              <AdminPage />
            </AdminGuard>
          }
        />
        <Route path="/app/admin/users" element={
          <AdminGuard><AdminUsersListPage /></AdminGuard>
        }/>
        <Route path="/app/admin/users/new" element={
          <AdminGuard><AdminUserNewPage /></AdminGuard>
        }/>
        <Route path="/app/admin/teams" element={
          <AdminGuard><AdminTeamsListPage /></AdminGuard>
        }/>
        <Route path="/app/admin/teams/new" element={
          <AdminGuard><AdminTeamNewPage /></AdminGuard>
        }/>
        <Route path="/app/admin/users/:id" element={
          <AdminGuard><AdminUserDetailPage /></AdminGuard>
        }/>
        <Route path="/app/admin/teams/:id" element={
          <AdminGuard><AdminTeamDetailPage /></AdminGuard>
        }/>
        
        
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
