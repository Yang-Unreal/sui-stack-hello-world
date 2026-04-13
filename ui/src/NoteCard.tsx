import { useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { Box, Flex, Text } from '@radix-ui/themes';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ChangeEvent, useState } from 'react';
import { useNetworkVariable } from './networkConfig';

interface NoteData {
  id: string;
  owner: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
}

export function NoteCard({
  note,
  onBack,
  onDeleted,
  refreshKey,
}: {
  note: NoteData;
  onBack: () => void;
  onDeleted: () => void;
  refreshKey: number;
}) {
  const notePackageId = useNetworkVariable('notePackageId');
  const client = useCurrentClient();
  const dAppKit = useDAppKit();
  const queryClient = useQueryClient();

  const { mutate: signAndExecute } = useMutation({
    mutationFn: (tx: Transaction) =>
      dAppKit.signAndExecuteTransaction({ transaction: tx }),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);
  const [waiting, setWaiting] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ['getNote', note.id, refreshKey],
    queryFn: () =>
      client.getObject({
        id: note.id,
        options: { showContent: true },
      }),
  });

  const updateNote = () => {
    if (!editTitle.trim()) return;
    setWaiting(true);

    const tx = new Transaction();
    tx.moveCall({
      target: `${notePackageId}::greeting::update_content`,
      arguments: [
        tx.object(note.id),
        tx.pure.string(editTitle),
        tx.pure.string(editContent),
      ],
    });

    signAndExecute(tx, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getNote', note.id] });
        setWaiting(false);
        setIsEditing(false);
      },
      onError: () => setWaiting(false),
    });
  };

  const deleteNote = () => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    setWaiting(true);

    const tx = new Transaction();
    tx.moveCall({
      target: `${notePackageId}::greeting::delete`,
      arguments: [tx.object(note.id)],
    });

    signAndExecute(tx, {
      onSuccess: () => {
        setWaiting(false);
        onDeleted();
      },
      onError: () => setWaiting(false),
    });
  };

  if (isPending) {
    return (
      <Box className="card">
        <Flex align="center" justify="center" style={{ padding: '3rem 0' }}>
          <div className="spinner"></div>
        </Flex>
      </Box>
    );
  }

  const content = data?.data?.content;
  const noteData = (content?.dataType === 'moveObject' ? content.fields : null) as {
    title: string;
    content: string;
  } | null;
  const displayTitle = noteData?.title || editTitle;
  const displayContent = noteData?.content || editContent;

  return (
    <Box className="card">
      <button type="button" className="back-btn" onClick={onBack}>
        ← Back
      </button>

      <div className="success-badge">
        <span className="network-dot"></span>
        ON-CHAIN
      </div>

      {isEditing ? (
        <>
          <div className="field">
            <Text as="label" size="2" weight="bold" mb="1">
              Title
            </Text>
            <input
              className="input"
              value={editTitle}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEditTitle(e.target.value)
              }
            />
          </div>

          <div className="field">
            <Text as="label" size="2" weight="bold" mb="1">
              Content
            </Text>
            <textarea
              className="textarea"
              value={editContent}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setEditContent(e.target.value)
              }
              rows={8}
            />
          </div>

          <div className="button-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsEditing(false);
                setEditTitle(note.title);
                setEditContent(note.content);
              }}
              disabled={waiting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={updateNote}
              disabled={waiting || !editTitle.trim()}
            >
              {waiting ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="field">
            <span className="field-label">Title</span>
            <h2 className="note-title-display">{displayTitle}</h2>
          </div>

          <div className="field">
            <span className="field-label">Content</span>
            <p className="note-content">{displayContent || '(empty)'}</p>
          </div>

          <div className="field">
            <span className="field-label">Object ID</span>
            <p className="object-id">{note.id}</p>
          </div>

          <div className="button-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={deleteNote}
              disabled={waiting}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </Box>
  );
}
