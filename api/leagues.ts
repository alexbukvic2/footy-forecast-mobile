import type { components } from '@/types/api';
import { apiFetch } from './client';

type LeagueLeaderboardResponse = components['schemas']['LeagueLeaderboardResponse'];

type League = components['schemas']['League'];
type LeagueListItem = components['schemas']['LeagueListItem'];
type LeagueDetail = components['schemas']['LeagueDetail'];
type LeagueListResponse = components['schemas']['LeagueListResponse'];
type LeagueFixtureViewResponse = components['schemas']['LeagueFixtureViewResponse'];

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

export async function getLeagueLeaderboard(leagueId: string): Promise<LeagueLeaderboardResponse> {
  return apiFetch<LeagueLeaderboardResponse>(`/leagues/${leagueId}/leaderboard`);
}

export async function getLeagueScorePredictions(
  leagueId: string,
  query?: { n?: number; skip?: number },
): Promise<LeagueFixtureViewResponse[]> {
  const search = new URLSearchParams();

  if (query?.n !== undefined) {
    search.set('n', String(query.n));
  }

  if (query?.skip !== undefined) {
    search.set('skip', String(query.skip));
  }

  const qs = search.toString();
  const path = qs === ''
    ? `/leagues/${leagueId}/predictions`
    : `/leagues/${leagueId}/predictions?${qs}`;

  return apiFetch<LeagueFixtureViewResponse[]>(path);
}

export type { LeagueFixtureViewResponse };
