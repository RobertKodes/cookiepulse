import { Buffer } from 'buffer'
import { useCallback, useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import {
  COOKIE_EXPLORER,
  COOKIE_GENESIS_HASH,
  COOKIE_RPC,
  MEMO_PROGRAM_ID,
  NATIVE_DECIMALS,
  NATIVE_SYMBOL,
} from '../config'
import { ActivityPanel } from './ActivityPanel'
import { ToastStack, type ToastItem } from './Toast'

function shorten(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

export function Dashboard() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction, connected, wallet } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [balError, setBalError] = useState<string | null>(null)
  const [balLoading, setBalLoading] = useState(false)
  const [txBusy, setTxBusy] = useState(false)
  const [lastSig, setLastSig] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [slot, setSlot] = useState<number | null>(null)

  const pushToast = useCallback((kind: ToastItem['kind'], title: string, detail?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((prev) => [...prev, { id, kind, title, detail }])
    return id
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const refreshBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null)
      setBalError(null)
      return
    }
    setBalLoading(true)
    setBalError(null)
    try {
      const lamports = await connection.getBalance(publicKey, 'confirmed')
      setBalance(lamports / 10 ** NATIVE_DECIMALS)
    } catch (e) {
      setBalError(e instanceof Error ? e.message : String(e))
      setBalance(null)
    } finally {
      setBalLoading(false)
    }
  }, [connection, publicKey])

  useEffect(() => {
    void refreshBalance()
  }, [refreshBalance, refreshKey])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const s = await connection.getSlot('confirmed')
        if (!cancelled) setSlot(s)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [connection, refreshKey])

  const ensureCookieNetwork = useCallback(async () => {
    const nightly = window.nightly?.solana
    if (!nightly?.changeNetwork) return
    try {
      await nightly.changeNetwork({
        genesisHash: COOKIE_GENESIS_HASH,
        url: COOKIE_RPC,
      })
    } catch {
      // User may dismiss the Nightly network switch prompt; continue anyway.
    }
  }, [])

  const sendPulseTx = useCallback(async () => {
    if (!publicKey || !sendTransaction) {
      pushToast('error', 'Wallet not connected', 'Connect Nightly first.')
      return
    }
    setTxBusy(true)
    const pendingId = pushToast('pending', 'Sending pulse tx…', 'Approve in Nightly')
    try {
      await ensureCookieNetwork()

      const memoProgram = new PublicKey(MEMO_PROGRAM_ID)
      const memo = new TextEncoder().encode(
        `CookiePulse:${new Date().toISOString()}:${publicKey.toBase58().slice(0, 8)}`,
      )
      const memoIx = new TransactionInstruction({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
        programId: memoProgram,
        data: Buffer.from(memo),
      })

      // Tiny self-transfer (1 lamport) so the tx always mutates account state.
      const transferIx = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: publicKey,
        lamports: 1,
      })

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
      const tx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(memoIx, transferIx)

      const signature = await sendTransaction(tx, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      dismissToast(pendingId)
      pushToast('info', 'Submitted', shorten(signature))

      const conf = await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed',
      )

      if (conf.value.err) {
        pushToast('error', 'On-chain error', JSON.stringify(conf.value.err))
      } else {
        pushToast('success', 'Confirmed on Cookie Chain', signature)
        setLastSig(signature)
        setRefreshKey((k) => k + 1)
      }
    } catch (e) {
      dismissToast(pendingId)
      const msg = e instanceof Error ? e.message : String(e)
      pushToast('error', 'Transaction failed', msg)
    } finally {
      setTxBusy(false)
    }
  }, [
    publicKey,
    sendTransaction,
    connection,
    pushToast,
    dismissToast,
    ensureCookieNetwork,
  ])

  const walletName = wallet?.adapter.name ?? '—'

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            🍪
          </span>
          <div>
            <h1>CookiePulse</h1>
            <p className="tagline">Cookie Chain cApp — Nightly + on-chain pulse</p>
          </div>
        </div>
        <WalletMultiButton />
      </header>

      <main className="layout">
        <section className="card hero">
          <h2>Network</h2>
          <dl className="meta-grid">
            <div>
              <dt>RPC</dt>
              <dd className="mono">{COOKIE_RPC}</dd>
            </div>
            <div>
              <dt>Genesis</dt>
              <dd className="mono">{shorten(COOKIE_GENESIS_HASH)}</dd>
            </div>
            <div>
              <dt>Slot</dt>
              <dd className="mono">{slot ?? '…'}</dd>
            </div>
            <div>
              <dt>Wallet</dt>
              <dd>{connected ? walletName : 'Not connected'}</dd>
            </div>
          </dl>
          <p className="hint">
            Install{' '}
            <a href="https://nightly.app" target="_blank" rel="noreferrer">
              Nightly
            </a>
            , add Cookie Chain RPC <code>{COOKIE_RPC}</code>, then connect. Use the connect
            button (Nightly is listed first / auto-detected via Wallet Standard).
          </p>
        </section>

        <section className="card">
          <h2>Wallet</h2>
          {!connected || !publicKey ? (
            <p className="muted">Connect with Nightly to show your address and balance.</p>
          ) : (
            <>
              <dl className="meta-grid">
                <div>
                  <dt>Address</dt>
                  <dd className="mono break">
                    <a
                      href={`${COOKIE_EXPLORER}/account/${publicKey.toBase58()}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {publicKey.toBase58()}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Balance</dt>
                  <dd>
                    {balLoading
                      ? 'Loading…'
                      : balError
                        ? `Error: ${balError}`
                        : balance === null
                          ? '—'
                          : `${balance.toLocaleString(undefined, { maximumFractionDigits: 9 })} ${NATIVE_SYMBOL}`}
                    <button
                      type="button"
                      className="btn ghost tiny"
                      onClick={() => void refreshBalance()}
                      disabled={balLoading}
                    >
                      Refresh
                    </button>
                  </dd>
                </div>
              </dl>
              {balance !== null && balance * LAMPORTS_PER_SOL < 5000 ? (
                <p className="warn">
                  Low balance — you need a tiny amount of native {NATIVE_SYMBOL} for fees.
                </p>
              ) : null}
            </>
          )}

          <div className="actions">
            <button
              type="button"
              className="btn primary"
              disabled={!connected || txBusy}
              onClick={() => void sendPulseTx()}
            >
              {txBusy ? 'Confirming…' : 'Send memo / self-check tx'}
            </button>
          </div>
          {lastSig ? (
            <p className="muted">
              Last tx:{' '}
              <a href={`${COOKIE_EXPLORER}/tx/${lastSig}`} target="_blank" rel="noreferrer">
                {shorten(lastSig)}
              </a>
            </p>
          ) : null}
        </section>

        <ActivityPanel refreshKey={refreshKey} />
      </main>

      <footer className="footer">
        <span>
          Open source · Cookie Chain SVM ·{' '}
          <a href="https://docs.cookiechain.wtf" target="_blank" rel="noreferrer">
            docs
          </a>{' '}
          ·{' '}
          <a href="https://cookiescan.io" target="_blank" rel="noreferrer">
            cookiescan
          </a>
        </span>
      </footer>
    </>
  )
}
