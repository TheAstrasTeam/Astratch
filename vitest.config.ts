import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    root: '.',
    plugins: [react()],
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
    },
});
