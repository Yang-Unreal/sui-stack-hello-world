import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { useMutation } from '@tanstack/react-query';
import { type ChangeEvent, useState } from 'react';

import { useNetworkVariable } from './networkConfig';

export function CreateNote({
  onCreated,
  onCancel,
  icons = ['📄', '📝', '💡', '🎯', '🚀', '📚', '💼'],
}: {
  onCreated: () => void;
  onCancel: () => void;
  icons?: string[];
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
  const [selectedIcon, setSelectedIcon] = useState(icons[0]);
  const [showIconPicker, setShowIconPicker] = useState(false);
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
    <div className="page-content">
      <div className="page-inner">
        <div className="modal" style={{ maxWidth: '600px' }}>
          <div className="modal-header">
            <h2 className="modal-title">New Page</h2>
            <button type="button" className="modal-close" onClick={onCancel}>
              ×
            </button>
          </div>

          <div className="modal-content">
            <div
              className="page-icon"
              style={{
                width: '64px',
                height: '64px',
                fontSize: '40px',
                marginBottom: '24px',
                cursor: 'pointer',
                background: 'var(--bg-secondary)',
              }}
              onClick={() => setShowIconPicker(!showIconPicker)}
              title="Click to change icon"
            >
              {selectedIcon}
            </div>

            {showIconPicker && (
              <div className="icon-picker" style={{ marginBottom: '24px' }}>
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`icon-option ${selectedIcon === icon ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedIcon(icon);
                      setShowIconPicker(false);
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}

            <div className="form-group">
              <input
                className="page-title"
                style={{ fontSize: '32px' }}
                placeholder="Untitled"
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <textarea
                className="textarea"
                placeholder="Write something..."
                value={content}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setContent(e.target.value)
                }
                rows={8}
              />
            </div>
          </div>

          <div className="modal-actions">
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
                'Create'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
