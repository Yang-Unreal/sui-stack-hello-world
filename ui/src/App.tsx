import { ConnectButton, useCurrentAccount, useDAppKit, useWalletConnection } from "@mysten/dapp-kit-react";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { Box, Container } from "@radix-ui/themes";
import { useState, useEffect, useRef } from "react";
import { Greeting } from './Greeting';
import { CreateGreeting } from "./CreateGreeting";

function WalletButton() {
  const currentAccount = useCurrentAccount();
  const dAppKit = useDAppKit();
  const { connect } = useWalletConnection({ dAppKit });
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (currentAccount) {
    return (
      <div className="wallet-menu" ref={menuRef}>
        <button
          className="wallet-btn connected"
          onClick={() => setShowMenu(!showMenu)}
        >
          <span className="wallet-dot"></span>
          {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
          <span className="wallet-arrow">▼</span>
        </button>
        {showMenu && (
          <div className="wallet-dropdown">
            <button
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

  return (
    <ConnectButton />
  );
}

function App() {
  const currentAccount = useCurrentAccount();
  const [greetingId, setGreetingId] = useState<string | null>(() => {
    const hash = window.location.hash.slice(1);
    return isValidSuiObjectId(hash) ? hash : null;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (isValidSuiObjectId(hash)) {
        setGreetingId(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <Box className="app">
      <div className="bg" />
      
      <nav className="navbar">
        <Container size="4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.125rem' }}>Sui Greeting</h1>
            <WalletButton />
          </div>
        </Container>
      </nav>

      <main>
        {currentAccount ? (
          greetingId ? (
            <Greeting id={greetingId} />
          ) : (
            <CreateGreeting
              onCreated={(id) => {
                window.location.hash = id;
                setGreetingId(id);
              }}
            />
          )
        ) : (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Welcome</h2>
              <p className="card-subtitle">Connect your wallet to get started</p>
            </div>
            <div className="wallet-prompt">
              <p>Store a greeting message on the Sui blockchain</p>
              <WalletButton />
            </div>
          </div>
        )}
      </main>
    </Box>
  );
}

export default App;