import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { customersApi, plansApi, subscriptionsApi, billingApi, CustomerResponse, PlanResponse, SubscriptionResponse, MandateResponse, PageResponse } from '@/lib/api';

// Generic hook for paginated data (flat routes - no businessId needed, backend uses JWT)
export function usePaginatedData<T>(
  fetchFn: (page: number, size: number) => Promise<PageResponse<T>>,
  pageSize = 20
) {
  const { business } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);

  // Use ref to avoid fetchFn causing infinite re-renders
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetch = useCallback(async (pageNum = 0) => {
    if (!business?.businessId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchFnRef.current(pageNum, pageSize);
      setData(response.content);
      setPage(response.number ?? pageNum);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [business?.businessId, pageSize]);

  // Only fetch once when businessId becomes available
  useEffect(() => {
    if (business?.businessId && !hasFetched) {
      setHasFetched(true);
      fetch(0);
    }
  }, [business?.businessId, hasFetched, fetch]);

  const refetch = useCallback(() => fetch(page), [fetch, page]);
  const goToPage = useCallback((newPage: number) => fetch(newPage), [fetch]);

  return {
    data,
    isLoading,
    error,
    page,
    totalPages,
    totalElements,
    refetch,
    goToPage,
    setData,
  };
}

// Hook for customers
export function useCustomers(pageSize = 20) {
  return usePaginatedData<CustomerResponse>(
    (page, size) => customersApi.findAll(page, size),
    pageSize
  );
}

// Hook for plans
export function usePlans(pageSize = 20) {
  return usePaginatedData<PlanResponse>(
    (page, size) => plansApi.findAll(page, size),
    pageSize
  );
}

// Hook for subscriptions
export function useSubscriptions(pageSize = 20) {
  return usePaginatedData<SubscriptionResponse>(
    (page, size) => subscriptionsApi.findAll(page, size),
    pageSize
  );
}

// Hook for mandates
export function useMandates(pageSize = 20) {
  return usePaginatedData<MandateResponse>(
    (page, size) => billingApi.listMandates(page, size),
    pageSize
  );
}

// Hook for dashboard metrics (computed from real data)
export function useDashboardMetrics() {
  const { business } = useAuth();
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    totalPlans: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!business?.businessId) return;

      try {
        const [customersRes, subscriptionsRes, plansRes] = await Promise.all([
          customersApi.findAll(0, 1),
          subscriptionsApi.findAll(0, 100),
          plansApi.findAll(0, 100),
        ]);

        const activeSubscriptions = subscriptionsRes.content.filter(
          (s) => s.subscriptionStatus === 'ACTIVE' || s.subscriptionStatus === 'TRIALING'
        );

        // Build plan lookup for amount/interval
        const planMap = new Map(plansRes.content.map(p => [p.planId, p]));

        const monthlyRevenue = activeSubscriptions.reduce((sum, s) => {
          const plan = planMap.get(s.subscriptionPlanId || '');
          const amount = parseFloat(plan?.planAmount || '0');
          let monthlyAmount = amount;
          switch (plan?.planBillingInterval) {
            case 'DAILY':
              monthlyAmount = amount * 30;
              break;
            case 'WEEKLY':
              monthlyAmount = amount * 4;
              break;
            case 'QUARTERLY':
              monthlyAmount = amount / 3;
              break;
            case 'YEARLY':
              monthlyAmount = amount / 12;
              break;
          }
          return sum + monthlyAmount;
        }, 0);

        setMetrics({
          totalCustomers: customersRes.totalElements,
          activeSubscriptions: activeSubscriptions.length,
          monthlyRevenue,
          totalPlans: plansRes.totalElements,
        });
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [business?.businessId]);

  return { metrics, isLoading };
}
