export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n) || 0);

export const angka = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);

// YYYY-MM-DD menurut waktu lokal (format yang diminta backend)
export const hariIni = () => new Date().toLocaleDateString('en-CA');

// YYYY-MM-DD -> DD/MM/YYYY
export const tgl = (s) => {
  if (!s) return '-';
  const [y, m, d] = String(s).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

export const labelWO = (w) => (w ? `WO #${w.id_wo} - ${w.model?.nama_model || 'Tanpa model'}` : '-');
