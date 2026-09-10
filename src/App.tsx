import { WalletContextProvider } from './WalletContext'
import { Dashboard } from './components/Dashboard'

export default function App() {
  return (
    <WalletContextProvider>
      <div className="app-shell">
        <Dashboard />
      </div>
    </WalletContextProvider>
  )
}
