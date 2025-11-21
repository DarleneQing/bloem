import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

/**
 * Generic admin data fetching hook
 * Provides consistent loading, error handling, and data fetching pattern
 * for admin components
 */
export function useAdminData<TData, TStats = Record<string, unknown>>(
  endpoint: string,
  options?: {
    initialData?: TData;
    initialStats?: TStats;
    onSuccess?: (data: TData, stats?: TStats) => void;
    onError?: (error: string) => void;
  }
) {
  const [data, setData] = useState<TData>(options?.initialData ?? ([] as TData));
  const [stats, setStats] = useState<TStats | undefined>(options?.initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      logger.debug(`Fetching data from ${endpoint}`);
      const response = await fetch(endpoint, { signal });
      logger.debug(`Response status: ${response.status}`);

      const result = await response.json();
      logger.debug('Response data:', result);

      if (result.success) {
        logger.debug('Success! Setting data and stats');
        setData(result.data.items || result.data.users || result.data.markets || result.data);
        
        if (result.data.stats) {
          setStats(result.data.stats);
        }

        if (options?.onSuccess) {
          options.onSuccess(
            result.data.items || result.data.users || result.data.markets || result.data,
            result.data.stats
          );
        }
      } else {
        const errorMessage = result.error || 'Failed to fetch data';
        logger.debug(`API returned success: false, error: ${errorMessage}`);
        setError(errorMessage);
        
        if (options?.onError) {
          options.onError(errorMessage);
        }
      }
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        logger.debug('Fetch request was aborted');
        return;
      }

      const errorMessage = 'An error occurred while fetching data';
      logger.error('Data fetch error:', err);
      setError(errorMessage);

      if (options?.onError) {
        options.onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  useEffect(() => {
    // Create AbortController for cleanup
    const abortController = new AbortController();

    fetchData(abortController.signal);

    // Cleanup function to abort fetch on unmount
    return () => {
      abortController.abort();
    };
  }, [fetchData]);

  return {
    data,
    stats,
    loading,
    error,
    refetch: () => fetchData(),
    setData,
    setStats,
    setError,
  };
}
