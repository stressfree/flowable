import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

function fixIdsDefaultExport() {
  return {
    name: 'fix-ids-default-export',
    transform(code: string, id: string) {
      if (
        (id.includes('bpmn-js') || id.includes('cmmn-js') || id.includes('dmn-js')) &&
        !id.includes('dmn-js-shared') &&
        !id.includes('dmn-js-decision-table') &&
        !id.includes('dmn-js-drd') &&
        !id.includes('dmn-js-literal-expression') &&
        !id.includes('dmn-js-boxed-expression')
      ) {
        return code.replace(
          /export\s*\{\s*default\s+as\s+(\w+)\s*\}\s*from\s*['"]\.\/(\w+)['"]/g,
          'export { $1 as default } from "./$2"'
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), fixIdsDefaultExport()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['bpmn-js', 'cmmn-js', 'dmn-js'],
  },
});
