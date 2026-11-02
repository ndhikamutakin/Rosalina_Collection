const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const auth = require('../controllers/authController');
const master = require('../controllers/masterController');
const hasil = require('../controllers/hasilController');
const workOrder = require('../controllers/workOrderController');
const monitoring = require('../controllers/monitoringController');
const laporan = require('../controllers/laporanController');
const pembelian = require('../controllers/pembelianController');

const router = express.Router();

const semua = authorize('owner', 'admin'); // lihat data
const adminSaja = authorize('admin'); // kelola data (tambah / ubah / hapus)
const ownerSaja = authorize('owner');

// ---------- Autentikasi (Sequence Login) ----------
router.post('/auth/login', auth.login);
router.get('/auth/me', authenticate, auth.me);
router.post('/auth/logout', authenticate, auth.logout);

// Semua endpoint di bawah ini wajib login
router.use(authenticate);

// Daftarkan CRUD standar: GET (lihat) untuk semua peran, POST/PUT/DELETE untuk Admin
function mountCrud(path, crud) {
  router.get(path, semua, crud.list);
  router.get(`${path}/:id`, semua, crud.detail);
  router.post(path, adminSaja, crud.create);
  router.put(`${path}/:id`, adminSaja, crud.update);
  router.delete(`${path}/:id`, adminSaja, crud.remove);
}

// ---------- Data master (Admin) ----------
mountCrud('/model-produksi', master.modelProduksi);
mountCrud('/kain', master.kain);
mountCrud('/bahan-pendukung', master.bahanPendukung);
mountCrud('/tim-produksi', master.timProduksi);

// ---------- Hasil produksi (Admin) ----------
mountCrud('/hasil-potong', hasil.hasilPotong);
mountCrud('/hasil-jahit', hasil.hasilJahit);
mountCrud('/hasil-qc', hasil.hasilQc);

// ---------- Work order ----------
router.get('/work-order', semua, workOrder.list);
router.get('/work-order/:id', semua, workOrder.detail);
router.post('/work-order', ownerSaja, workOrder.create);
router.patch('/work-order/:id/status', semua, workOrder.updateStatus);

// ---------- Pembelian bahan (Admin) ----------
router.get('/pembelian-bahan/total', semua, pembelian.hitungTotal); // sebelum /:id
router.get('/pembelian-bahan', semua, pembelian.list);
router.get('/pembelian-bahan/:id', semua, pembelian.detail);
router.post('/pembelian-bahan', adminSaja, pembelian.create);
router.put('/pembelian-bahan/:id', adminSaja, pembelian.update);
router.delete('/pembelian-bahan/:id', adminSaja, pembelian.remove);

// ---------- Monitoring & laporan (Owner) ----------
router.get('/monitoring/status', ownerSaja, monitoring.status);
router.get('/laporan/produksi', ownerSaja, laporan.tampilkan);
router.get('/laporan/produksi/unduh', ownerSaja, laporan.unduh);

module.exports = router;
