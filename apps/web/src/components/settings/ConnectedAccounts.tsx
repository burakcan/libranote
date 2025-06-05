import { Loader2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAccountInfoQuery,
  useAccountsListQuery,
  useLinkAccountMutation,
  useUnlinkAccountMutation,
} from "@/hooks/useAccounts";

const providers: Record<string, { icon: React.ElementType; label: string }> = {
  google: {
    icon: FaGoogle,
    label: "Google",
  },
  github: {
    icon: FaGithub,
    label: "GitHub",
  },
};

function ConnectedAccountItem({
  provider,
  accountId,
  canUnlink,
}: {
  provider: keyof typeof providers;
  accountId?: string;
  canUnlink: boolean;
}) {
  const { data: accountInfo, isLoading } = useAccountInfoQuery(accountId);

  const { mutate: unlinkAccount, isPending: isUnlinking } =
    useUnlinkAccountMutation();

  const {
    mutate: linkAccount,
    isPending: isLinking,
    isSuccess: isRedirectingToLink,
  } = useLinkAccountMutation();

  const Icon = providers[provider].icon;

  const accountIdentifier = useMemo(() => {
    if (isLoading) {
      return <Skeleton className="h-5 w-24" />;
    }

    if (provider === "google") {
      return accountInfo?.data.email;
    }

    if (provider === "github") {
      return accountInfo?.data.login;
    }

    return "Unknown";
  }, [accountInfo, isLoading, provider]);

  const handleUnlink = useCallback(() => {
    if (!accountId) {
      return;
    }

    unlinkAccount(
      { provider, accountId: accountId },
      {
        onSuccess: () => {
          toast.success("Account disconnected successfully");
        },
        onError: () => {
          toast.error("Failed to disconnect account");
        },
      }
    );
  }, [unlinkAccount, provider, accountId]);

  const handleLink = useCallback(() => {
    linkAccount(provider, {
      onError: () => {
        toast.error("Failed to connect account");
      },
    });
  }, [linkAccount, provider]);

  return (
    <div className="flex items-center justify-between p-3 border rounded-md">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <div>
          <p className="font-medium">{providers[provider].label}</p>
          <div className="text-sm text-muted-foreground">
            {accountIdentifier}
          </div>
        </div>
      </div>
      {accountId && (
        <Button
          variant="outline"
          size="sm"
          disabled={!canUnlink || isUnlinking}
          onClick={handleUnlink}
        >
          {isUnlinking ? <Loader2 className="animate-spin" /> : "Disconnect"}
        </Button>
      )}
      {!accountId && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleLink}
          disabled={isLinking || isRedirectingToLink}
        >
          {isLinking || isRedirectingToLink ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Connect"
          )}
        </Button>
      )}
    </div>
  );
}

export function ConnectedAccounts() {
  const { data: accounts } = useAccountsListQuery();
  const accountsByProvider = useMemo(() => {
    return accounts?.reduce(
      (acc, account) => {
        acc[account.provider] = account;
        return acc;
      },
      {} as Record<string, (typeof accounts)[number]>
    );
  }, [accounts]);

  const accountsCount = accounts?.length ?? 0;

  return (
    <div className="space-y-3">
      <ConnectedAccountItem
        provider="github"
        accountId={accountsByProvider?.github?.accountId ?? ""}
        canUnlink={accountsCount > 1}
      />
      <ConnectedAccountItem
        provider="google"
        accountId={accountsByProvider?.google?.accountId ?? ""}
        canUnlink={accountsCount > 1}
      />
    </div>
  );
}
