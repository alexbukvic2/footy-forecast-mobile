import type { components } from '@/types/api';
import { apiFetch } from './client';

type _UserFixtureViewResponse = components['schemas']['UserFixtureViewResponse'];

// The generated type marks `prediction` as non-nullable, but the API returns
// null for fixtures where the user hasn't submitted a prediction yet.
export type UserFixtureViewResponse = Omit<_UserFixtureViewResponse, 'prediction'> & {
  prediction: components['schemas']['ScorePredictionResponse'] | null;
};

export type ScorePredictionResponse = components['schemas']['ScorePredictionResponse'];

export async function listFixtures(tournamentId: string): Promise<UserFixtureViewResponse[]> {
  return apiFetch<UserFixtureViewResponse[]>(`/tournaments/${tournamentId}/fixtures`);
}

export async function upsertScorePrediction(
  fixtureId: string,
  body: components['schemas']['UpsertScorePredictionRequest'],
): Promise<ScorePredictionResponse> {
  return apiFetch<ScorePredictionResponse>(`/predictions/${fixtureId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
