import type { AuthResponse } from '../types';
import { apiClient } from './client';

export const login = (username: string, password: string) =>
  apiClient.post<AuthResponse>('/auth/login', { username, password }).then(r => r.data);

export const register = (username: string, password: string) =>
  apiClient.post<AuthResponse>('/auth/register', { username, password }).then(r => r.data);
