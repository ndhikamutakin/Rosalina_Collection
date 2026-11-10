import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { hariIni } from '../utils/format';
import { Modal, Confirm } from './Modal';
import { Empty, FormErrors, Loading, LoadError, PageHeader } from './ui';

const isRemote = (f) => f.options && !Array.isArray(f.options);

const emptyForm = (fields) =>
  Object.fromEntries(fields.map((f) => [f.name, f.type === 'date' ? hariIni() : f.default ?? '']));

/**
 * Halaman CRUD generik, dipakai oleh semua data master dan hasil produksi.
 * Alur sesuai sequence diagram:
 *   Lihat   -> GET    {endpoint}
 *   Tambah  -> POST   {endpoint}
 *   Update  -> dialog konfirmasi -> PUT    {endpoint}/:id
 *   Hapus   -> dialog konfirmasi -> DELETE {endpoint}/:id
 * Hanya Admin yang melihat tombol tambah / ubah / hapus (Owner hanya lihat).
 *
 * `fields` dan `columns` harus berupa konstanta di level modul (referensi stabil).
 */
export default function CrudPage({ title, subtitle, endpoint, idKey, label, columns, fields }) {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [remote, setRemote] = useState({});

  const [modal, setModal] = useState(null); // { mode: 'create' | 'edit', id }
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type: 'update' | 'delete', row }

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setRows(await api.get(endpoint));
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  // Pilihan dropdown yang diambil dari endpoint lain (mis. daftar work order)
  useEffect(() => {
    if (!isAdmin) return undefined;
    let alive = true;
    fields.filter(isRemote).forEach(async (f) => {
      try {
        const data = await api.get(f.options.endpoint);
        if (alive) setRemote((r) => ({ ...r, [f.name]: data }));
      } catch { /* dropdown dibiarkan kosong; error muncul saat simpan */ }
    });
    return () => { alive = false; };
  }, [fields, isAdmin]);

  const optionsFor = (f) => {
    if (Array.isArray(f.options)) return f.options;
    const { value, label: lbl, filter } = f.options;
    return (remote[f.name] || [])
      .filter((d) => !filter || filter(d, form))
      .map((d) => ({ value: d[value], label: lbl(d) }));
  };

  const openCreate = () => {
    setForm(emptyForm(fields));
    setFormError(null);
    setModal({ mode: 'create' });
  };

  const openEdit = (row) => {
    setForm(Object.fromEntries(fields.map((f) => {
      const v = row[f.name];
      return [f.name, v === null || v === undefined ? '' : f.type === 'date' ? String(v).slice(0, 10) : v];
    })));
    setFormError(null);
    setModal({ mode: 'edit', id: row[idKey] });
  };

  const closeModal = () => { if (!saving) { setModal(null); setConfirm(null); } };

  const buildPayload = () => {
    const p = {};
    fields.forEach((f) => {
      const v = form[f.name];
      if (v === '' || v === null || v === undefined) return;
      p[f.name] = f.type === 'number' ? Number(v) : typeof v === 'string' ? v.trim() : v;
    });
    return p;
  };

  const save = async () => {
    setSaving(true);
    try {
      if (modal.mode === 'edit') {
        await api.put(`${endpoint}/${modal.id}`, buildPayload());
        toast(`${label} berhasil diperbarui`);
      } else {
        await api.post(endpoint, buildPayload());
        toast(`${label} berhasil ditambahkan`);
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
    if (modal.mode === 'edit') setConfirm({ type: 'update' }); // konfirmasi update
    else save();
  };

  const doDelete = async () => {
    setSaving(true);
    try {
      await api.del(`${endpoint}/${confirm.row[idKey]}`);
      toast(`${label} berhasil dihapus`);
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const setField = (f, value) =>
    setForm((prev) => {
      const next = { ...prev, [f.name]: value };
      (f.resets || []).forEach((r) => { next[r] = ''; });
      return next;
    });

  return (
    <>
      <PageHeader title={title} subtitle={subtitle}>
        {isAdmin && <button className="btn primary" onClick={openCreate}>+ Tambah {label}</button>}
      </PageHeader>
      {!isAdmin && <div className="alert info">Anda masuk sebagai Owner: data pada halaman ini hanya dapat dilihat.</div>}

      <div className="card">
        {loading ? <Loading />
          : loadError ? <LoadError message={loadError} onRetry={load} />
          : rows.length === 0 ? <Empty />
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    {columns.map((c) => <th key={c.header}>{c.header}</th>)}
                    {isAdmin && <th className="right">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row[idKey]}>
                      <td>{i + 1}</td>
                      {columns.map((c) => (
                        <td key={c.header}>{c.render ? c.render(row) : (row[c.key] ?? '-')}</td>
                      ))}
                      {isAdmin && (
                        <td className="right nowrap">
                          <button className="btn ghost sm" onClick={() => openEdit(row)}>Ubah</button>{' '}
                          <button className="btn danger-ghost sm" onClick={() => setConfirm({ type: 'delete', row })}>Hapus</button>
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
        <Modal title={`${modal.mode === 'edit' ? 'Ubah' : 'Tambah'} ${label}`} onClose={closeModal}>
          <form onSubmit={onSubmit}>
            <FormErrors error={formError} />
            <div className="form-grid">
              {fields.map((f) => (
                <div className={`field ${f.full ? 'full' : ''}`} key={f.name}>
                  <label htmlFor={f.name}>{f.label}{f.required && <span className="req"> *</span>}</label>
                  {f.type === 'textarea' ? (
                    <textarea id={f.name} rows={3} value={form[f.name]} onChange={(e) => setField(f, e.target.value)} />
                  ) : f.type === 'select' ? (
                    <select id={f.name} value={form[f.name]} required={f.required} onChange={(e) => setField(f, e.target.value)}>
                      <option value="">{f.placeholder || 'Pilih...'}</option>
                      {optionsFor(f).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input
                      id={f.name}
                      type={f.type || 'text'}
                      min={f.min}
                      value={form[f.name]}
                      required={f.required}
                      onChange={(e) => setField(f, e.target.value)}
                    />
                  )}
                  {f.hint && <small className="muted">{f.hint(form)}</small>}
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={closeModal} disabled={saving}>Batal</button>
              <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </Modal>
      )}

      {confirm?.type === 'update' && (
        <Confirm
          title={`Konfirmasi ubah ${label}`}
          message={`Simpan perubahan pada ${label.toLowerCase()} ini?`}
          confirmText="Ya, simpan"
          busy={saving}
          onConfirm={save}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.type === 'delete' && (
        <Confirm
          title={`Hapus ${label}`}
          message={`Data ${label.toLowerCase()} yang dihapus tidak dapat dikembalikan. Lanjutkan?`}
          confirmText="Ya, hapus"
          danger
          busy={saving}
          onConfirm={doDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
