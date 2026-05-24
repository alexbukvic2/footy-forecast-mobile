import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { components } from '@/types/api';
import { listLeagues, createLeague, joinLeague, getLeague, deleteLeague, leaveLeague } from '@/api/leagues';

type LeagueListItem = components['schemas']['LeagueListItem'];
type LeagueDetail = components['schemas']['LeagueDetail'];

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

export type { LeagueListItem, LeagueDetail };
