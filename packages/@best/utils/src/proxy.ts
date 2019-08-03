import HttpsProxyAgent from 'https-proxy-agent';

// NOTE: the proxy needs to be in the form of: "http://0.0.0.0:0000"
const PROXY = process.env.http_proxy || process.env.HTTP_PROXY;

export const proxifiedSocketOptions = (options: any): SocketIOClient.ConnectOpts => {
    if (PROXY) {
        return {
            ...options,
            agent: new HttpsProxyAgent(PROXY) as any,
            timeout: 50000,
        }
    }

    return options;
}
