
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const withAnalyzer = process.env.ANALYZE === '1';
  // Sanitize base path — Git Bash on Windows can corrupt '/' to a Windows path via MSYS
  const rawBase = process.env.VITE_BASE_PATH || '/';
  const base = rawBase.includes('Program Files') || rawBase.includes(':\\') ? '/' : rawBase;

  return {
    base,
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
      dedupe: ['react', 'react-dom'],
    },
    server: {
      port: 8100,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
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
          // Enable code splitting for better caching
          chunkFileNames: 'chunks/[name].[hash].js',
          entryFileNames: '[name].[hash].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'css/[name].[hash].[ext]';
            }
            if (assetInfo.name && assetInfo.name.match(/\.(png|jpe?g|gif|svg)$/)) {
              return 'images/[name].[hash].[ext]';
            }
            return 'assets/[name].[hash].[ext]';
          }
        },
      },
      // Enable compression for production builds
      cssCodeSplit: true,
      sourcemap: mode !== 'production', // Disable sourcemaps in production
      target: 'es2015', // Target ES2015 for broader compatibility but good performance
    },
    esbuild: {
      // Minify identifiers in production
      legalComments: 'none', // Remove license comments in production
    },
    optimizeDeps: {
      include: [
        'react/jsx-runtime', // Prebundle JSX runtime
      ],
    },
  };
});