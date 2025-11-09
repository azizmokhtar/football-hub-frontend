import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useAuthActions, useAuthUser } from '@/stores/auth.store';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { UserMiniCard } from "@/components/userMiniCard";

// --- SidebarLink ---
// Updated to have slightly more padding, a clearer text color for inactive
// state, and a more prominent hover/active state.
function SidebarLink({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-gray-800 text-white' // Active state
            : 'text-gray-400 hover:bg-gray-800 hover:text-white', // Inactive state
        ].join(' ')
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

// --- AppSidebar ---
// Switched to bg-gray-900, improved the header section with
// better spacing and typography, and updated border colors to match.
const AppSidebar = () => {
  const user = useAuthUser();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-gray-900 text-gray-100 border-r border-gray-700">
      {/* Sidebar Header */}
      <div className="px-4 py-5 border-b border-gray-700">
        <UserMiniCard />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <SidebarLink to="/app/dashboard" label="Dashboard" />
        <SidebarLink to="/app/calendar" label="Calendar" />
        <SidebarLink to="/app/communication" label="Messages" />
        <SidebarLink to="/app/documents" label="Documents" />
        {!isAdmin && <SidebarLink to="/app/team" label="My Team" />}
        {!isAdmin && <SidebarLink to="/app/lineup" label="Lineup Builder" />}

        <SidebarLink to="/app/profile" label="Profile" />
        {isAdmin && (
          <>
            <div className="my-3 h-px bg-gray-700" />
            <SidebarLink to="/app/admin" label="Admin Page" />
          </>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="px-3 pb-4 text-[10px] text-gray-500">
        v0.1 • © {new Date().getFullYear()}
      </div>
    </aside>
  );
};

// --- AppHeader ---
// Updated header blur/opacity for a slightly cleaner look.
// Replaced the bright red button with a more professional, subtle
// destructive button style (light red background, dark red text).
const AppHeader = () => {
  const navigate = useNavigate();
  const { refreshToken } = useAuth();
  const { logout: logoutAction } = useAuthActions();

  const { mutate: logout, isPending } = useMutation({
    mutationFn: async () => {
      if (refreshToken) await authService.logout(refreshToken);
    },
    onSettled: () => {
      logoutAction();
      navigate('/login', { replace: true });
    },
  });

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-200">
      <div className="h-14 flex items-center justify-end px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => logout()}
          disabled={isPending}
          className="inline-flex items-center rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-200 disabled:opacity-50"
        >
          {isPending ? 'Logging out…' : 'Logout'}
        </button>
      </div>
    </header>
  );
};

// --- AppLayout ---
// Changed main background to gray-50 for a very subtle contrast.
// Wrapped the <Outlet /> in a container with a max-width and
// responsive padding for a more professional, centered content look.
export const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <AppHeader />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {/* Constrained content wrapper */}
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <Outlet key={location.pathname} />
          </div>
        </main>
      </div>
    </div>
  );
};