import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode (dev/prod)
  const env = loadEnv(mode, process.cwd(), '');

  // Determine if we're in development mode
  const isDev = mode === 'development';

  return {
    plugins: [react()],
    server: {
      proxy: isDev ? {
        // Development proxy configuration
        '/employees': {
          target: env.VITE_DEV_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false
        },
        '/attendance': {
          target: env.VITE_DEV_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false
        }
        // Add other endpoints as needed
      } : undefined // No proxy in production
    },
    define: {
      // Make environment variables available to your app
      'process.env': {
        VITE_API_BASE_URL: JSON.stringify(
          isDev ? '' : env.VITE_PROD_API_BASE_URL
        )
      }
    }
  };
});