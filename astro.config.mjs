import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sparshraj.me',
  output: 'static',
  trailingSlash: 'never',
  build: { inlineStylesheets: 'always', format: 'file' },
  compressHTML: true,
});
