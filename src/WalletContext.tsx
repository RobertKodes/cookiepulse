import { useMemo, type ReactNode } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { NightlyWalletAdapter } from '@solana/wallet-adapter-nightly'
import { COOKIE_RPC } from './config'

import '@solana/wallet-adapter-react-ui/styles.css'

type Props = { children: ReactNode }

export function WalletContextProvider({ children }: Props) {
  const endpoint = useMemo(() => COOKIE_RPC, [])
  // Explicit Nightly adapter (bounty requirement). Wallet Standard wallets
  // (including Nightly when injected) are also auto-discovered by the provider.
  const wallets = useMemo(() => [new NightlyWalletAdapter()], [])

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
