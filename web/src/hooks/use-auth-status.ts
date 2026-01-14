import * as React from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { authService, type AuthStatusResponse } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

export function useAuthStatus(): UseQueryResult<AuthStatusResponse, Error> {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  const query = useQuery({
    queryKey: ['auth', 'status'],
    queryFn: async () => authService.getStatus(),
    retry: 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  React.useEffect((): void => {
    if (query.data) setAuthenticated(query.data.authenticated);
    if (query.isError) setAuthenticated(false);
  }, [query.data, query.isError, setAuthenticated]);

  return query;
}

