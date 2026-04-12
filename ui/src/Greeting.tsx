import { useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { Box, Flex } from '@radix-ui/themes';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNetworkVariable } from './networkConfig';

export function Greeting({ id }: { id: string }) {
  const helloWorldPackageId = useNetworkVariable('helloWorldPackageId');
  const client = useCurrentClient();
  const dAppKit = useDAppKit();
  const queryClient = useQueryClient();

  const { mutate: signAndExecute } = useMutation({
    mutationFn: (tx: Transaction) =>
      dAppKit.signAndExecuteTransaction({ transaction: tx }),
  });

  const { data, isPending, error } = useQuery({
    queryKey: ['getObject', id],
    queryFn: () =>
      client.core.getObject({ objectId: id, include: { json: true } }),
  });

  const [newText, setNewText] = useState('');
  const [waiting, setWaiting] = useState(false);

  const update = () => {
    if (!newText) return;
    setWaiting(true);

    const tx = new Transaction();
    tx.moveCall({
      target: `${helloWorldPackageId}::greeting::update_text`,
      arguments: [tx.object(id), tx.pure.string(newText)],
    });

    signAndExecute(tx, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getObject', id] });
        setWaiting(false);
        setNewText('');
      },
      onError: () => setWaiting(false),
    });
  };

  if (isPending)
    return (
      <Box className="card">
        <Flex align="center" justify="center" style={{ padding: '3rem 0' }}>
          <div className="spinner"></div>
        </Flex>
      </Box>
    );

  if (error)
    return (
      <Box className="card">
        <p className="error-text">Error: {error.message}</p>
      </Box>
    );
  if (!data)
    return (
      <Box className="card">
        <p className="error-text">Not found</p>
      </Box>
    );

  const fields = data.object.json as { text: string } | null;

  return (
    <Box className="card">
      <div className="success-badge">
        <span className="network-dot"></span>
        ON-CHAIN
      </div>

      <div className="field">
        <span className="field-label">Message</span>
        <p className="greeting-text">{fields?.text || '(empty)'}</p>
      </div>

      <div className="field">
        <span className="field-label">Object ID</span>
        <p className="object-id">{id}</p>
      </div>

      <div className="field">
        <span className="field-label">Update Message</span>
        <input
          className="input"
          placeholder="Enter new message..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          disabled={waiting}
        />
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: '0.75rem' }}
          onClick={update}
          disabled={waiting || !newText}
        >
          {waiting ? (
            <>
              <span className="spinner"></span>
              Updating...
            </>
          ) : (
            'Update'
          )}
        </button>
      </div>
    </Box>
  );
}
