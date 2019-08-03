#!/usr/bin/env node

const argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('gen-token', 'Generates hub access tokens')
    .example('$0 gen -s hubSecret -c', 'Generates a key for a client')
    .alias('s', 'secret')
    .alias('c', 'client')
    .alias('a', 'agent')
    .alias('t', 'ttl')
    .nargs('s', 1)
    .describe('s', 'Hub secret')
    .describe('c', 'If this key is meant to be used by a client accessing the hub. Is exclusive with option "a". Defaults true')
    .describe('a', 'If this key is meant to be used by an agent accessing the hub')
    .describe('t', 'Time to live for the token in zeit/ms (check https://github.com/zeit/ms). By default, tokens do not expire.')
    .demandOption(['s'])
    .boolean('c').default('c', true)
    .boolean('a').default('a', false)
    .string('t')
    .help('h')
    .alias('h', 'help')
    .epilog('copyright 2019')
    .argv;

const payload = {
    scope: 'client'
};

const ttl = argv.ttl;

if (argv.agent) {
    payload.scope = 'agent';
}

// nothing to do for client since has the defaults.

const jwt = require('jsonwebtoken');

const options = ttl ? { expiresIn : ttl } : {};

const token = jwt.sign(
    payload,
    argv.secret,
    options
);

console.log(token);
