/**
 * auth.service.ts — real authentication against Flask-Login backend.
 */

import { post, get } from './api';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  preferredLanguage: string;
  district: string;
  village: string;
  farmSize: string;
  cropType: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export const authService = {
  /** Login with email + password (Flask-Login session cookie is set). */
  async login(email: string, password: string): Promise<AuthResponse> {
    return post<AuthResponse>('/api/auth/login', { email, password });
  },

  /** Sign up (also logs the user in). */
  async signup(
    name: string,
    email: string,
    password: string,
    phone?: string,
    district?: string,
    village?: string,
    preferredLanguage?: string,
    farmSize?: string,
    cropType?: string
  ): Promise<AuthResponse> {
    return post<AuthResponse>('/api/auth/signup', {
      name,
      email,
      password,
      phone,
      district,
      village,
      preferred_language: preferredLanguage,
      farm_size: farmSize,
      crop_type: cropType,
    });
  },

  /** Logout (clears session cookie). */
  async logout(): Promise<{ success: boolean }> {
    return post<{ success: boolean }>('/api/auth/logout');
  },

  /** Fetch the currently authenticated user (or 401 if not logged in). */
  async me(): Promise<{ user: AuthUser }> {
    return get<{ user: AuthUser }>('/api/auth/me');
  },
};
