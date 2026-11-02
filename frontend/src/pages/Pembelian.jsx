import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Confirm, Modal } from '../components/Modal';
import { Empty, FormErrors, Loading, LoadError, PageHeader } from '../components/ui';
import { angka, hariIni, rupiah, tgl } from '../utils/format';

const itemKosong = () => ({ jenis_bahan: 'kain', id: '', jumlah: '', harga_satuan: '' });

// Pembelian bahan:
//  Lihat + Hitung Total -> GET /pembelian-bahan & GET /pembelian-bahan/total (filter tanggal)
//  Tambah  -> POST (stok kain / bahan otomatis bertambah, total dihitung dari item)
//  Update  -> PUT  (hanya tanggal, keterangan, dan total biaya bila tanpa rincian)
//  Hapus   -> DELETE (stok dikembalikan; ditolak bila stok sudah terpakai)
export default function Pembelian() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(null);
  const [filter, setFilter] = useState({ mulai: '', selesai: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [kain, setKain] = useState([]);
  const [bahan, setBahan] = useState([]);

  const [modal, setModal] = useState(null); // { mode, row }
  const [form, setForm] = useState({});
  const [items, setItems] = useState([]);
  const [pakaiRincian, setPakaiRincian] = useState(true);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type, row }

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = { mulai: filter.mulai, selesai: filter.selesai };
      const [list, tot] = await Promise.all([
        api.get('/pembelian-bahan', params),
        api.get('/pembelian-bahan/total', params),
      ]);
      setRows(list);
      setTotal(tot);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    Promise.all([api.get('/kain'), api.get('/bahan-pendukung')])
      .then(([k, b]) => { setKain(k); setBahan(b); })
      .catch(() => {});
  }, []);

  const namaItem = (it) => {
    if (it.jenis_bahan === 'kain') return kain.find((k) => k.id_kain === it.id_kain)?.nama_kain || `Kain #${it.id_kain}`;
    return bahan.find((b) => b.id_bahan === it.id_bahan)?.nama_bahan || `Bahan #${it.id_bahan}`;
  };

  const openCreate = () => {
    setForm({ tanggal: hariIni(), keterangan: '', total_biaya: '' });
    setItems([itemKosong()]);
    setPakaiRincian(true);
    setFormError(null);
    setModal({ mode: 'create' });
  };

  const openEdit = (row) => {
    setForm({ tanggal: String(row.tanggal).slice(0, 10), keterangan: row.keterangan || '', total_biaya: row.total_biaya });
    setFormError(null);
    setModal({ mode: 'edit', row });
  };

  const closeModal = () => { if (!saving) { setModal(null); setConfirm(null); } };

  const setItem = (i, patch) => setItems((l) => l.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const totalRincian = items.reduce((t, it) => t + (Number(it.jumlah) || 0) * (Number(it.harga_satuan) || 0), 0);

  const save = async () => {
    setSaving(true);
    try {
      if (modal.mode === 'edit') {
        const adaRincian = modal.row.items?.length > 0;
        const body = { tanggal: form.tanggal };
        if (form.keterangan.trim()) body.keterangan = form.keterangan.trim();
        if (!adaRincian && form.total_biaya !== '') body.total_biaya = Number(form.total_biaya);
        await api.put(`/pembelian-bahan/${modal.row.id_pembelian}`, body);
        toast('Pembelian bahan berhasil diperbarui');
      } else {
        const body = { tanggal: form.tanggal };
        if (form.keterangan.trim()) body.keterangan = form.keterangan.trim();
        if (pakaiRincian) {
          body.items = items.map((it) => ({
            jenis_bahan: it.jenis_bahan,
            [it.jenis_bahan === 'kain' ? 'id_kain' : 'id_bahan']: it.id ? Number(it.id) : undefined,
            jumlah: Number(it.jumlah),
            harga_satuan: Number(it.harga_satuan),
          }));
        } else {
          body.total_biaya = Number(form.total_biaya);
        }
        await api.post('/pembelian-bahan', body);
        toast('Pembelian bahan berhasil ditambahkan, stok diperbarui');
      }
      setModal(null);
      load();
    } catch (e) {
      setFormError(e);
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    if (modal.mode === 'edit') setConfirm({ type: 'update' });
    else save();
  };

  const doDelete = async () => {
    setSaving(true);
    try {
      await api.del(`/pembelian-bahan/${confirm.row.id_pembelian}`);
      toast('Pembelian bahan berhasil dihapus, stok dikembalikan');
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const editAdaRincian = modal?.mode === 'edit' && modal.row.items?.length > 0;

  return (
    <>
      <PageHeader title="Pembelian Bahan" subtitle="Pencatatan pembelian kain dan bahan pendukung">
        {isAdmin && <button className="btn primary" onClick={openCreate}>+ Tambah Pembelian</button>}
      </PageHeader>
      {!isAdmin && <div className="alert info">Anda masuk sebagai Owner: data pada halaman ini hanya dapat dilihat.</div>}

      <div className="card filter-bar">
        <div className="field">
          <label>Dari tanggal</label>
          <input type="date" value={filter.mulai} onChange={(e) => setFilter((f) => ({ ...f, mulai: e.target.value }))} />
        </div>
        <div className="field">
          <label>Sampai tanggal</label>
          <input type="date" value={filter.selesai} onChange={(e) => setFilter((f) => ({ ...f, selesai: e.target.value }))} />
        </div>
        {(filter.mulai || filter.selesai) && (
          <button className="btn ghost" onClick={() => setFilter({ mulai: '', selesai: '' })}>Reset</button>
        )}
        {total && (
          <div className="total-box">
            <span>Total pembelian{filter.mulai || filter.selesai ? ' (sesuai filter)' : ''}</span>
            <strong>{rupiah(total.total_biaya)}</strong>
            <small className="muted">{angka(total.jumlah_transaksi)} transaksi</small>
          </div>
        )}
      </div>

      <div className="card">
        {loading ? <Loading />
          : loadError ? <LoadError message={loadError} onRetry={load} />
          : rows.length === 0 ? <Empty>Belum ada pembelian bahan.</Empty>
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Tanggal</th><th>Keterangan</th><th>Rincian</th><th className="right">Total Biaya</th>{isAdmin && <th className="right">Aksi</th>}</tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id_pembelian}>
                      <td>#{p.id_pembelian}</td>
                      <td>{tgl(p.tanggal)}</td>
                      <td>{p.keterangan || '-'}</td>
                      <td>
                        {p.items?.length ? (
                          <ul className="mini-list">
                            {p.items.map((it) => (
                              <li key={it.id_detail}>{namaItem(it)}: {angka(it.jumlah)} x {rupiah(it.harga_satuan)}</li>
                            ))}
                          </ul>
                        ) : <span className="muted">Tanpa rincian</span>}
                      </td>
                      <td className="right"><strong>{rupiah(p.total_biaya)}</strong></td>
                      {isAdmin && (
                        <td className="right nowrap">
                          <button className="btn ghost sm" onClick={() => openEdit(p)}>Ubah</button>{' '}
                          <button className="btn danger-ghost sm" onClick={() => setConfirm({ type: 'delete', row: p })}>Hapus</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {modal && (
        <Modal title={modal.mode === 'edit' ? `Ubah Pembelian #${modal.row.id_pembelian}` : 'Tambah Pembelian Bahan'} onClose={closeModal} wide>
          <form onSubmit={onSubmit}>
            <FormErrors error={formError} />
            <div className="form-grid">
              <div className="field">
                <label>Tanggal</label>
                <input type="date" required value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
              </div>
              <div className="field">
                <label>Keterangan</label>
                <input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
              </div>
            </div>

            {modal.mode === 'create' && (
              <>
                <label className="check">
                  <input type="checkbox" checked={pakaiRincian} onChange={(e) => setPakaiRincian(e.target.checked)} />
                  Isi rincian item (stok otomatis bertambah, total dihitung otomatis)
                </label>

                {pakaiRincian ? (
                  <div className="items">
                    {items.map((it, i) => (
                      <div className="item-row" key={i}>
                        <select value={it.jenis_bahan} onChange={(e) => setItem(i, { jenis_bahan: e.target.value, id: '' })}>
                          <option value="kain">Kain</option>
                          <option value="bahan_pendukung">Bahan pendukung</option>
                        </select>
                        <select value={it.id} required onChange={(e) => setItem(i, { id: e.target.value })}>
                          <option value="">Pilih...</option>
                          {it.jenis_bahan === 'kain'
                            ? kain.map((k) => <option key={k.id_kain} value={k.id_kain}>{k.nama_kain}</option>)
                            : bahan.map((b) => <option key={b.id_bahan} value={b.id_bahan}>{b.nama_bahan}</option>)}
                        </select>
                        <input type="number" min="1" placeholder="Jumlah" required value={it.jumlah} onChange={(e) => setItem(i, { jumlah: e.target.value })} />
                        <input type="number" min="0" placeholder="Harga satuan" required value={it.harga_satuan} onChange={(e) => setItem(i, { harga_satuan: e.target.value })} />
                        <span className="subtotal">{rupiah((Number(it.jumlah) || 0) * (Number(it.harga_satuan) || 0))}</span>
                        <button type="button" className="icon-btn" disabled={items.length === 1} onClick={() => setItems((l) => l.filter((_, idx) => idx !== i))} aria-label="Hapus item">x</button>
                      </div>
                    ))}
                    <div className="items-foot">
                      <button type="button" className="btn ghost sm" onClick={() => setItems((l) => [...l, itemKosong()])}>+ Tambah item</button>
                      <strong>Total: {rupiah(totalRincian)}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="field">
                    <label>Total biaya <span className="req">*</span></label>
                    <input type="number" min="0" required value={form.total_biaya} onChange={(e) => setForm({ ...form, total_biaya: e.target.value })} />
                  </div>
                )}
              </>
            )}

            {modal.mode === 'edit' && (editAdaRincian ? (
              <div className="alert info">
                Total biaya ({rupiah(modal.row.total_biaya)}) dihitung dari rincian item dan tidak dapat diubah langsung.
                Untuk mengubah rincian, hapus pembelian ini lalu buat ulang agar stok tetap konsisten.
              </div>
            ) : (
              <div className="field">
                <label>Total biaya</label>
                <input type="number" min="0" value={form.total_biaya} onChange={(e) => setForm({ ...form, total_biaya: e.target.value })} />
              </div>
            ))}

            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={closeModal} disabled={saving}>Batal</button>
              <button className="btn primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </Modal>
      )}

      {confirm?.type === 'update' && (
        <Confirm title="Konfirmasi ubah pembelian" message="Simpan perubahan pada pembelian bahan ini?" confirmText="Ya, simpan" busy={saving} onConfirm={save} onCancel={() => setConfirm(null)} />
      )}
      {confirm?.type === 'delete' && (
        <Confirm
          title="Hapus pembelian bahan"
          message={`Pembelian #${confirm.row.id_pembelian} akan dihapus dan stok bahan dikembalikan (dikurangi). Pembelian tidak dapat dihapus bila stok sudah terpakai. Lanjutkan?`}
          confirmText="Ya, hapus" danger busy={saving} onConfirm={doDelete} onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
