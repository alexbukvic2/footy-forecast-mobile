import { useQuery, useMutation } from '@tanstack/react-query';
import { useLeagues } from './useLeagues';
import { listFixtures, upsertScorePrediction } from '@/api/fixtures';

export function useFixtures() {
  const { data: leagues } = useLeagues();
  const tournamentId = leagues?.[0]?.tournament_id;

  return useQuery({
    queryKey: ['fixtures', tournamentId],
    queryFn: () => listFixtures(tournamentId!),
    enabled: !!tournamentId,
  });
}

export function useUpsertPrediction() {
  return useMutation({
    mutationFn: ({
      fixtureId,
      goalsHome,
      goalsAway,
    }: {
      fixtureId: string;
      goalsHome: number;
      goalsAway: number;
    }) =>
      upsertScorePrediction(fixtureId, {
        goals_home: goalsHome,
        goals_away: goalsAway,
      }),
  });
}
