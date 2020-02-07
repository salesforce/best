/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import axios from "axios";

export interface Spec {
    browser: string;
    version: string;
}

export interface HubConfig {
    uri: string;
    authToken: string;
    pingTimeout: number;
}

export interface AgentConfig {
    uri: string;
    options: { path: string };
    runner: string;
}

async function pingHub(hubHost: string, hubToken: string, agentHost: string): Promise<string> {
    const response = await axios.get(
        `${hubHost}/api/v1/agent-ping`, {
            headers: {
                'Authorization': hubToken
            },
            params: {
                'agent': agentHost
            }
        });

    return response.data.agentStatus;
}

async function connectToHub(hubConfig: HubConfig, agentConfig: AgentConfig): Promise<boolean> {
    console.log('Trying to register in hub: ', hubConfig.uri);
    const response = await axios.post(
        `${hubConfig.uri}/api/v1/agents`,
        agentConfig,
        {
            headers: { 'Authorization': hubConfig.authToken }
        }
    );

    if (response.status === 201) {
        console.log('Successfully registered with hub: ', hubConfig.uri);
    }

    return response.status === 201;
}

export async function registerWithHub(hubConfig: HubConfig, agentConfig: AgentConfig) {
    const pingTimeout = hubConfig.pingTimeout || 30000;
    let keepPing = true;
    try {
        const agentStatus = await pingHub(hubConfig.uri, hubConfig.authToken, agentConfig.uri);

        if (agentStatus !== 'connected') {
            keepPing = await connectToHub(hubConfig, agentConfig);

            if (!keepPing) {
                console.log('Error connecting to hub, suspending hub registration.');
            }
        }
    } catch (error) {
        console.log('Error connecting the hub: ', error.message);

        if (error.response && error.response.status === 403) {
            keepPing = false;
            console.log('Invalid auth credentials, suspending registration with hub');
        } else {
            console.log(`Retrying in ${pingTimeout} ms`);
        }
    }

    if (keepPing) {
        setTimeout(registerWithHub.bind(null, hubConfig), pingTimeout);
    }
}
