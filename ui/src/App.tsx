import {
  ConnectButton,
  useCurrentAccount,
  useCurrentClient,
  useDAppKit,
} from '@mysten/dapp-kit-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
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

function SidebarIcon({
  emoji,
  className,
}: {
  emoji: string;
  className?: string;
}) {
  return <span className={className}>{emoji}</span>;
}

function Sidebar({
  notes,
  selectedNote,
  onSelectNote,
  onNewPage,
  onToggleSidebar: _onToggleSidebar,
}: {
  notes: NoteData[];
  selectedNote: NoteData | null;
  onSelectNote: (note: NoteData | null) => void;
  onNewPage: () => void;
  onToggleSidebar?: () => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <SidebarIcon emoji="🚀" className="sidebar-title-icon" />
            <span>Workspace</span>
          </div>
        </div>
        <div
          className={`sidebar-item ${selectedNote === null ? 'active' : ''}`}
          onClick={() => onSelectNote(null)}
        >
          <SidebarIcon emoji="🏠" className="sidebar-item-icon" />
          <span className="sidebar-item-text">Home</span>
        </div>
        <div className="sidebar-item">
          <SidebarIcon emoji="🔎" className="sidebar-item-icon" />
          <span className="sidebar-item-text">Search</span>
        </div>
        <div className="sidebar-item">
          <SidebarIcon emoji="🕐" className="sidebar-item-icon" />
          <span className="sidebar-item-text">Recently Updated</span>
        </div>
        <div className="sidebar-item">
          <SidebarIcon emoji="⭐" className="sidebar-item-icon" />
          <span className="sidebar-item-text">Favorites</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <SidebarIcon emoji="📄" className="sidebar-title-icon" />
            <span>Pages</span>
          </div>
          <button
            type="button"
            className="sidebar-add"
            onClick={onNewPage}
            title="New page"
          >
            +
          </button>
        </div>
        <div
          className="scrollbar"
          style={{ maxHeight: '300px', overflowY: 'auto' }}
        >
          {notes.map((note) => (
            <div
              key={note.id}
              className={`sidebar-item ${selectedNote?.id === note.id ? 'active' : ''}`}
              onClick={() => onSelectNote(note)}
            >
              <SidebarIcon
                emoji={note.icon || '📄'}
                className="sidebar-item-icon"
              />
              <span className="sidebar-item-text">
                {note.title || 'Untitled'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <SidebarIcon emoji="🗑️" className="sidebar-title-icon" />
            <span>Trash</span>
          </div>
        </div>
      </div>
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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        {onBack && (
          <button type="button" className="back-btn" onClick={onBack}>
            ← Back
          </button>
        )}
        <div className="topbar-breadcrumb">
          {note ? (
            <>
              <span className="topbar-breadcrumb-item">
                <SidebarIcon emoji="📄" />
                <span>Pages</span>
              </span>
              <span className="topbar-breadcrumb-separator">›</span>
              <span className="topbar-breadcrumb-item">
                {note.title || 'Untitled'}
              </span>
            </>
          ) : (
            <span className="topbar-breadcrumb-item">Home</span>
          )}
        </div>
      </div>
      <div className="topbar-right">
        <div className="search-input">
          <span className="search-input-icon">🔍</span>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {currentAccount ? (
          <div className="wallet-menu" ref={menuRef}>
            <button
              type="button"
              className="wallet-btn"
              onClick={() => setShowMenu(!showMenu)}
            >
              <span className="wallet-dot"></span>
              <span>
                {currentAccount.address.slice(0, 4)}...
                {currentAccount.address.slice(-4)}
              </span>
            </button>
            {showMenu && (
              <div className="wallet-dropdown">
                <button
                  type="button"
                  className="wallet-dropdown-item disconnect"
                  onClick={() => {
                    dAppKit.disconnectWallet();
                    setShowMenu(false);
                  }}
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
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
    <div className="page-content">
      <div className="page-inner">
        <div className="page-icon-wrapper">
          <div
            className="page-icon"
            style={{ background: 'var(--bg-secondary)', fontSize: '40px' }}
          >
            🚀
          </div>
        </div>
        <h1 className="page-title">Welcome to Sui Notes</h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '32px',
            fontSize: '16px',
          }}
        >
          Your notes, stored securely on the Sui blockchain.
        </p>

        <div className="page-blocks">
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-title">No notes yet</div>
            <div className="empty-state-text">
              Create your first note to get started with your personal knowledge
              base.
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onNewNote}
            >
              + New Page
            </button>
          </div>
        </div>

        {notes.length > 0 && (
          <div style={{ marginTop: '48px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '12px',
              }}
            >
              Recent Pages
            </h3>
            <div className="notes-grid">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="note-row"
                  onClick={() => onSelectNote(note)}
                >
                  <div className="note-icon">{note.icon || '📄'}</div>
                  <div className="note-info">
                    <div className="note-title">{note.title || 'Untitled'}</div>
                    <div className="note-preview">
                      {note.content.slice(0, 80) || 'Empty note'}
                    </div>
                  </div>
                </div>
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
      <div className="app">
        <div className="page-content">
          <div className="page-inner">
            <div className="empty-state" style={{ marginTop: '80px' }}>
              <div className="empty-state-icon">🔗</div>
              <div className="empty-state-title">Connect Your Wallet</div>
              <div className="empty-state-text">
                Connect your Sui wallet to start creating and managing your
                notes on the blockchain.
              </div>
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="app">
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="page-content">
          <div className="page-inner">
            <div className="error-message">
              Error loading notes: {error.message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        notes={filteredNotes}
        selectedNote={selectedNote}
        onSelectNote={setSelectedNote}
        onNewPage={() => setShowCreate(true)}
      />
      <main className="main-content">
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
