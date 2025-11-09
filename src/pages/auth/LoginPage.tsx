import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { LoginSchema } from '@/services/auth.schemas';
import { authService } from '@/services/auth.service';
import { useAuthActions } from '@/stores/auth.store';

// Reusable UI components (code in next section)
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

type LoginFormValues = z.infer<typeof LoginSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login: loginAction } = useAuthActions();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
  });

  const { mutate: login, isPending, error } = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Data is AuthResponse
      loginAction({
        user: data.user,
        accessToken: data.access,
        refreshToken: data.refresh,
      });
      navigate('/app'); // Redirect to dashboard
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    login(data);
  };

  const apiError = error as any; // Type assertion for API error

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {apiError && (
        <div className="text-red-500 text-sm p-3 bg-red-50 rounded">
          {apiError.response?.data?.detail || "An unknown error occurred."}
        </div>
      )}
      
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="coach@team.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
        />
        {apiError && (
          <div className="text-red-500 text-sm p-3 bg-red-50 rounded break-words">
            {apiError.response?.data?.detail
              || apiError.response?.statusText
              || apiError.message
              || "An unknown error occurred."}
          </div>
        )}

      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
};

export default LoginPage;