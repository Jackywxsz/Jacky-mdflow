import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(
  globalIgnores([
    'node_modules',
    'dist',
    'esbuild.config.mjs',
    'version-bump.mjs',
    'versions.json',
    'main.js',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
  ]),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mts', 'manifest.json'],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.json'],
      },
    },
  },
  ...obsidianmd.configs.recommended,
  {
    files: [
      'src/exporters/rednote-exporter.ts',
      'src/exporters/wechat-exporter.ts',
      'src/exporters/x-exporter.ts',
      'src/themes/theme-manager.ts',
    ],
    rules: {
      // These modules generate portable HTML for external publishing targets.
      // Inline styles and inert HTML parsing are part of the exported artifact.
      'obsidianmd/no-static-styles-assignment': 'off',
      'no-unsanitized/property': 'off',
      '@microsoft/sdl/no-inner-html': 'off',
    },
  },
);
