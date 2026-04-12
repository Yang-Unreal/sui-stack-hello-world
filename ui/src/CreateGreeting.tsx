import { useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { Box, Heading, Text } from '@radix-ui/themes';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { useNetworkVariable } from './networkConfig';

export function CreateGreeting({
  onCreated,
}: {
  onCreated: (id: string) => void;
}) {
  const helloWorldPackageId = useNetworkVariable('helloWorldPackageId');
  const dAppKit = useDAppKit();

  const { mutate: signAndExecute } = useMutation({
    mutationFn: (tx: Transaction) =>
      dAppKit.signAndExecuteTransaction({ transaction: tx }),
  });

  const [waiting, setWaiting] = useState(false);

  const create = () => {
    setWaiting(true);
    const tx = new Transaction();
    tx.moveCall({
      arguments: [],
      target: `${helloWorldPackageId}::greeting::new`,
    });

    signAndExecute(tx, {
      onSuccess: (result) => {
        const txData = result.Transaction ?? result.FailedTransaction;
        if (txData?.effects) {
          const created = txData.effects.changedObjects.filter(
            (obj) => obj.idOperation === 'Created'
          );
          const objectId = created[0]?.objectId;
          if (objectId) onCreated(objectId);
        }
        setWaiting(false);
      },
      onError: () => setWaiting(false),
    });
  };

  return (
    <Box className="card">
      <div className="card-header">
        <Heading size="5" weight="bold" className="card-title">
          Create Greeting
        </Heading>
        <Text size="2" color="gray" className="card-subtitle">
          Store a message on Sui Testnet
        </Text>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={create}
        disabled={waiting}
      >
        {waiting ? (
          <>
            <span className="spinner"></span>
            Creating...
          </>
        ) : (
          'Create Greeting'
        )}
      </button>

      <div className="divider">
        <span>TESTNET</span>
      </div>
    </Box>
  );
}
