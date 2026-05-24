import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { components } from '@/types/api';
import { listLeagues, createLeague, joinLeague } from '@/api/leagues';

type League = components['schemas']['League'];

export function useLeagues(options?: Pick<UseQueryOptions<League[]>, 'enabled'>) {
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
