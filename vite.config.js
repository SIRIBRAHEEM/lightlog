import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so the built site works from any subpath,
// for example a GitHub Pages project site.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
})
