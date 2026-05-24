import type { components } from '@/types/api';
import { apiFetch } from './client';

type User = components['schemas']['User'];

export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>('/users/me');
}
