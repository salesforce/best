import { EventEmitter } from "events";
import {Agent, AgentConfig, AgentStatus, Spec} from "./Agent";
import BenchmarkJob from "./BenchmarkJob";

export class AgentManager extends EventEmitter {
    private agents: Agent[] = [];

    constructor(agents: Agent[]) {
        super();
        this.agents = agents;

        this.agents.forEach((agent: Agent) => this.addStatusChangeListener(agent));
    }

    getIdleAgentForJob(job: BenchmarkJob): Agent | null {
        // @todo: organize Agents by category.
        const idleAgentsForJob = this.agents.filter(agent => agent.isIdle() && agent.canRunJob(job.spec));

        return idleAgentsForJob.length ? idleAgentsForJob[0] : null;
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

    private addStatusChangeListener = (agent: Agent) => {
        agent.on('status-changed', ({ newValue }: { newValue: AgentStatus }) => {
            if (newValue === AgentStatus.Idle) {
                this.emit('idle-agent', agent);
            }
        });
    };

    getAgent(agentHost: string) {
        let i: number = 0;

        while (i < this.agents.length && this.agents[i].host !== agentHost) i++;

        return i < this.agents.length ? this.agents[i] : null;
    }
}

export function createAgentManager(agentsConfig: AgentConfig[]): AgentManager {
    const agents: Agent[] = agentsConfig.map((agentConfig: AgentConfig) => new Agent(agentConfig));

    return new AgentManager(agents);
}
