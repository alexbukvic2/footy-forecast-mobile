import { useQuery } from '@tanstack/react-query';
import { listTournaments } from '@/api/tournaments';

export function useTournaments() {
  return useQuery({
    queryKey: ['tournaments'],
    queryFn: listTournaments,
  });
}
