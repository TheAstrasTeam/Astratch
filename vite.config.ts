import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  css: {
    modules:{
      scopeBehaviour: 'local',
      generateScopedName: '[name]_[local]_[hash:base64:5]',
      localsConvention: 'camelCaseOnly',
    }
  }
})
