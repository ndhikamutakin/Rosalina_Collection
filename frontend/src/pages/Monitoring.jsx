import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Bar, Empty, Loading, LoadError, PageHeader, StatusBadge } from '../components/ui';
import { angka, tgl } from '../utils/format';

// Sequence Monitoring Produksi (Owner): GET /monitoring/status
export default function Monitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      setData(await api.get('/monitoring/status'));
      setUpdated(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 30000); // perbarui otomatis tiap 30 detik
    return () => clearInterval(t);
  }, [load]);

  const r = data?.ringkasan;

  return (
    <>
      <PageHeader title="Monitoring Produksi" subtitle={updated ? `Diperbarui ${updated.toLocaleTimeString('id-ID')} (otomatis tiap 30 detik)` : ''}>
        <button className="btn ghost" onClick={() => load()}>Muat ulang</button>
      </PageHeader>

      {loading && !data ? <Loading /> : error && !data ? <LoadError message={error} onRetry={() => load()} /> : data && (
        <>
          <div className="stat-grid">
            <div className="stat"><span>Total Work Order</span><strong>{r.total_work_order}</strong></div>
            <div className="stat warn"><span>Sedang Proses</span><strong>{r.work_order_proses}</strong></div>
            <div className="stat ok"><span>Selesai</span><strong>{r.work_order_selesai}</strong></div>
            <div className="stat"><span>Total Target Produksi</span><strong>{angka(r.total_jumlah_produksi)}</strong></div>
            <div className="stat ok"><span>Lolos QC</span><strong>{angka(r.total_qc_lolos)}</strong></div>
            <div className="stat danger"><span>Reject QC</span><strong>{angka(r.total_qc_reject)}</strong></div>
          </div>

          <div className="card">
            <h3 className="card-title">Status per Work Order</h3>
            {data.work_order.length === 0 ? <Empty>Belum ada work order.</Empty> : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>WO</th><th>Tanggal</th><th>Model</th><th className="right">Target</th><th>Potong</th><th>Jahit</th><th>QC Lolos</th><th>Reject</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.work_order.map((w) => (
                      <tr key={w.id_wo}>
                        <td>#{w.id_wo}</td>
                        <td>{tgl(w.tanggal)}</td>
                        <td>{w.model?.nama_model || '-'}</td>
                        <td className="right">{angka(w.jumlah_produksi)}</td>
                        <td><Bar value={w.hasil_potong} max={w.jumlah_produksi} /></td>
                        <td><Bar value={w.hasil_jahit} max={w.jumlah_produksi} /></td>
                        <td><Bar value={w.qc_lolos} max={w.jumlah_produksi} tone="ok" /></td>
                        <td>{w.qc_reject}</td>
                        <td><StatusBadge status={w.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
