import path from 'path';

import lwc from '@lwc/rollup-plugin';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';
import { bestMocker, MockerOptions } from './mocker'
import { InputOptions, OutputOptions } from 'rollup';

const rollupConfig: {
    inputOptions: (options: MockerOptions) => InputOptions,
    outputOptions: () => OutputOptions
} = {
    inputOptions: (options) => ({
        input: path.resolve(__dirname, '../../src/index.js'),
        plugins: [
            bestMocker(options),
            replace({
                'process.env.NODE_ENV': JSON.stringify('production')
            }),
            lwc(),
            resolve(),
            commonjs(),
            terser()
        ]
    }),
    outputOptions: () => ({
        file: path.resolve(__dirname, '../../dist/static/bundle.js'),
        format: 'iife'
    })
}

export default rollupConfig;