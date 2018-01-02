import express from "express";
import { Server } from "http";
import { runAgent } from "../agent-service";
const PORT = process.env.port || 5000;

export function run(maybeArgv) {
    const app = express();
    const server = Server(app);
    server.listen(PORT);

    app.get('/', (req, res) => res.send('BEST agent running!'));
    process.stdout.write(`Best agent listening in port ${PORT}... \n\n`);

    runAgent(server);
}
