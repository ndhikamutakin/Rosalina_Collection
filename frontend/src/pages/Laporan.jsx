import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Empty, Loading, LoadError, PageHeader, StatusBadge } from '../components/ui';
import { angka, hariIni, tgl } from '../utils/format';

// Sequence Lihat Laporan Produksi : GET /laporan/produksi?periode=&tanggal=
// Sequence Unduh Laporan Produksi : GET /laporan/produksi/unduh?format=pdf|xlsx&periode=&tanggal=
export default function Laporan() {
  const toast = useToast();
  const [periode, setPeriode] = useState('harian');
  const [tanggal, setTanggal] = useState(hariIni());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unduhan, setUnduhan] = useState('');

  useEffect(() => {
    if (!tanggal) return undefined;
    let alive = true;
    setLoading(true);
    setError('');
    api.get('/laporan/produksi', { periode, tanggal })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [periode, tanggal]);

  const unduh = async (format) => {
    setUnduhan(format);
    try {
      const { blob, filename } = await api.download('/laporan/produksi/unduh', { format, periode, tanggal });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `laporan-produksi-${periode}-${tanggal}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('Laporan berhasil diunduh');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setUnduhan('');
    }
  };

  return (
    <>
      <PageHeader title="Laporan Produksi" subtitle="Rekap total produksi, produk selesai (lolos QC), dan gagal QC">
        <button className="btn ghost" disabled={!!unduhan || !tanggal} onClick={() => unduh('pdf')}>{unduhan === 'pdf' ? 'Mengunduh...' : 'Unduh PDF'}</button>
        <button className="btn primary" disabled={!!unduhan || !tanggal} onClick={() => unduh('xlsx')}>{unduhan === 'xlsx' ? 'Mengunduh...' : 'Unduh Excel'}</button>
      </PageHeader>

      <div className="card filter-bar">
        <div className="field">
          <label>Periode</label>
          <select value={periode} onChange={(e) => setPeriode(e.target.value)}>
            <option value="harian">Harian</option>
            <option value="mingguan">Mingguan (Senin - Minggu)</option>
          </select>
        </div>
        <div className="field">
          <label>Tanggal</label>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </div>
        {data && <div className="range muted">Rentang: <strong>{tgl(data.mulai)}</strong> s.d. <strong>{tgl(data.selesai)}</strong></div>}
      </div>

      {loading ? <Loading /> : error ? <LoadError message={error} /> : data && (
        <>
          <div className="stat-grid three">
            <div className="stat"><span>Total Produksi</span><strong>{angka(data.total_produksi)}</strong></div>
            <div className="stat ok"><span>Produk Selesai (lolos QC)</span><strong>{angka(data.produk_selesai)}</strong></div>
            <div className="stat danger"><span>Gagal QC (reject)</span><strong>{angka(data.gagal_qc)}</strong></div>
          </div>
          <div className="card">
            <h3 className="card-title">Work Order pada Periode</h3>
            {data.work_order.length === 0 ? <Empty>Tidak ada work order pada periode ini.</Empty> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>No</th><th>Tanggal</th><th>ID WO</th><th>Model</th><th className="right">Jumlah</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.work_order.map((w, i) => (
                      <tr key={w.id_wo}>
                        <td>{i + 1}</td><td>{tgl(w.tanggal)}</td><td>#{w.id_wo}</td>
                        <td>{w.model?.nama_model || '-'}</td>
                        <td className="right">{angka(w.jumlah_produksi)}</td>
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
