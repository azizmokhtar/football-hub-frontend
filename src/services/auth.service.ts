import api from '@/lib/axios';
import type { AuthResponse, CustomUser } from '@/types';
import { LoginSchema, RegisterSchema, PasswordChangeSchema } from './auth.schemas';
import { z } from 'zod';

// Note: We use z.infer to get types from schemas
type LoginPayload = z.infer<typeof LoginSchema>;
type RegisterPayload = z.infer<typeof RegisterSchema>;
type PasswordChangePayload = z.infer<typeof PasswordChangeSchema>;

const login = async (credentials: LoginPayload): Promise<AuthResponse> => {
  const { data } = await api.post('/users/auth/login/', credentials);
  return data;
};

const register = async (userData: RegisterPayload): Promise<CustomUser> => {
  const { data } = await api.post('/users/auth/register/', userData);
  return data;
};

// Be tolerant: if refreshToken is missing/empty, skip server call.
const logout = async (refreshToken?: string): Promise<void> => {
  if (!refreshToken) return;
  await api.post('/users/auth/logout/', { refresh: refreshToken });
};

const getProfile = async (): Promise<CustomUser> => {
  const { data } = await api.get('/users/me/');
  return data;
};

const changePassword = async (passwords: PasswordChangePayload): Promise<void> => {
  // Your backend view uses `UserProfileSerializer` and expects `password`.
  await api.put('/users/auth/password/change/', {
    password: passwords.new_password,
  });
};

export const authService = {
  login,
  register,
  logout,
  getProfile,
  changePassword,
};
