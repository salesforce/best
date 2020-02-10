import { AgentConfig, RemoteHubConfig } from '@best/types';

const AGENT_CONFIG = process.env.AGENT_CONFIG ? JSON.parse(process.env.AGENT_CONFIG): {};
const AGENT_URI = process.env.AGENT_HOST;
const AGENT_RUNNER = process.env.AGENT_RUNNER;
const AGENT_AUTH_TOKEN = process.env.AGENT_AUTH_TOKEN;

const HUB_CONFIG = process.env.HUB_CONFIG ? JSON.parse(process.env.HUB_CONFIG): {};
const HUB_URI = process.env.HUB_URI;
const HUB_AUTH_TOKEN = process.env.HUB_AUTH_TOKEN;

function normalizeArgOptions(argv: string[]): any {
    let arg;
    const normalizedArgs: any = {};
    while((arg = argv.shift()) !== undefined) {
        if (arg.startsWith('--')) {
            if (arg.includes('=')) {
                const [key, value] = arg.split('=');
                normalizedArgs[key.slice(2)] = value;
            } else {
                normalizedArgs[arg.slice(2)] = argv.shift();
            }
        }
    }

    return normalizedArgs;
}

const argv = normalizeArgOptions(process.argv.slice(2));

export function getAgentConfig(): AgentConfig {
    return {
        ...AGENT_CONFIG,
        uri: AGENT_URI || AGENT_CONFIG.uri,
        runner: argv.runner || AGENT_RUNNER || AGENT_CONFIG.runner,
        authToken: argv.authToken || AGENT_AUTH_TOKEN || AGENT_CONFIG.authToken
    };
}

export function getHubConfig(): RemoteHubConfig {
    return {
        ...HUB_CONFIG,
        uri: argv.hubUri || HUB_URI || HUB_CONFIG.uri,
        authToken: argv.hubAuthToken || HUB_AUTH_TOKEN || HUB_CONFIG.authToken
    };
}
