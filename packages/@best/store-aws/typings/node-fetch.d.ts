declare module 'node-fetch' {
    export default function fetch(url: string): Promise<Response>;
}
