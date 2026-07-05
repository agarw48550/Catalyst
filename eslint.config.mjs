import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**', 'coverage/**'],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx}', 'vitest.setup.ts'],
    languageOptions: {
      globals: {
        afterEach: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        vi: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        FormData: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        process: 'readonly',
      },
    },
  },
]

export default config
