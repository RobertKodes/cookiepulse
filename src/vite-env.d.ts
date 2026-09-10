/// <reference types="vite/client" />

interface NightlySolana {
  changeNetwork?: (network: { genesisHash: string; url?: string }) => Promise<void>
  genesisHash?: string
}

interface NightlyWindow {
  solana?: NightlySolana
}

interface Window {
  nightly?: NightlyWindow
}
