import express from "express";
import { Server } from "http";
import { runAgent } from "../agent-service";
const PORT = process.env.port || 5000;

export function run(maybeArgv) {
    const app = express();
    const server = Server(app);
    server.listen(PORT);

    app.get('/', (req, res) => res.send('BEST agent running!'));
    runAgent(server);
    process.stdout.write(`Best agent Listening in port ${PORT}... \n`);
}
