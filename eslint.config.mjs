import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      '.next/**',
      '**/.next/**',
      '.claude/**',
      // Semua distDir alternatif (.next-local, .next-local-dev, .next-stale-*).
      '.next-*/**',
      '.recovery-residual-*/**',
      '.codex-remote-attachments/**',
      'node_modules/**',
      'public/**',
      'Testing/**',
      'verification/**',
    ],
  },
]

export default eslintConfig
