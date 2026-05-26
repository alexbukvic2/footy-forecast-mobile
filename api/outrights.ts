import type { components } from '@/types/api';
import { apiFetch } from './client';

export type TeamWithHandicaps = components['schemas']['TeamWithHandicaps'];
export type TeamPredictionView = components['schemas']['TeamPredictionView'];
export type PlayerPredictionView = components['schemas']['PlayerPredictionView'];
export type TeamPredictionsListResponse = components['schemas']['TeamPredictionsListResponse'];
export type PlayerPredictionsListResponse = components['schemas']['PlayerPredictionsListResponse'];
export type BulkTeamPredictionItem = components['schemas']['BulkTeamPredictionItem'];
export type BulkPlayerPredictionItem = components['schemas']['BulkPlayerPredictionItem'];
export type Player = components['schemas']['Player'];

export async function listTeams(tournamentId: string): Promise<TeamWithHandicaps[]> {
  const data = await apiFetch<components['schemas']['TeamListResponse']>(
    `/tournaments/${tournamentId}/teams`,
  );
  return data.teams;
}

export async function listMyTeamPredictions(
  tournamentId: string,
): Promise<TeamPredictionsListResponse> {
  return apiFetch<TeamPredictionsListResponse>(`/tournaments/${tournamentId}/predictions/teams`);
}

export async function listMyPlayerPredictions(
  tournamentId: string,
): Promise<PlayerPredictionsListResponse> {
  return apiFetch<PlayerPredictionsListResponse>(
    `/tournaments/${tournamentId}/predictions/players`,
  );
}

export async function bulkUpsertTeamPredictions(
  tournamentId: string,
  items: BulkTeamPredictionItem[],
): Promise<TeamPredictionView[]> {
  return apiFetch<TeamPredictionView[]>(`/tournaments/${tournamentId}/predictions/teams`, {
    method: 'PUT',
    body: JSON.stringify(items),
  });
}

export async function bulkUpsertPlayerPredictions(
  tournamentId: string,
  items: BulkPlayerPredictionItem[],
): Promise<PlayerPredictionView[]> {
  return apiFetch<PlayerPredictionView[]>(`/tournaments/${tournamentId}/predictions/players`, {
    method: 'PUT',
    body: JSON.stringify(items),
  });
}

export async function searchPlayers(tournamentId: string, q: string, group?: string): Promise<Player[]> {
  const params = new URLSearchParams({ q });
  if (group !== undefined) params.set('group', group);
  const data = await apiFetch<components['schemas']['PlayerListResponse']>(
    `/tournaments/${tournamentId}/players/search?${params.toString()}`,
  );
  return data.players;
}

export async function listHandicapPlayers(tournamentId: string): Promise<Player[]> {
  const data = await apiFetch<components['schemas']['PlayerListResponse']>(
    `/tournaments/${tournamentId}/players/search?hasHandicap=true`,
  );
  return data.players;
}
