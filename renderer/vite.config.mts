import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
        port: 5173,
        proxy: {
            // During development, proxy /api to the Express backend
            // The port here matches what Electron prints on startup
            '/api': { target: 'http://localhost:3001', changeOrigin: true },
        },
    },
    build: {
        outDir: 'dist',
    },
})
