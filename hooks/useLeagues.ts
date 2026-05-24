import { useQuery, useQueries, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { components } from '@/types/api';
import { listLeagues, createLeague, joinLeague, getLeague, deleteLeague } from '@/api/leagues';

type League = components['schemas']['League'];
type LeagueDetail = components['schemas']['LeagueDetail'];

export function useLeagues(options?: Pick<UseQueryOptions<League[]>, 'enabled'>) {
  return useQuery({
    queryKey: ['leagues'],
    queryFn: listLeagues,
    ...options,
  });
}

export function useLeagueDetails(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ['leagues', id] as const,
      queryFn: () => getLeague(id),
      enabled: ids.length > 0,
    })),
  });
}

export function useCreateLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLeague,
    onSuccess: (league) => {
      const prev = qc.getQueryData<League[]>(['leagues']) ?? [];
      qc.setQueryData<League[]>(['leagues'], [...prev, league]);
    },
  });
}

export function useJoinLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => joinLeague(code),
    onSuccess: (league) => {
      const prev = qc.getQueryData<League[]>(['leagues']) ?? [];
      qc.setQueryData<League[]>(['leagues'], [...prev, league]);
    },
  });
}

export function useDeleteLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLeague,
    onSuccess: (_data, id) => {
      qc.setQueryData<League[]>(
        ['leagues'],
        (prev) => prev?.filter((l) => l.id !== id) ?? [],
      );
      qc.removeQueries({ queryKey: ['leagues', id] });
    },
  });
}

export type { LeagueDetail };
