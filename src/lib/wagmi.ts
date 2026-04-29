import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia, mainnet } from "wagmi/chains";

// Public WalletConnect demo project ID — works out of the box.
// For production, get a free one at https://cloud.reown.com and replace.
const projectId = "3fbb6bba6f1de962d911bb5b5c3dba68";

export const wagmiConfig = getDefaultConfig({
  appName: "BasePerps",
  projectId,
  chains: [base, baseSepolia, mainnet],
  ssr: true,
});
