import { createDAppKit } from '@mysten/dapp-kit-react';
import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

export const dAppKit = createDAppKit({
  networks: ['testnet'],
  createClient(network) {
    return new SuiJsonRpcClient({
      url: getJsonRpcFullnodeUrl(network as 'testnet'),
      network: network as 'testnet',
    });
  },
});

declare module '@mysten/dapp-kit-react' {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
