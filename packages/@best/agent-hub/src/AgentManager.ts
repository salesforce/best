import { EventEmitter } from "events";
import { Agent, AgentConfig, AgentStatus } from "./Agent";
import BenchmarkJob from "./BenchmarkJob";

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
}
export function createAgentManager(agentsConfig: AgentConfig[]) {
    const agents = agentsConfig.map((agentConfig) => new Agent(agentConfig));

    return new AgentManager(agents);
}
