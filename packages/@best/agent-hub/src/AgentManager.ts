import { EventEmitter } from "events";
import { Agent, AgentConfig, AgentStatus } from "./Agent";
import BenchmarkJob from "./BenchmarkJob";

interface AgentConnection {
    host: string,
    options: {
        path: string
    }
}
interface AgentCategory {
    category: string,
    remoteRunner: string,
    remoteRunnerConfig?: object,
    agents: AgentConnection[]
}

class AgentManager extends EventEmitter{
    private agents: Agent[] = [];

    constructor(agents: Agent[]) {
        super();
        this.agents = agents;

        this.agents.forEach((agent: Agent) => {
            agent.on('statuschanged', ({ newValue }: { newValue: AgentStatus }) => {
                if (newValue === AgentStatus.Idle) {
                    this.emit('idleagent', agent);
                }
            })
        });
    }

    getIdleAgentForJob(job: BenchmarkJob): Agent | null {
        const idleAgentsForJob = this.agents.filter(agent => agent.isIdle() && agent.canRunJob(job));

        return idleAgentsForJob.length ? idleAgentsForJob[0] : null;
    }

    existAgentForJob(job: BenchmarkJob): boolean {
        return this.agents.some((agent: Agent) => agent.canRunJob(job));
    }
}
export function createAgentManager(hubConfig: AgentCategory[]) {
    const agents: Agent[] = [];
    hubConfig.forEach((categoryConfig: AgentCategory) => {
        const { category, remoteRunner, remoteRunnerConfig = {} } = categoryConfig;

        categoryConfig.agents.forEach((agentConnection: AgentConnection) => {
            const agentConfig : AgentConfig = Object.assign({category, remoteRunner, remoteRunnerConfig}, agentConnection);

            agents.push(new Agent(agentConfig));
        });
    });

    return new AgentManager(agents);
}
