/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import json2md from 'json2md';
import {EnvironmentConfig} from "@best/types";

const ENV_TEXT = 'Benchmark Environment';

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function formatEnvironment(env: EnvironmentConfig) {
    const jsonMd = Object.keys(env)
        .sort()
        .reduce(
            (md:any, k1: string) => {
                const nKey = capitalizeFirstLetter(k1);
                const value = env[k1 as keyof EnvironmentConfig];
                md.push({ h2: nKey });
                if (typeof value === 'string') {
                    md.push({ p: value });
                } else if (Array.isArray(value)) {
                    md.push({ ul: value });
                } else {
                    Object.keys(value).forEach(k2 => {
                        const subKey = capitalizeFirstLetter(k2);
                        const subValue = value[k2 as keyof typeof value];
                        if (typeof subValue === 'string') {
                            md.push({ h3: subKey }, { p: subValue });
                        } else if (Array.isArray(subValue)) {
                            md.push({ h3: subKey }, { ul: subValue });
                        } else {
                            const rows = Object.entries(subValue).map(row =>
                                row.map((item: any) => (item ? item.toString() : '-')),
                            );

                            md.push({ h3: subKey });
                            md.push({
                                table: {
                                    headers: [`${subKey} property`, 'Value'],
                                    rows,
                                },
                            });
                        }
                    });
                }
                return md;
            },
            [{ h1: ENV_TEXT }],
        );

    jsonMd.push(
        { h2: 'JSON' },
        {
            code: {
                language: 'json',
                content: JSON.stringify(env, null, '  '),
            },
        },
    );
    return json2md(jsonMd);
}
