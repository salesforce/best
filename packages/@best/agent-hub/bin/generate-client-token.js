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
    .describe('t', 'Time to live for the token in zeit/ms (check https://github.com/zeit/ms). For clients default is 30 days, for agents 180 days.')
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
let ttl =  argv.ttl || '30 days';

if (argv.agent) {
    payload.scope = 'agent';
    ttl = argv.ttl || '180 days';
}

// nothing to do for client since has the defaults.

const jwt = require('jsonwebtoken');

const token = jwt.sign(
    payload,
    argv.secret,
    { expiresIn: ttl }
);

console.log(token);
