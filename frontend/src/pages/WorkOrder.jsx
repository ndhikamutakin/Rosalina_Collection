import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Confirm, Modal } from '../components/Modal';
import { Empty, FormErrors, Loading, LoadError, PageHeader, StatusBadge } from '../components/ui';
import { angka, hariIni, tgl } from '../utils/format';

// Owner: BuatWorkOrder (POST /work-order). Owner & Admin: lihat daftar dan ubah status
// (MulaiProduksi / SelesaiProduksi -> PATCH /work-order/:id/status).
export default function WorkOrder() {
  const { isOwner } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState(null);
  const [pesanJumlah, setPesanJumlah] = useState(''); // BARU: pesan validasi jumlah produksi
  const [models, setModels] = useState([]);
  const [tims, setTims] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null); // { row, next }

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setRows(await api.get('/work-order', { status }));
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    setForm({ tanggal: hariIni(), jumlah_produksi: '', id_model: '', id_tim: '' });
    setFormError(null);
    setPesanJumlah(''); // BARU: bersihkan pesan saat form dibuka
    setModal(true);
    try {
      const [m, t] = await Promise.all([api.get('/model-produksi'), api.get('/tim-produksi')]);
      setModels(m);
      setTims(t);
    } catch (e) {
      setFormError(e);
    }
  };

  const create = async (e) => {
    e.preventDefault();

    // BARU: domain check, jumlah produksi minimal 1
    if (Number(form.jumlah_produksi) < 1) {
      setPesanJumlah('Jumlah produksi minimal 1.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const body = { tanggal: form.tanggal, jumlah_produksi: Number(form.jumlah_produksi), id_model: Number(form.id_model) };
      if (form.id_tim) body.id_tim = Number(form.id_tim);
      await api.post('/work-order', body);
      toast('Work order berhasil dibuat');
      setModal(false);
      load();
    } catch (err) {
      setFormError(err);
    } finally {
      setSaving(false);
    }
  };

  const ubahStatus = async () => {
    setSaving(true);
    try {
      await api.patch(`/work-order/${confirm.row.id_wo}/status`, { status: confirm.next });
      toast(`Status WO #${confirm.row.id_wo} menjadi "${confirm.next}"`);
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // BARU: data-type check, karakter non-angka ditolak dan muncul pesan singkat
  const setJumlah = (e) => {
    const nilai = e.target.value;
    const bersih = nilai.replace(/\D/g, ''); // buang semua karakter non-angka
    setPesanJumlah(nilai !== bersih ? 'Jumlah produksi hanya boleh berisi angka.' : '');
    setForm((f) => ({ ...f, jumlah_produksi: bersih }));
  };

  return (
    <>
      <PageHeader title="Work Order" subtitle="Perintah produksi: dibuat Owner, status diperbarui saat produksi berjalan">
        <select className="inline-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua status</option>
          <option value="proses">Proses</option>
          <option value="selesai">Selesai</option>
        </select>
        {isOwner && <button className="btn primary" onClick={openCreate}>+ Buat Work Order</button>}
      </PageHeader>

      <div className="card">
        {loading ? <Loading />
          : loadError ? <LoadError message={loadError} onRetry={load} />
          : rows.length === 0 ? <Empty>Belum ada work order.</Empty>
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Tanggal</th><th>Model</th><th>Tim</th><th className="right">Jumlah</th><th>Status</th><th className="right">Aksi</th></tr>
                </thead>
                <tbody>
                  {rows.map((w) => (
                    <tr key={w.id_wo}>
                      <td>#{w.id_wo}</td>
                      <td>{tgl(w.tanggal)}</td>
                      <td>{w.model?.nama_model || '-'}</td>
                      <td>{w.tim ? `${w.tim.nama_karyawan} (${w.tim.jenis_tim})` : '-'}</td>
                      <td className="right">{angka(w.jumlah_produksi)}</td>
                      <td><StatusBadge status={w.status} /></td>
                      <td className="right nowrap">
                        {w.status === 'proses'
                          ? <button className="btn ok sm" onClick={() => setConfirm({ row: w, next: 'selesai' })}>Tandai selesai</button>
                          : <button className="btn ghost sm" onClick={() => setConfirm({ row: w, next: 'proses' })}>Kembalikan ke proses</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {modal && (
        <Modal title="Buat Work Order" onClose={() => !saving && setModal(false)}>
          <form onSubmit={create}>
            <FormErrors error={formError} />
            <div className="form-grid">
              <div className="field">
                <label>Tanggal</label>
                <input type="date" value={form.tanggal} onChange={set('tanggal')} required />
              </div>
              <div className="field">
                <label>Jumlah produksi <span className="req">*</span></label>
                {/* DIUBAH: type="text" + inputMode numeric, handler setJumlah, tanpa min="1" */}
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.jumlah_produksi}
                  onChange={setJumlah}
                  required
                />
                {/* BARU: pesan validasi di bawah kolom */}
                {pesanJumlah && <small style={{ color: '#c0392b' }}>{pesanJumlah}</small>}
              </div>
              <div className="field full">
                <label>Model produksi <span className="req">*</span></label>
                <select value={form.id_model} onChange={set('id_model')} required>
                  <option value="">Pilih model...</option>
                  {models.map((m) => <option key={m.id_model} value={m.id_model}>{m.nama_model}</option>)}
                </select>
              </div>
              <div className="field full">
                <label>Tim produksi (opsional)</label>
                <select value={form.id_tim} onChange={set('id_tim')}>
                  <option value="">Tanpa tim</option>
                  {tims.map((t) => <option key={t.id_karyawan} value={t.id_karyawan}>{t.nama_karyawan} ({t.jenis_tim})</option>)}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setModal(false)} disabled={saving}>Batal</button>
              <button className="btn primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Buat Work Order'}</button>
            </div>
          </form>
        </Modal>
      )}

      {confirm && (
        <Confirm
          title="Ubah status work order"
          message={`Ubah status WO #${confirm.row.id_wo} menjadi "${confirm.next}"?`}
          confirmText="Ya, ubah"
          busy={saving}
          onConfirm={ubahStatus}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}