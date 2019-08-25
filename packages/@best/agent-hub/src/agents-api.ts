/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import {Application, NextFunction, Request, Response} from "express";
import {AgentManager} from "./AgentManager";
import {Agent, AgentStatus, AgentConfig} from "./Agent";
import AgentLogger from "@best/agent-logger";

function authenticateAgentApi(tokenSecret: string, req: Request, res: Response, next: NextFunction) {
    if (req.path.startsWith('/api/v1')) {
        if (req.headers.authorization !== tokenSecret) {
            return res.status(403).send({
                success: 'false',
                message: 'Authentication error: Invalid token'
            });
        }

        next();
    } else {
        next();
    }
}

function validateSpec(maybeSpecObject: any): boolean {
    if (!maybeSpecObject.browser || !maybeSpecObject.version) {
        throw new Error('Invalid browser specification. Must contain "browser" and "version" properties');
    }

    return true;
}

function normalizeAndValidateAgentConfig(rawAgentConfig: any): AgentConfig {
    const { host, options, spec: specConfig, remoteRunner, remoteRunnerConfig } = rawAgentConfig;
    if (!host) {
        throw new Error('Host for Agent must be provided');
    }

    if (!remoteRunner) {
        throw new Error('Remote runner must be provided');
    }

    const specs = Array.isArray(specConfig) ? specConfig : [specConfig];
    specs.forEach(validateSpec);

    return {
        host,
        options,
        specs,
        remoteRunner,
        remoteRunnerConfig
    };
}

function addAgentToHub(agentManager: AgentManager, logger: AgentLogger, req: Request, res: Response) {
    const agentConfig = normalizeAndValidateAgentConfig(req.body);
    const agent = new Agent(agentConfig, logger);
    agent.status = AgentStatus.Offline;

    agentManager.addAgent(agent);

    agent.status = AgentStatus.Idle;

    logger.info('', 'agent added', [agentConfig.host, agentConfig.specs]);

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

export function configureAgentsApi(app: Application, agentManager: AgentManager, logger: AgentLogger, tokenSecret: string) {
    app.use(authenticateAgentApi.bind(null, tokenSecret));

    app.post('/api/v1/agents', addAgentToHub.bind(null, agentManager, logger));
    app.get('/api/v1/agent-ping', pingByAgent.bind(null, agentManager));
}
