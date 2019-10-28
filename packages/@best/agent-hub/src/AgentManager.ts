/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { EventEmitter } from "events";
import {Agent, AgentConfig, AgentStatus, Spec} from "./Agent";
import BenchmarkJob from "./BenchmarkJob";
import AgentLogger from "@best/agent-logger";

// Wait time 30 minutes
const REMOVE_OFFLINE_AGENT_WAIT = 1800000;

export interface AgentManagerStatus {
    agents: number
    active: number,
    idle: number,
    offline: number
}

export class AgentManager extends EventEmitter {
    private agents: Agent[] = [];

    constructor(agents: Agent[]) {
        super();
        this.agents = agents;

        this.agents.forEach((agent: Agent) => this.addStatusChangeListener(agent));
    }

    getIdleAgentForJob(job: BenchmarkJob): Agent | null {
        // @todo: organize Agents by category.
        return this.agents.find(agent => agent.isIdle() && agent.canRunJob(job.spec)) || null;
    }

    existAgentWithSpec(spec: Spec): boolean {
        return this.agents.some((agent: Agent) => agent.canRunJob(spec));
    }

    getIdleAgentsWithSpec(spec: Spec): Agent[] {
        return this.agents.filter(agent => agent.isIdle() && agent.canRunJob(spec));
    }

    getAgentsForSpec(spec: Spec): Agent[] {
        return this.agents.filter((agent: Agent) => agent.canRunJob(spec))
    }

    addAgent(agent: Agent) {
        //@todo: Validate that agent is not repeated
        this.agents.push(agent);
        this.addStatusChangeListener(agent);
    }

    removeAgent(agent: Agent) {
        // remove agent and emit event.
        this.emit("agent-removed", this.agents.splice(this.agents.indexOf(agent), 1));
    }

    removeAgentByHostname(agentHost: string) {
        const agent = this.getAgent(agentHost);
        if (agent !== null) {
            this.removeAgent(agent);
        }
    }

    private addStatusChangeListener = (agent: Agent) => {
        agent.on('status-changed', ({ newValue }: { newValue: AgentStatus }) => {
            if (newValue === AgentStatus.Idle) {
                this.emit('idle-agent', agent);
            } else if (newValue === AgentStatus.Offline) {
                setTimeout(() => {
                    // remove the agent after a specific amount of time if it remains offline.
                    if (agent.status === AgentStatus.Offline) {
                        this.removeAgent(agent);
                    }
                }, REMOVE_OFFLINE_AGENT_WAIT)
            }
        });
    };

    getAgent(agentHost: string): Agent | null {
        let i: number = 0;

        while (i < this.agents.length && this.agents[i].host !== agentHost) i++;

        return i < this.agents.length ? this.agents[i] : null;
    }

    getAgentsStatus() : AgentManagerStatus {
        const ret: AgentManagerStatus = {
            agents: this.agents.length,
            active: 0,
            idle: 0,
            offline: 0,
        }

        this.agents.forEach(agent => {
            switch(agent.status) {
                case AgentStatus.Idle:
                    ret.idle++;
                    break;
                case AgentStatus.Offline:
                    ret.offline++;
                    break;
                case AgentStatus.RunningJob:
                    ret.active++;
                    break;
            }
        })

        return ret;
    }
}

export function createAgentManager(agentsConfig: AgentConfig[], logger: AgentLogger): AgentManager {
    const agents: Agent[] = agentsConfig.map((agentConfig: AgentConfig) => new Agent(agentConfig, logger));

    return new AgentManager(agents);
}
