import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { type ChangeEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>New Page</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <button
                type="button"
                className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-3xl hover:bg-muted/80 transition-colors"
                onClick={() => setShowIconPicker(!showIconPicker)}
                title="Click to change icon"
              >
                {selectedIcon}
              </button>

              {showIconPicker && (
                <div className="grid grid-cols-8 gap-2 p-3 bg-muted rounded-lg">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`w-10 h-10 rounded-md flex items-center justify-center text-xl transition-colors ${
                        selectedIcon === icon
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted-foreground/20'
                      }`}
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

              <Input
                placeholder="Untitled"
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                className="text-2xl font-semibold h-auto py-2"
              />

              <Textarea
                placeholder="Write something..."
                value={content}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setContent(e.target.value)
                }
                rows={8}
              />

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onCancel} disabled={waiting}>
                  Cancel
                </Button>
                <Button onClick={create} disabled={waiting || !title.trim()}>
                  {waiting ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
