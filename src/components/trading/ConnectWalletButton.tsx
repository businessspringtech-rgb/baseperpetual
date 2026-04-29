import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";

export function ConnectWalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;
        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
            })}
            className="flex items-center gap-2"
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
              >
                Connect Wallet
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                className="rounded-md bg-ask px-4 py-1.5 text-xs font-semibold text-background hover:opacity-90"
              >
                Wrong network
              </button>
            ) : (
              <>
                <button
                  onClick={openChainModal}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border border-panel-border bg-panel px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-accent/40",
                  )}
                >
                  {chain.hasIcon && chain.iconUrl && (
                    <img src={chain.iconUrl} alt={chain.name} className="h-3.5 w-3.5 rounded-full" />
                  )}
                  {chain.name}
                </button>
                <button
                  onClick={openAccountModal}
                  className="rounded-md border border-panel-border bg-panel px-3 py-1.5 text-[11px] font-medium hover:bg-accent/40"
                >
                  <span className="tabular text-foreground">{account.displayName}</span>
                  {account.displayBalance && (
                    <span className="ml-2 text-muted-foreground">{account.displayBalance}</span>
                  )}
                </button>
              </>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
