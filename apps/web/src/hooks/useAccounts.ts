import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { authClient } from "@/lib/authClient";

export const QUERY_KEYS = {
  accounts: () => ["accounts"],
  accountInfo: (accountId: string) => ["accountInfo", accountId],
};

export function useAccountsListQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.accounts(),
    queryFn: async () => {
      const response = await authClient.listAccounts();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAccountInfoQuery(accountId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.accountInfo(accountId!),
    queryFn: async () => {
      const response = await authClient.accountInfo({ accountId: accountId! });
      return response.data;
    },
    enabled: !!accountId,
  });
}

export function useUnlinkAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      provider,
      accountId,
    }: {
      provider: string;
      accountId: string;
    }) => {
      await authClient.unlinkAccount({
        providerId: provider,
        accountId,
      });
    },
    onSuccess: (_, { accountId }) => {
      invalidateAccountsListQuery(queryClient);
      invalidateAccountInfoQuery(queryClient, accountId);
    },
  });
}

export function useLinkAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: string) => {
      await authClient.linkSocial({
        provider,
        callbackURL: `${import.meta.env.VITE_PUBLIC_URL}/notes?social_callback=true`,
      });
    },
    onSuccess: (_, provider) => {
      invalidateAccountsListQuery(queryClient);
      invalidateAccountInfoQuery(queryClient, provider);
    },
  });
}

export function invalidateAccountInfoQuery(
  queryClient: QueryClient,
  accountId: string
) {
  queryClient.invalidateQueries({
    queryKey: QUERY_KEYS.accountInfo(accountId),
  });
}

export function invalidateAccountsListQuery(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts() });
}
