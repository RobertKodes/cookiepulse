import { useCallback, useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import type { ConfirmedSignatureInfo } from '@solana/web3.js'
import { COOKIE_EXPLORER } from '../config'

function shortSig(sig: string) {
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`
}

export function ActivityPanel({ refreshKey }: { refreshKey: number }) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [rows, setRows] = useState<ConfirmedSignatureInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!publicKey) {
      setRows([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const sigs = await connection.getSignaturesForAddress(publicKey, { limit: 12 })
      setRows(sigs)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [connection, publicKey])

  useEffect(() => {
    void load()
  }, [load, refreshKey])

  if (!publicKey) {
    return (
      <section className="card">
        <h2>Recent activity</h2>
        <p className="muted">Connect Nightly to load `getSignaturesForAddress`.</p>
      </section>
    )
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Recent activity</h2>
        <button type="button" className="btn ghost" onClick={() => void load()} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      {!loading && rows.length === 0 && !error ? (
        <p className="muted">No signatures yet on Cookie Chain for this address.</p>
      ) : null}
      <ul className="activity-list">
        {rows.map((row) => (
          <li key={row.signature}>
            <a
              href={`${COOKIE_EXPLORER}/tx/${row.signature}`}
              target="_blank"
              rel="noreferrer"
              title={row.signature}
            >
              {shortSig(row.signature)}
            </a>
            <span className={`pill ${row.err ? 'pill-err' : 'pill-ok'}`}>
              {row.err ? 'failed' : 'ok'}
            </span>
            <span className="muted mono">
              {row.blockTime
                ? new Date(row.blockTime * 1000).toLocaleString()
                : `slot ${row.slot}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
