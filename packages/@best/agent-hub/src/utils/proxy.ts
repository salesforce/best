import HttpsProxyAgent from 'https-proxy-agent';
import { AgentConfig } from '../Agent';

export const proxifiedOptions = (config: AgentConfig): SocketIOClient.ConnectOpts => {
    if (config.options.proxy) {
        return {
            ...config.options,
            agent: new HttpsProxyAgent(config.options.proxy) as any,
            // TODO: figure out if we need these options
            // secure: true,
            // rejectUnauthorized: false,
            // reconnect: true
        }
    }

    return config.options;
}
