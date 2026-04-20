import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '')
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_DOCSTRANGE_API_KEY': JSON.stringify(env.DOCSTRANGE_API_KEY)
    },
    server: {
      proxy: {
        '/nanonets': {
          target: 'https://extraction-api.nanonets.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/nanonets/, '')
        }
      }
    }
  }
})
