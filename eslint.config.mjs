import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import svelteConfig from './svelte.config.js'

export default [
  js.configs.recommended,
  ...svelte.configs.recommended,
  {
    ignores: ['node_modules/*', 'dist/*'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: ['.svelte'], // Add support for additional file extensions, such as .svelte
        svelteConfig,
      },
    },
  },
  {
    rules: {
      // Override or add rule settings here.
    },
  }
]
