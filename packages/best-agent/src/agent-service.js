import SocketIO from "socket.io";
import AgentBroker from "./broker";

let BROKER;

export async function runAgent(server, opts = {}) {
    const socketServer = SocketIO(server, { path: '/best' });
    BROKER = new AgentBroker(socketServer);
}

export async function reset() {
    return BROKER.reset();
}
export async function getState() {
    return BROKER.getState();
}

export default { runAgent, reset, getState };
