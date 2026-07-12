// ============================================================================
// トースト通知 — 一定時間で自動的に消える
// ============================================================================
import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export function Toast() {
  const toast = useGameStore((s) => s.toast);
  const clearToast = useGameStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 2400);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.kind}`} key={toast.id}>
      {toast.msg}
    </div>
  );
}
