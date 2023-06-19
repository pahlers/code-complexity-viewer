import {defineConfig} from 'vite';

export default defineConfig({
    root: 'src',
    build: {
        sourcemap: true,
        manifest: true,
        outDir: '../dist',
    },
    assetsInclude: ['**/*.html']
});
