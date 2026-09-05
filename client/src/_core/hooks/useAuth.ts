import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAuth as useClerkAuth } from "@clerk/react";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const clerk = useClerkAuth();
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: clerk.isLoaded && clerk.isSignedIn,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    await clerk.signOut({ redirectUrl: "/" });
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
  }, [clerk, utils]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      loading: !clerk.isLoaded || Boolean(clerk.isSignedIn && meQuery.isLoading),
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(clerk.isSignedIn && meQuery.data),
    };
  }, [
    clerk.isLoaded,
    clerk.isSignedIn,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (!clerk.isLoaded || meQuery.isLoading) return;
    if (clerk.isSignedIn && state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === "/sign-in") return;

    window.location.href = getLoginUrl(redirectPath);
  }, [
    clerk.isLoaded,
    clerk.isSignedIn,
    redirectOnUnauthenticated,
    redirectPath,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
    getToken: clerk.getToken,
  };
}
