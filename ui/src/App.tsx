import {
  ConnectButton,
  useCurrentAccount,
  useCurrentClient,
  useDAppKit,
} from '@mysten/dapp-kit-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Home,
  Search,
  Clock,
  Star,
  FileText,
  Plus,
  Trash2,
  ChevronLeft,
  Wallet,
  ArrowLeft,
} from 'lucide-react';
import { CreateNote } from './CreateNote';
import { NoteCard } from './NoteCard';
import { useNetworkVariable } from './networkConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
    <aside className="w-60 bg-card border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2.5 text-sm font-semibold">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-lg">📝</span>
          </div>
          <span className="text-foreground">Sui Notes</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          <div
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm cursor-pointer transition-all duration-150 ${
              selectedNote === null
                ? 'bg-accent text-accent-foreground font-medium'
                : 'hover:bg-muted text-muted-foreground'
            }`}
            onClick={() => onSelectNote(null)}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>Home</span>
          </div>
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm cursor-pointer hover:bg-muted text-muted-foreground transition-all duration-150">
            <Search className="w-4 h-4 shrink-0" />
            <span>Search</span>
          </div>
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm cursor-pointer hover:bg-muted text-muted-foreground transition-all duration-150">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Recently Updated</span>
          </div>
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm cursor-pointer hover:bg-muted text-muted-foreground transition-all duration-150">
            <Star className="w-4 h-4 shrink-0" />
            <span>Favorites</span>
          </div>
        </div>

        <div className="p-2 border-t border-border mt-2">
          <div className="flex items-center justify-between px-2.5 py-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>Pages</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onNewPage}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-0.5">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm cursor-pointer transition-all duration-150 ${
                  selectedNote?.id === note.id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'hover:bg-muted text-foreground'
                }`}
                onClick={() => onSelectNote(note)}
              >
                <span className="text-base shrink-0">{note.icon || '📄'}</span>
                <span className="truncate">{note.title || 'Untitled'}</span>
              </div>
            ))}
          </div>

          {notes.length === 0 && (
            <div className="px-2.5 py-4 text-xs text-muted-foreground text-center">
              No pages yet
            </div>
          )}
        </div>

        <div className="p-2 border-t border-border mt-2">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm cursor-pointer hover:bg-muted text-muted-foreground transition-all duration-150">
            <Trash2 className="w-4 h-4" />
            <span>Trash</span>
          </div>
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
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        {note ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Pages</span>
            <ChevronLeft className="w-3 h-3 text-muted-foreground -rotate-90" />
            <span className="font-medium truncate max-w-[200px]">{note.title || 'Untitled'}</span>
          </div>
        ) : (
          <span className="font-medium">Home</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-muted border-transparent focus:bg-background cursor-text"
          />
        </div>

        {currentAccount ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="sm" className="gap-2 cursor-pointer hover:bg-muted">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {currentAccount.address.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-mono text-muted-foreground">
                  {currentAccount.address.slice(0, 4)}...
                  {currentAccount.address.slice(-4)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => dAppKit.disconnectWallet()}
                className="text-destructive cursor-pointer"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <ConnectButton />
        )}
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
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <span className="text-4xl">📝</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold mb-1.5">Welcome to Sui Notes</h1>
            <p className="text-muted-foreground text-lg">
              Your notes, stored securely on the Sui blockchain.
            </p>
          </div>
        </div>

        {notes.length === 0 ? (
          <Card className="mt-8 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No notes yet</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Create your first note to get started with your personal
                knowledge base stored on the blockchain.
              </p>
              <Button onClick={onNewNote} size="lg" className="gap-2 cursor-pointer">
                <Plus className="w-5 h-5" />
                New Page
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-muted-foreground">
                Recent Pages
              </h2>
              <Button variant="outline" size="sm" onClick={onNewNote} className="gap-2 cursor-pointer">
                <Plus className="w-4 h-4" />
                New Page
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <Card
                  key={note.id}
                  className="cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200 group"
                  onClick={() => onSelectNote(note)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl group-hover:scale-110 transition-transform duration-200">
                        {note.icon || '📄'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate mb-1.5 text-foreground">
                          {note.title || 'Untitled'}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {note.content.slice(0, 100) || 'Empty note'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
      const icons = [
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
      ];
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
      <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-dashed shadow-elevated">
          <CardContent className="flex flex-col items-center justify-center py-16 px-8">
            <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center text-5xl mb-8 shadow-lg">
              📝
            </div>
            <h1 className="text-3xl font-semibold mb-3 text-center">
              Connect Your Wallet
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs leading-relaxed">
              Connect your Sui wallet to start creating and managing your notes
              securely on the blockchain.
            </p>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-6">
            <div className="text-destructive text-sm">Error: {error.message}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      <Sidebar
        notes={filteredNotes}
        selectedNote={selectedNote}
        onSelectNote={setSelectedNote}
        onNewPage={() => setShowCreate(true)}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          note={selectedNote}
          onBack={selectedNote ? () => setSelectedNote(null) : undefined}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        {showCreate ? (
          <CreateNote
            onCreated={handleNoteCreated}
            onCancel={() => setShowCreate(false)}
            icons={NOTE_ICONS}
          />
        ) : selectedNote ? (
          <NoteCard
            note={selectedNote}
            onBack={() => setSelectedNote(null)}
            onDeleted={handleNoteDeleted}
            refreshKey={refreshKey}
            icons={NOTE_ICONS}
          />
        ) : (
          <HomeView
            notes={filteredNotes}
            onSelectNote={setSelectedNote}
            onNewNote={() => setShowCreate(true)}
          />
        )}
      </main>
    </div>
  );
}

export default App;