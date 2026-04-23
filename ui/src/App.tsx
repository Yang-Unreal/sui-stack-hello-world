import {
  ConnectButton,
  useCurrentAccount,
  useCurrentClient,
  useDAppKit,
} from '@mysten/dapp-kit-react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Clock,
  FileText,
  Home,
  Loader2,
  Plus,
  Search,
  Settings,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CreateNote } from './CreateNote';
import { NoteCard } from './NoteCard';
import { useNetworkVariable } from './networkConfig';

interface NoteData {
  id: string;
  owner: string;
  title: string;
  content: string;
  icon?: string;
  cover?: string;
}

const NOTE_ICONS = [
  '📝',
  '📋',
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
  '🌍',
  '📖',
  '🧠',
  '💪',
  '🎓',
  '🏆',
  '💰',
  '⚙️',
  '🔧',
  '📊',
];

function Sidebar({
  notes,
  selectedNote,
  onSelectNote,
  onNewPage,
}: {
  notes: NoteData[];
  selectedNote: NoteData | null;
  onSelectNote: (note: NoteData | null) => void;
  onNewPage: () => void;
}) {
  return (
    <aside className="w-64 bg-sidebar/50 backdrop-blur-xl border-r border-border flex flex-col h-full transition-all duration-300">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-lg">📝</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Sui Notes</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <div className="px-3 py-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 mb-1 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent group"
          onClick={() => onSelectNote(null)}
        >
          <Home
            className={cn(
              'w-4 h-4 transition-colors',
              selectedNote === null
                ? 'text-primary'
                : 'group-hover:text-primary'
            )}
          />
          <span
            className={cn(
              'text-sm font-medium',
              selectedNote === null && 'text-foreground'
            )}
          >
            Home
          </span>
        </Button>
      </div>

      <Separator className="mx-4 my-2 opacity-50" />

      <ScrollArea className="flex-1 px-3">
        <div className="py-2">
          <div className="flex items-center justify-between px-3 py-2 mb-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <FileText className="w-3 h-3" />
              <span>Pages</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={onNewPage}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <div className="space-y-0.5">
            {notes.map((note) => (
              <button
                key={note.id}
                type="button"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 w-full group',
                  selectedNote?.id === note.id
                    ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                    : 'hover:bg-sidebar-accent text-muted-foreground hover:text-foreground'
                )}
                onClick={() => onSelectNote(note)}
              >
                <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
                  {note.icon || '📄'}
                </span>
                <span className="truncate flex-1 text-left">
                  {note.title || 'Untitled'}
                </span>
              </button>
            ))}
          </div>

          {notes.length === 0 && (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-muted-foreground italic">
                No pages yet
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

function TopBar({
  note,
  onBack,
  searchQuery,
  onSearchChange,
}: {
  note: NoteData | null;
  onBack?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  const currentAccount = useCurrentAccount();
  const dAppKit = useDAppKit();

  return (
    <header className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div className="flex items-center gap-2 text-sm overflow-hidden">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors bg-transparent border-none p-0 focus-visible:outline-none focus-visible:underline"
            onClick={onBack}
          >
            Sui Notes
          </button>
          {note && (
            <>
              <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
              <span className="font-semibold truncate max-w-[200px] bg-primary/5 px-2 py-0.5 rounded text-primary">
                {note.title || 'Untitled'}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search everything..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9 w-64 bg-muted/50 border-transparent focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all rounded-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full relative"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
          </Button>

          {currentAccount ? (
            <div className="relative">
              <button
                onClick={() => {
                  const el = document.getElementById('wallet-dropdown');
                  if (el)
                    el.style.display =
                      el.style.display === 'none' ? 'block' : 'none';
                }}
                className="gap-3 pl-1 pr-3 py-1 h-9 rounded-full hover:bg-muted transition-all border border-border/50 flex items-center bg-transparent cursor-pointer"
              >
                <Avatar className="w-7 h-7 border border-background shadow-sm pointer-events-none">
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-bold flex items-center justify-center">
                    {currentAccount.address.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start leading-none pointer-events-none">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {currentAccount.address.slice(0, 6)}...
                  </span>
                </div>
              </button>

              <div
                id="wallet-dropdown"
                style={{ display: 'none' }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl bg-popover border border-border/50 p-1.5 z-50"
              >
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Account
                </div>
                <div className="rounded-lg p-2 gap-3 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground">
                      Sui Wallet
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">
                      {currentAccount.address}
                    </span>
                  </div>
                </div>
                <div className="h-px bg-border my-1.5 opacity-50" />
                <button
                  onClick={() => {
                    const el = document.getElementById('wallet-dropdown');
                    if (el) el.style.display = 'none';
                    dAppKit.disconnectWallet();
                  }}
                  className="w-full flex items-center text-destructive focus:bg-destructive/10 hover:bg-destructive/10 focus:text-destructive rounded-lg p-2 cursor-pointer transition-colors bg-transparent border-none text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center mr-3">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Disconnect</span>
                </button>
              </div>
            </div>
          ) : (
            <ConnectButton instance={dAppKit}>
              <Button
                variant="default"
                className="rounded-full px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9"
              >
                Connect Wallet
              </Button>
            </ConnectButton>
          )}
        </div>
      </div>
    </header>
  );
}

function HomeView({
  notes,
  onSelectNote,
  onNewNote,
}: {
  notes: NoteData[];
  onSelectNote: (note: NoteData) => void;
  onNewNote: () => void;
}) {
  return (
    <div className="h-full overflow-auto bg-background/50">
      <div className="max-w-6xl mx-auto px-8 py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative mb-16">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute -top-12 right-0 w-64 h-64 bg-accent-blue/10 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-24 h-24 rounded-[2rem] bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl shadow-primary/30 transform hover:rotate-6 transition-transform duration-500">
              <span className="text-5xl drop-shadow-lg">📝</span>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-extrabold tracking-tight mb-3 bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
                Welcome to Sui Notes
              </h1>
              <p className="text-muted-foreground text-xl max-w-2xl leading-relaxed">
                Experience the future of decentralized knowledge management.
                Your notes, forever secure on the{' '}
                <span className="text-primary font-bold">Sui Blockchain</span>.
              </p>
            </div>
          </div>
        </div>

        {notes.length === 0 ? (
          <Card className="border-dashed bg-muted/20 hover:bg-muted/30 transition-all duration-300 overflow-hidden group">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 rounded-3xl bg-background border border-border shadow-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <Plus className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Your canvas is empty</h3>
              <p className="text-muted-foreground mb-10 text-center max-w-sm leading-relaxed">
                Start building your decentralized brain today. Create your first
                immutable page on Sui.
              </p>
              <Button
                onClick={onNewNote}
                size="lg"
                className="rounded-full px-10 py-6 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all"
              >
                <Plus className="w-6 h-6 mr-2" />
                Create First Page
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            <div className="flex items-center justify-between border-b border-border/50 pb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold tracking-tight">
                  Recent Work
                </h2>
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-0.5 font-bold bg-primary/5 text-primary border-primary/10"
                >
                  {notes.length} Pages
                </Badge>
              </div>
              <Button
                variant="outline"
                onClick={onNewNote}
                className="rounded-full px-6 border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/40 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Page
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {notes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className="relative group rounded-3xl border bg-card/50 backdrop-blur-sm p-6 text-card-foreground shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500 text-left w-full overflow-hidden"
                  onClick={() => onSelectNote(note)}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex flex-col h-full">
                    <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                      {note.icon || '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold truncate mb-2 group-hover:text-primary transition-colors">
                        {note.title || 'Untitled'}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4 opacity-80">
                        {note.content.slice(0, 150) ||
                          'Start writing your story...'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/10">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Modified recently
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const currentAccount = useCurrentAccount();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const dAppKit = useDAppKit();

  const client = useCurrentClient();
  const notePackageId = useNetworkVariable('notePackageId');

  const {
    data: notes = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ['getOwnedNotes', currentAccount?.address, refreshKey],
    queryFn: async () => {
      if (!currentAccount || !client) return [];
      const noteType = `${notePackageId}::greeting::Note`;

      const result = await client.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: noteType },
        options: { showType: true, showContent: true },
        limit: 50,
      });

      const notes: NoteData[] = [];
      const icons = NOTE_ICONS;
      let iconIndex = 0;

      for (const obj of result.data) {
        const content = obj.data?.content;
        if (content?.dataType === 'moveObject') {
          const fields = content.fields as Record<string, unknown>;
          if (fields?.title) {
            notes.push({
              id: obj.data?.objectId ?? '',
              owner: currentAccount.address,
              title: fields.title as string,
              content: (fields.content as string) || '',
              icon: icons[iconIndex % icons.length],
            });
            iconIndex++;
          }
        }
      }
      return notes;
    },
    enabled: !!currentAccount && !!client,
  });

  const filteredNotes = searchQuery
    ? notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;

  const handleNoteCreated = () => {
    setShowCreate(false);
    setRefreshKey((k) => k + 1);
  };

  const handleNoteDeleted = () => {
    setSelectedNote(null);
    setRefreshKey((k) => k + 1);
  };

  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.05),transparent_50%)]"></div>
        <Card className="w-full max-w-md border-none shadow-2xl bg-background/80 backdrop-blur-xl relative z-10 rounded-[2.5rem] overflow-hidden">
          <div className="h-2 bg-linear-to-r from-primary to-accent-blue"></div>
          <CardContent className="flex flex-col items-center justify-center py-20 px-10">
            <div className="w-28 h-28 rounded-[2.5rem] bg-primary flex items-center justify-center text-6xl mb-10 shadow-2xl shadow-primary/40 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              📝
            </div>
            <h1 className="text-4xl font-extrabold mb-4 text-center tracking-tight">
              Sui Notes
            </h1>
            <p className="text-base text-muted-foreground text-center mb-10 max-w-xs leading-relaxed opacity-80">
              Your decentralized brain. Connect your wallet to access your
              private, immutable notes on Sui.
            </p>
            <div className="w-full flex justify-center scale-110">
              <ConnectButton instance={dAppKit}>
                <Button
                  size="lg"
                  className="rounded-full px-10 py-6 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all bg-primary"
                >
                  Connect Wallet
                </Button>
              </ConnectButton>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 animate-pulse"></div>
          <Loader2 className="w-8 h-8 text-primary animate-spin absolute top-4 left-4" />
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
          Syncing with Sui...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/20 bg-destructive/5 rounded-3xl">
          <CardContent className="py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Sync Error</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              We encountered an issue connecting to the Sui blockchain:{' '}
              {error.message}
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="rounded-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Sidebar
        notes={filteredNotes}
        selectedNote={selectedNote}
        onSelectNote={(note) => {
          setSelectedNote(note);
          setShowCreate(false);
        }}
        onNewPage={() => {
          setShowCreate(true);
          setSelectedNote(null);
        }}
      />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <TopBar
          note={selectedNote}
          onBack={
            selectedNote || showCreate
              ? () => {
                  setSelectedNote(null);
                  setShowCreate(false);
                }
              : undefined
          }
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {showCreate ? (
            <CreateNote
              onCreated={handleNoteCreated}
              onCancel={() => setShowCreate(false)}
              icons={NOTE_ICONS}
            />
          ) : selectedNote ? (
            <div className="flex-1 h-full animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col">
              <NoteCard
                note={selectedNote}
                onBack={() => setSelectedNote(null)}
                onDeleted={handleNoteDeleted}
                refreshKey={refreshKey}
                icons={NOTE_ICONS}
              />
            </div>
          ) : (
            <HomeView
              notes={filteredNotes}
              onSelectNote={setSelectedNote}
              onNewNote={() => setShowCreate(true)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
