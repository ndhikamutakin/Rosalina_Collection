export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      <div className="page-actions">{children}</div>
    </div>
  );
}

// Menampilkan pesan error dari ApiError (termasuk daftar `errors` dari validasi backend)
export function FormErrors({ error }) {
  if (!error) return null;
  return (
    <div className="alert error">
      <strong>{error.message}</strong>
      {error.errors?.length > 0 && (
        <ul>{error.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
      )}
    </div>
  );
}

export const StatusBadge = ({ status }) => (
  <span className={`badge ${status === 'selesai' ? 'ok' : 'warn'}`}>{status}</span>
);

export function Bar({ value = 0, max = 0, tone = '' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="bar-cell">
      <div className="bar"><span className={tone} style={{ width: `${pct}%` }} /></div>
      <small>{value} ({pct}%)</small>
    </div>
  );
}

export const Loading = () => <div className="state">Memuat data...</div>;
export const Empty = ({ children = 'Belum ada data.' }) => <div className="state">{children}</div>;
export const LoadError = ({ message, onRetry }) => (
  <div className="alert error">
    {message} {onRetry && <button className="link" onClick={onRetry}>Coba lagi</button>}
  </div>
);
