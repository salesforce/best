/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import axios from "axios";

export interface HubConfig {
    hub: {
        host: string,
        authToken: string,
        pingTimeout: number,
    },
    agentConfig: {
        spec: {
            browser: string,
            version: string
        },
        host: string,
        options: { path: string },
        remoteRunner: string,
        remoteRunnerConfig: any,
    },

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

async function connectToHub(hubConfig: HubConfig): Promise<boolean> {
    console.log('Trying to register in hub: ', hubConfig.hub.host);
    const response = await axios.post(
        `${hubConfig.hub.host}/api/v1/agents`,
        hubConfig.agentConfig,
        {
            headers: {
                'Authorization': hubConfig.hub.authToken
            }
        }
    );

    if (response.status === 201) {
        console.log('Successfully registered with hub: ', hubConfig.hub.host);
    }

    return response.status === 201;
}

export async function registerWithHub(hubConfig: HubConfig) {
    const pingTimeout = hubConfig.hub.pingTimeout || 30000;
    let keepPing = true;
    try {
        const agentStatus = await pingHub(hubConfig.hub.host, hubConfig.hub.authToken, hubConfig.agentConfig.host);

        if (agentStatus !== 'connected') {
            keepPing = await connectToHub(hubConfig);

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
