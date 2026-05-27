import { createLeague, deleteLeague, getLeague, getLeagueLeaderboard, joinLeague, leaveLeague, listLeagues } from '@/api/leagues';
import type { components } from '@/types/api';
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';

type LeagueListItem = components['schemas']['LeagueListItem'];
type LeagueDetail = components['schemas']['LeagueDetail'];
type LeaderboardEntry = components['schemas']['LeaderboardEntry'];

export function useLeagues(options?: Pick<UseQueryOptions<LeagueListItem[]>, 'enabled'>) {
  return useQuery({
    queryKey: ['leagues'],
    queryFn: listLeagues,
    ...options,
  });
}

export function useCreateLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLeague,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leagues'] });
    },
  });
}

export function useJoinLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => joinLeague(code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leagues'] });
    },
  });
}

export function useDeleteLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLeague,
    onSuccess: (_data, id) => {
      qc.setQueryData<LeagueListItem[]>(
        ['leagues'],
        (prev) => prev?.filter((l) => l.id !== id) ?? [],
      );
      qc.removeQueries({ queryKey: ['leagues', id] });
    },
  });
}

export function useLeaveLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leagueId, userId }: { leagueId: string; userId: string }) =>
      leaveLeague(leagueId, userId),
    onSuccess: (_data, { leagueId }) => {
      qc.setQueryData<LeagueListItem[]>(
        ['leagues'],
        (prev) => prev?.filter((l) => l.id !== leagueId) ?? [],
      );
      qc.removeQueries({ queryKey: ['leagues', leagueId] });
    },
  });
}

export function useLeagueDetail(id: string) {
  return useQuery({
    queryKey: ['leagues', id],
    queryFn: () => getLeague(id),
  });
}

export function useLeagueLeaderboard(leagueId: string) {
  return useQuery({
    queryKey: ['leagues', leagueId, 'leaderboard'],
    queryFn: () => getLeagueLeaderboard(leagueId),
    enabled: leagueId !== '',
  });
}

export type { LeaderboardEntry, LeagueDetail, LeagueListItem };

