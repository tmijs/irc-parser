import { build } from 'esbuild';

const entryFile = 'src/index.ts';

/** @typedef {import('esbuild').BuildOptions} BuildOptions */

/** @type {BuildOptions} */
const opts = {
	entryPoints: { 'index': entryFile },
	bundle: true,
	sourcemap: true,
	sourcesContent: false,
	target: 'es2022',
	tsconfig: 'tsconfig.json',
	outdir: 'dist',
	packages: 'external',
	platform: 'neutral',
};

/** @type {BuildOptions} */
const esm = {
	format: 'esm',
	outExtension: { '.js': '.mjs' },
};

/** @type {BuildOptions} */
const cjs = {
	format: 'cjs',
	outExtension: { '.js': '.cjs' },
};

build({ ...opts, ...esm });

build({ ...opts, ...cjs });