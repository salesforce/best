import HttpsProxyAgent from 'https-proxy-agent';

export const proxifiedOptions = (options: any): SocketIOClient.ConnectOpts => {
    if (options.proxy) {
        return {
            ...options,
            agent: new HttpsProxyAgent(options.proxy) as any,
            // TODO: figure out if we need these options
            // secure: true,
            rejectUnauthorized: false,
            // transports: ['websocket']
            // reconnect: true
        }
    }

    return options;
}
