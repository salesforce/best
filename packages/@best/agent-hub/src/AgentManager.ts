import { EventEmitter } from "events";
import { Agent, AgentConfig, AgentStatus } from "./Agent";
import BenchmarkJob from "./BenchmarkJob";

interface AgentConnection {
    host: string,
    options: {
        path: string
    }
}

export interface AgentCategory {
    category: string,
    remoteRunner: string,
    remoteRunnerConfig?: object,
    agents: AgentConnection[]
}

export class AgentManager extends EventEmitter {
    private agents: Agent[] = [];

    constructor(agents: Agent[]) {
        super();
        this.agents = agents;

        this.agents.forEach((agent: Agent) => {
            agent.on('status-changed', ({ newValue }: { newValue: AgentStatus }) => {
                if (newValue === AgentStatus.Idle) {
                    this.emit('idle-agent', agent);
                }
            })
        });
    }

    getIdleAgentForJob(job: BenchmarkJob): Agent | null {
        // @todo: organize Agents by category.
        const idleAgentsForJob = this.agents.filter(agent => agent.isIdle() && agent.canRunJob(job));

        return idleAgentsForJob.length ? idleAgentsForJob[0] : null;
    }

    existAgentForJob(job: BenchmarkJob): boolean {
        return this.agents.some((agent: Agent) => agent.canRunJob(job));
    }
}

export function createAgentManager(categoriesConfig: AgentCategory[]): AgentManager {
    const agents: Agent[] = [];
    categoriesConfig.forEach((categoryConfig: AgentCategory) => {
        const { category, remoteRunner, remoteRunnerConfig = {} } = categoryConfig;

        categoryConfig.agents.forEach((agentConnection: AgentConnection) => {
            const agentConfig : AgentConfig = Object.assign({category, remoteRunner, remoteRunnerConfig}, agentConnection);

            agents.push(new Agent(agentConfig));
        });
    });

    return new AgentManager(agents);
}