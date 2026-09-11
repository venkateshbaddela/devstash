import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env if present for environment variables in tests
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Ignore error if .env does not exist in environment
  }
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [
      'tests/unit/**/*.{test,spec}.ts',
      'src/actions/**/*.{test,spec}.ts',
      'src/lib/**/*.{test,spec}.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      'src/components/**',
      'src/app/**',
      '**/*.tsx',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './src'),
    },
  },
});
