import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Plus, Smile, X } from 'lucide-react';
import { type ChangeEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useNetworkVariable } from './networkConfig';

export function CreateNote({
  onCreated,
  onCancel,
  icons = [
    '📄',
    '📝',
    '💡',
    '🎯',
    '🚀',
    '📚',
    '💼',
    '🎨',
    '🎵',
    '🏠',
    '❤️',
    '⚡',
    '🌟',
    '💎',
    '🔒',
    '🌈',
    '🍀',
    '🔥',
    '✨',
    '🎮',
  ],
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
    <div className="h-full overflow-auto bg-background animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              type="button"
              className="hover:text-foreground cursor-pointer transition-colors bg-transparent border-none p-0 focus-visible:outline-none focus-visible:underline"
              onClick={onCancel}
            >
              Pages
            </button>
            <span>/</span>
            <span className="font-medium text-foreground">New Page</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-8">
          <div className="group relative flex items-center gap-4">
            <Popover>
              <PopoverTrigger
                className={cn(
                  'w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-4xl shadow-sm transition-all duration-200 hover:bg-muted/80 hover:scale-105 active:scale-95 group/icon',
                  'border-2 border-transparent hover:border-primary/20 relative'
                )}
                title="Click to change icon"
              >
                {selectedIcon}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition-opacity">
                  <Smile className="w-3.5 h-3.5" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="start">
                <div className="grid grid-cols-5 gap-2">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all duration-200',
                        selectedIcon === icon
                          ? 'bg-primary/10 scale-110'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => {
                        setSelectedIcon(icon);
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex-1">
              <h2 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                Title
              </h2>
              <Input
                placeholder="Untitled"
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                className="text-4xl font-bold h-auto py-0 border-none shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:opacity-30"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <span>Content</span>
            </div>
            <Textarea
              placeholder="Start writing or use '/' for commands..."
              value={content}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setContent(e.target.value)
              }
              className="text-lg leading-relaxed min-h-[400px] border-none shadow-none focus-visible:ring-0 px-0 bg-transparent resize-none placeholder:opacity-30"
            />
          </div>

          <div className="fixed bottom-8 right-8 flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={waiting}
              className="rounded-full px-6 shadow-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={create}
              disabled={waiting || !title.trim()}
              className="rounded-full px-8 shadow-md hover:shadow-lg transition-all duration-200"
            >
              {waiting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Page
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
