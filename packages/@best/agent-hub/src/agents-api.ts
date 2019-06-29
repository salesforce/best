import {Application, NextFunction, Request, Response} from "express";
import * as jwt from "jsonwebtoken";
import {AgentManager} from "./AgentManager";
import {Agent, AgentStatus} from "./Agent";

function authenticateAgentApi(tokenSecret: string, req: Request, res: Response, next: NextFunction) {
    if (req.path.startsWith('/api/v1')) {
        jwt.verify(req.headers.authorization || '', tokenSecret, (err: Error, payload: any) => {
            if (err) {
                return res.status(403).send({
                    success: 'false',
                    message: 'Authentication error: ' + err.message
                });
            } else if (payload.scope !== 'agent') {
                return res.status(403).send({
                    success: 'false',
                    message: 'Authentication error: Invalid token'
                });
            }

            next();
        });
    } else {
        next();
    }
}

function addAgentToHub(agentManager: AgentManager, req: Request, res: Response) {
    // @todo: validate payload.
    const agentConfig = {
        host: req.body.host,
        options: req.body.options,
        spec: req.body.spec,
        remoteRunner: req.body.remoteRunner,
        remoteRunnerConfig: req.body.remoteRunnerConfig
    };

    const agent = new Agent(agentConfig);

    agentManager.addAgent(agent);

    console.log('Added agent with host and spec: ', agentConfig.host, JSON.stringify(agentConfig.spec));

    return res.status(201).send({
        success: 'true',
        message: 'Agent subscribed successfully'
    });
}

function pingByAgent(agentManager: AgentManager, req: Request, res: Response) {
    const agent: Agent | null = agentManager.getAgent(req.query.agent);

    if (agent && agent.status === AgentStatus.Offline) {
        agent.status = AgentStatus.Idle;
    }

    return res.status(200).send({
        success: 'true',
        agentStatus: agent === null ? 'disconnected' : 'connected'
    });
}

export function configureAgentsApi(app: Application, agentManager: AgentManager, tokenSecret: string) {
    app.use(authenticateAgentApi.bind(null, tokenSecret));

    app.post('/api/v1/agents', addAgentToHub.bind(null, agentManager));
    app.get('/api/v1/agent-ping', pingByAgent.bind(null, agentManager));
}
