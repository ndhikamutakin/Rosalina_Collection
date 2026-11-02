import { useEffect } from 'react';

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Tutup">x</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// Dialog konfirmasi (langkah "konfirmasi update / delete" pada sequence diagram)
export function Confirm({ title, message, confirmText = 'Ya, lanjutkan', danger = false, busy = false, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="confirm-text">{message}</p>
      <div className="modal-actions">
        <button type="button" className="btn ghost" onClick={onCancel} disabled={busy}>Batal</button>
        <button type="button" className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm} disabled={busy}>
          {busy ? 'Memproses...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
