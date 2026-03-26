import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
// ✅ Required for GitHub Pages deployment
base: '/TextScan-PDF-Auditor/',

plugins: [react(), tailwindcss()],

resolve: {
alias: {
'@': path.resolve(__dirname, '.'),
},
},

server: {
// HMR control (kept from your config)
hmr: process.env.DISABLE_HMR !== 'true',
},
});
