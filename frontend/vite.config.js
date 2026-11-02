import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Saat development, semua request ke /api diteruskan (proxy) ke backend,
// sehingga tidak ada masalah CORS dan frontend cukup memanggil "/api/...".
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
