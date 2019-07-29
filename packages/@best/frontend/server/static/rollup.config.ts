import path from 'path';

import lwc from '@lwc/rollup-plugin';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';
import { bestMocker, MockerOptions } from './mocker'
import * as rollup from 'rollup';
import { FrozenProjectConfig } from '@best/types';

export const buildRollupConfig = (projectConfig: FrozenProjectConfig): {
    inputOptions: (options: MockerOptions) => rollup.InputOptions;
    outputOptions: () => rollup.OutputOptions;
} => {
    return {
        inputOptions: (options): rollup.InputOptions => ({
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
        outputOptions: (): rollup.OutputOptions => ({
            file: path.resolve(projectConfig.benchmarkOutput, 'static/bundle.js'),
            format: 'iife'
        })
    }
}