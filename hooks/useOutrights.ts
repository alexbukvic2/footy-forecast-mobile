import {
    bulkUpsertPlayerPredictions,
    bulkUpsertTeamPredictions,
    listHandicapPlayers,
    listMyPlayerPredictions,
    listMyTeamPredictions,
    listTeams,
    searchPlayers,
    type BulkPlayerPredictionItem,
    type BulkTeamPredictionItem,
    type PlayerPredictionsListResponse,
    type TeamPredictionsListResponse,
} from '@/api/outrights';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useLeagues } from './useLeagues';

function useTournamentId(): string | undefined {
  const { data: leagues } = useLeagues();
  return leagues?.[0]?.tournament_id;
}

export function useTeams() {
  const tournamentId = useTournamentId();
  return useQuery({
    queryKey: ['teams', tournamentId],
    queryFn: () => listTeams(tournamentId!),
    enabled: !!tournamentId,
  });
}

export function useTeamPredictions() {
  const tournamentId = useTournamentId();
  return useQuery({
    queryKey: ['teamPredictions', tournamentId],
    queryFn: () => listMyTeamPredictions(tournamentId!),
    enabled: !!tournamentId,
  });
}

export function usePlayerPredictions() {
  const tournamentId = useTournamentId();
  return useQuery({
    queryKey: ['playerPredictions', tournamentId],
    queryFn: () => listMyPlayerPredictions(tournamentId!),
    enabled: !!tournamentId,
  });
}

export function useBulkUpsertTeamPredictions() {
  const tournamentId = useTournamentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: BulkTeamPredictionItem[]) =>
      bulkUpsertTeamPredictions(tournamentId!, items),
    onSuccess: (predictions) => {
      qc.setQueryData<TeamPredictionsListResponse>(
        ['teamPredictions', tournamentId],
        (prev) => ({ locked: prev?.locked ?? false, predictions }),
      );
    },
  });
}

export function useBulkUpsertPlayerPredictions() {
  const tournamentId = useTournamentId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: BulkPlayerPredictionItem[]) =>
      bulkUpsertPlayerPredictions(tournamentId!, items),
    onSuccess: (predictions) => {
      qc.setQueryData<PlayerPredictionsListResponse>(
        ['playerPredictions', tournamentId],
        (prev) => ({ locked: prev?.locked ?? false, predictions }),
      );
    },
  });
}

export function useSearchPlayers(q: string, group?: string) {
  const tournamentId = useTournamentId();
  return useQuery({
    queryKey: ['searchPlayers', tournamentId, q, group],
    queryFn: () => searchPlayers(tournamentId!, q, group),
    enabled: !!tournamentId && q.length >= 2,
  });
}

export function useHandicapPlayers() {
  const tournamentId = useTournamentId();
  return useQuery({
    queryKey: ['handicapPlayers', tournamentId],
    queryFn: () => listHandicapPlayers(tournamentId!),
    enabled: !!tournamentId,
  });
}

export function useOutrightsComplete(): boolean {
  const { data: teams } = useTeams();
  const { data: teamPredsResponse } = useTeamPredictions();
  const { data: playerPredsResponse } = usePlayerPredictions();
  return useMemo(() => {
    if (!teams || !teamPredsResponse || !playerPredsResponse) return false;
    const teamPreds = teamPredsResponse.predictions;
    const playerPreds = playerPredsResponse.predictions;
    const groupCount = new Set(
      teams.flatMap((t) => (t.group_letter ? [t.group_letter] : [])),
    ).size;
    return (
      teamPreds.filter((p) => p.category === 'group_winner' && p.team_id != null).length === groupCount &&
      teamPreds.filter((p) => p.category === 'playoff' && p.team_id != null).length === 20 &&
      playerPreds.filter((p) => p.category === 'group_top_scorer' && p.player_id != null).length === groupCount &&
      teamPreds.filter((p) => p.category === 'semifinalist' && p.team_id != null).length === 4 &&
      playerPreds.some((p) => p.category === 'total_top_scorer' && p.player_id != null) &&
      teamPreds.some((p) => p.category === 'winner' && p.team_id != null)
    );
  }, [teams, teamPredsResponse, playerPredsResponse]);
}
