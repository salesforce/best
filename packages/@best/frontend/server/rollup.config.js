import lwc from '@lwc/rollup-plugin';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';

export const rollupConfig = {
    input: '../src/index.js',
    output: {
        file: '../dist/bundle.js',
        format: 'iife'
    },
    plugins: [
        replace({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        lwc(),
        resolve(),
        commonjs(),
        terser()
    ],
};