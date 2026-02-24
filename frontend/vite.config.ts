
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const withAnalyzer = process.env.ANALYZE === '1';

  return {
    plugins: [
      react(),
      withAnalyzer && visualizer({
        filename: 'dist/stats.html',
        gzipSize: true,
        open: false,
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@common': path.resolve(__dirname, '../common/dist'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      minify: 'esbuild',
      reportCompressedSize: true,
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            query: ['@tanstack/react-query'],
            ui: [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-slot',
            ],
            motion: ['framer-motion'],
            icons: ['lucide-react'],
            socket: ['socket.io-client'],
            utils: ['axios', 'zod', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          },
        },
      },
    },
  };
});
