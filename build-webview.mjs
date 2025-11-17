import * as esbuild from 'esbuild';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function build() {
    const ctx = await esbuild.context({
        entryPoints: ['webview-ui/index.tsx'],
        bundle: true,
        format: 'iife',
        outfile: 'out/webview.js',
        external: ['vscode'],
        platform: 'browser',
        target: 'es2020',
        minify: production,
        sourcemap: !production,
        logLevel: 'info',
        loader: {
            '.tsx': 'tsx',
            '.ts': 'ts'
        }
    });

    if (watch) {
        await ctx.watch();
        console.log('Watching for changes...');
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

build().catch(error => {
    console.error(error);
    process.exit(1);
});
