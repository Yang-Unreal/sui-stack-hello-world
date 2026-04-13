import {
  ConnectButton,
  useCurrentAccount,
  useCurrentClient,
  useDAppKit,
} from '@mysten/dapp-kit-react';
import { Box, Container, Heading, Text } from '@radix-ui/themes';
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
  created_at: number;
  updated_at: number;
}

function WalletButton() {
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

  if (currentAccount) {
    return (
      <div className="wallet-menu" ref={menuRef}>
        <button
          type="button"
          className="wallet-btn connected"
          onClick={() => setShowMenu(!showMenu)}
        >
          <span className="wallet-dot"></span>
          {currentAccount.address.slice(0, 6)}...
          {currentAccount.address.slice(-4)}
          <span className="wallet-arrow">▼</span>
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
    );
  }

  return <ConnectButton />;
}

function App() {
  const currentAccount = useCurrentAccount();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNoteCreated = () => {
    setShowCreate(false);
    setRefreshKey((k) => k + 1);
  };

  const handleNoteDeleted = () => {
    setSelectedNote(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <Box className="app">
      <div className="bg" />

      <nav className="navbar">
        <Container size="4">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h1 style={{ fontSize: '1.125rem' }}>Sui Notes</h1>
            <WalletButton />
          </div>
        </Container>
      </nav>

      <main>
        {currentAccount ? (
          showCreate ? (
            <CreateNote
              onCreated={handleNoteCreated}
              onCancel={() => setShowCreate(false)}
            />
          ) : selectedNote ? (
            <NoteCard
              note={selectedNote}
              onBack={() => setSelectedNote(null)}
              onDeleted={handleNoteDeleted}
              refreshKey={refreshKey}
            />
          ) : (
            <div className="notes-grid">
              <button
                type="button"
                className="note-card add-note"
                onClick={() => setShowCreate(true)}
              >
                <span className="add-icon">+</span>
                <span>New Note</span>
              </button>
              <NoteList
                address={currentAccount.address}
                refreshKey={refreshKey}
                onSelect={setSelectedNote}
              />
            </div>
          )
        ) : (
          <div className="card">
            <div className="card-header">
              <Heading size="5" weight="bold" className="card-title">
                Sui Notes
              </Heading>
              <Text size="2" color="gray" className="card-subtitle">
                Your private notes on the blockchain
              </Text>
            </div>
            <div className="wallet-prompt">
              <p>Store your notes securely on Sui Testnet</p>
              <WalletButton />
            </div>
          </div>
        )}
      </main>
    </Box>
  );
}

function NoteList({
  address,
  refreshKey,
  onSelect,
}: {
  address: string;
  refreshKey: number;
  onSelect: (note: NoteData) => void;
}) {
  const client = useCurrentClient();
  const notePackageId = useNetworkVariable('notePackageId');
  const {
    data: notes,
    isPending,
    error,
  } = useQuery({
    queryKey: ['getOwnedNotes', address, refreshKey],
    queryFn: async () => {
      const noteType = `${notePackageId}::greeting::Note`;

      const result = await client.getOwnedObjects({
        owner: address,
        filter: { StructType: noteType },
        options: { showType: true, showContent: true },
        limit: 50,
      });
      console.log('SDK result:', result);

      const notes: NoteData[] = [];
      for (const obj of result.data) {
        const content = obj.data?.content;
        if (content?.dataType === 'moveObject') {
          const fields = content.fields as Record<string, unknown>;
          if (fields?.title) {
            notes.push({
              id: obj.data?.objectId ?? '',
              owner: address,
              title: fields.title as string,
              content: (fields.content as string) || '',
              created_at: 0,
              updated_at: 0,
            });
          }
        }
      }
      console.log('Notes:', notes);
      return notes;
    },
  });

  if (isPending) {
    return (
      <div className="notes-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="error-text">Error: {error.message}</div>;
  }

  if (!notes || notes.length === 0) {
    return null;
  }

  return (
    <>
      {notes.map((note) => (
        <button
          key={note.id}
          type="button"
          className="note-card"
          onClick={() => onSelect(note)}
        >
          <div className="note-title">{note.title}</div>
          <div className="note-preview">
            {note.content.slice(0, 100) || 'Empty note'}
          </div>
          <div className="note-date">
            {new Date(note.updated_at || Date.now()).toLocaleDateString()}
          </div>
        </button>
      ))}
    </>
  );
}

export default App;
