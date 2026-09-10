import { useEffect } from 'react'

export type ToastKind = 'info' | 'success' | 'error' | 'pending'

export type ToastItem = {
  id: string
  kind: ToastKind
  title: string
  detail?: string
}

type Props = {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function ToastStack({ toasts, onDismiss }: Props) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: string) => void
}) {
  useEffect(() => {
    if (toast.kind === 'pending') return
    const timer = window.setTimeout(() => onDismiss(toast.id), 6500)
    return () => window.clearTimeout(timer)
  }, [toast, onDismiss])

  return (
    <div className={`toast toast-${toast.kind}`} role="status">
      <div className="toast-body">
        <strong>{toast.title}</strong>
        {toast.detail ? <p>{toast.detail}</p> : null}
      </div>
      <button type="button" className="toast-x" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
