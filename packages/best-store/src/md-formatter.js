import json2md from 'json2md';

const ENV_TEXT = 'Benchmark Environment';

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function formatEnvironment(env) {
    const jsonMd = Object.keys(env)
        .sort()
        .reduce(
            (md, k1) => {
                const nKey = capitalizeFirstLetter(k1);
                const value = env[k1];
                md.push({ h2: nKey });
                if (typeof value === 'string') {
                    md.push({ p: value });
                } else if (Array.isArray(value)) {
                    md.push({ ul: value });
                } else {
                    Object.keys(value).forEach(k2 => {
                        const subKey = capitalizeFirstLetter(k2);
                        const subValue = value[k2];
                        if (typeof subValue === 'string') {
                            md.push({ h3: subKey }, { p: subValue });
                        } else if (Array.isArray(subValue)) {
                            md.push({ h3: subKey }, { ul: subValue });
                        } else {
                            const rows = Object.entries(subValue).map(row =>
                                row.map(item => (item ? item.toString() : '-')),
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
