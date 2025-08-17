import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { tmpdir } from 'os';
import { devLogger } from '@meituan-nocode/vite-plugin-dev-logger';
import {
  devHtmlTransformer,
  prodHtmlTransformer,
} from '@meituan-nocode/vite-plugin-nocode-html-transformer';
import react from '@vitejs/plugin-react';

const CHAT_VARIABLE = process.env.CHAT_VARIABLE || '';
const PUBLIC_PATH = process.env.PUBLIC_PATH || '';

const isProdEnv = process.env.NODE_ENV === 'production';
// 为Cloudflare Pages优化：使用相对路径
const publicPath = isProdEnv ? './' : (PUBLIC_PATH + '/');
const outDir = 'dist'; // Cloudflare Pages默认期望dist目录
const plugins = isProdEnv
  ? CHAT_VARIABLE
    ? [react(), prodHtmlTransformer(CHAT_VARIABLE)]
    : [react()]
  : [
      devLogger({
        dirname: resolve(tmpdir(), '.nocode-dev-logs'),
        maxFiles: '3d',
      }),
      react(),
      devHtmlTransformer(CHAT_VARIABLE),
    ];

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '::',
    port: '8080',
    hmr: {
      overlay: false,
    },
  },
  plugins,
  base: publicPath,
  build: {
    outDir,
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
      {
        find: 'lib',
        replacement: resolve(__dirname, 'lib'),
      },
    ],
  },
});
