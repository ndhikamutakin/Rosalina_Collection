import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { HomeRedirect, ProtectedRoute, RoleRoute } from './components/Guards';
import Login from './pages/Login';
import Monitoring from './pages/Monitoring';
import Laporan from './pages/Laporan';
import WorkOrder from './pages/WorkOrder';
import Pembelian from './pages/Pembelian';
import { BahanPendukung, Kain, ModelProduksi, TimProduksi } from './pages/MasterPages';
import { HasilJahit, HasilPotong, HasilQc } from './pages/HasilPages';

const owner = (el) => <RoleRoute roles={['owner']}>{el}</RoleRoute>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<HomeRedirect />} />
        {/* Khusus Owner */}
        <Route path="monitoring" element={owner(<Monitoring />)} />
        <Route path="laporan" element={owner(<Laporan />)} />
        {/* Owner & Admin (Admin dapat mengubah data, Owner hanya melihat) */}
        <Route path="work-order" element={<WorkOrder />} />
        <Route path="hasil-potong" element={<HasilPotong />} />
        <Route path="hasil-jahit" element={<HasilJahit />} />
        <Route path="hasil-qc" element={<HasilQc />} />
        <Route path="model-produksi" element={<ModelProduksi />} />
        <Route path="kain" element={<Kain />} />
        <Route path="bahan-pendukung" element={<BahanPendukung />} />
        <Route path="tim-produksi" element={<TimProduksi />} />
        <Route path="pembelian-bahan" element={<Pembelian />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
