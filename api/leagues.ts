import type { components } from '@/types/api';
import { apiFetch } from './client';

type League = components['schemas']['League'];
type LeagueListItem = components['schemas']['LeagueListItem'];
type LeagueDetail = components['schemas']['LeagueDetail'];
type LeagueListResponse = components['schemas']['LeagueListResponse'];

export async function listLeagues(): Promise<LeagueListItem[]> {
  const data = await apiFetch<LeagueListResponse>('/leagues');
  return data.leagues;
}

export async function createLeague(body: {
  tournament_id: string;
  name: string;
}): Promise<League> {
  return apiFetch<League>('/leagues', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function joinLeague(code: string): Promise<League> {
  return apiFetch<League>('/leagues/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function getLeague(id: string): Promise<LeagueDetail> {
  return apiFetch<LeagueDetail>(`/leagues/${id}`);
}

export async function deleteLeague(id: string): Promise<void> {
  await apiFetch<void>(`/leagues/${id}`, { method: 'DELETE' });
}

export async function leaveLeague(leagueId: string, userId: string): Promise<void> {
  await apiFetch<void>(`/leagues/${leagueId}/members/${userId}`, { method: 'DELETE' });
}
