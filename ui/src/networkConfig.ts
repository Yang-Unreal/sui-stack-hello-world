import { useCurrentNetwork } from '@mysten/dapp-kit-react';
import { TESTNET_HELLO_WORLD_PACKAGE_ID } from './constants.ts';

const networkVariables = {
  testnet: {
    helloWorldPackageId: TESTNET_HELLO_WORLD_PACKAGE_ID,
  },
} as const;

type NetworkVariables =
  (typeof networkVariables)[keyof typeof networkVariables];

export function useNetworkVariable<K extends keyof NetworkVariables>(
  key: K
): NetworkVariables[K] {
  const network = useCurrentNetwork();
  return networkVariables[network][key];
}
