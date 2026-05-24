import type { components } from '@/types/api';
import { apiFetch } from './client';

type Tournament = components['schemas']['Tournament'];

export async function listTournaments(): Promise<Tournament[]> {
  const data = await apiFetch<components['schemas']['TournamentListResponse']>('/tournaments');
  return data.tournaments;
}
