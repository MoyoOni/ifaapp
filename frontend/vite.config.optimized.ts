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
      chunkSizeWarningLimit: 500, // Reduced from 750
      rollupOptions: {
        output: {
          manualChunks: {
            // Core framework libraries
            react: ['react', 'react-dom', 'react-router-dom'],
            
            // Data fetching and state management
            query: ['@tanstack/react-query'],
            
            // UI Components and primitives
            ui: [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-slot',
            ],
            
            // Animation and motion
            motion: ['framer-motion'],
            
            // Icons
            icons: ['lucide-react'],
            
            // Real-time communication
            socket: ['socket.io-client'],
            
            // RTC and video calling
            rtc: ['agora-rtc-sdk-ng'],
            
            // Utilities (split into smaller chunks)
            'utils-core': ['axios', 'zod'],
            'utils-ui': ['clsx', 'tailwind-merge', 'class-variance-authority'],
            
            // Sentry error tracking
            sentry: ['@sentry/react'],
          },
          
          // Optimize chunk naming and reduce hash length
          entryFileNames: 'assets/[name]-[hash:8].js',
          chunkFileNames: 'assets/[name]-[hash:8].js',
          assetFileNames: 'assets/[name]-[hash:8].[ext]',
        },
      },
    },
    
    // Enable code splitting optimizations
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'framer-motion',
        'lucide-react',
        'axios',
        'zod'
      ],
      exclude: []
    }
  };
});