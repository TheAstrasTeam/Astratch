// @ts-expect-error 没有提供注解
import { defineConfig } from 'vite'
// @ts-expect-error 没有提供注解
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
// @ts-expect-error 没有提供注解
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
