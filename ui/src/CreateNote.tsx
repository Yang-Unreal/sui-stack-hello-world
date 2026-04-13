import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { Box, Heading, Text } from '@radix-ui/themes';
import { useMutation } from '@tanstack/react-query';
import { type ChangeEvent, useState } from 'react';

import { useNetworkVariable } from './networkConfig';

export function CreateNote({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const notePackageId = useNetworkVariable('notePackageId');
  const currentAccount = useCurrentAccount();
  const dAppKit = useDAppKit();

  const { mutate: signAndExecute } = useMutation({
    mutationFn: (tx: Transaction) =>
      dAppKit.signAndExecuteTransaction({ transaction: tx }),
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [waiting, setWaiting] = useState(false);

  const create = () => {
    if (!title.trim()) return;
    setWaiting(true);

    const tx = new Transaction();
    const note = tx.moveCall({
      target: `${notePackageId}::greeting::new`,
      arguments: [tx.pure.string(title), tx.pure.string(content)],
    });

    if (currentAccount) {
      tx.transferObjects([note], currentAccount.address);
    }

    signAndExecute(tx, {
      onSuccess: () => {
        setWaiting(false);
        onCreated();
      },
      onError: () => setWaiting(false),
    });
  };

  return (
    <Box className="card">
      <div className="card-header">
        <Heading size="5" weight="bold" className="card-title">
          New Note
        </Heading>
        <Text size="2" color="gray" className="card-subtitle">
          Create a new note on Sui Testnet
        </Text>
      </div>

      <div className="field">
        <Text as="label" size="2" weight="bold" mb="1">
          Title
        </Text>
        <input
          className="input"
          placeholder="Note title..."
          value={title}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setTitle(e.target.value)
          }
        />
      </div>

      <div className="field">
        <Text as="label" size="2" weight="bold" mb="1">
          Content
        </Text>
        <textarea
          className="textarea"
          placeholder="Write your note..."
          value={content}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setContent(e.target.value)
          }
          rows={6}
        />
      </div>

      <div className="button-group">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={waiting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={create}
          disabled={waiting || !title.trim()}
        >
          {waiting ? (
            <>
              <span className="spinner"></span>
              Creating...
            </>
          ) : (
            'Create Note'
          )}
        </button>
      </div>
    </Box>
  );
}
