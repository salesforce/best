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
    const response = await axios.post(
        `${hubConfig.hub.host}/api/v1/agents`,
        hubConfig.agentConfig,
        {
            headers: {
                'Authorization': hubConfig.hub.authToken
            }
        }
    );

    return response.status === 201;
}

export async function registerWithHub(hubConfig: HubConfig) {
    let connectedToHub = false;

    try {
        console.log('Trying to register in hub: ', hubConfig.hub.host);
        const agentStatus = await pingHub(hubConfig.hub.host, hubConfig.hub.authToken, hubConfig.agentConfig.host);

        if (agentStatus === 'disconnected') {
            connectedToHub = await connectToHub(hubConfig);
        }

        if (connectedToHub) {
            setTimeout(registerWithHub.bind(null, hubConfig), hubConfig.hub.pingTimeout);
        } else {
            console.log('Error registering to hub, suspending hub registration.');
        }
    } catch (error) {
        console.log('Error connecting the hub: ', error.message);
        if (error.response && error.response.status === 403) {
            console.log('Invalid auth credentials, suspending registration with hub');
        } else {
            console.log(`Retrying in ${hubConfig.hub.pingTimeout} ms`);
            setTimeout(registerWithHub.bind(null, hubConfig), hubConfig.hub.pingTimeout);
        }
    }
}
