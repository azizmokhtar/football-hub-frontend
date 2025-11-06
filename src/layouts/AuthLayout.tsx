// authlayout.tsx
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gray-50 p-4">
      {/* Remove max-w-md here */}
      <div className="w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Football Performance Hub</h1>
          <p className="text-sm text-gray-500">Sign in to continue</p>
        </div>

        {/* Apply the width cap only to the card */}
        <div className="mx-auto w-full max-w-md bg-white p-6 shadow-sm rounded-xl border border-gray-100">
          <Outlet />
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} F.P.H.
        </p>
      </div>
    </div>
  );
};
