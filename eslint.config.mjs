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
      '.next-stale-*/**',
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
