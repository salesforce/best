/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { EventEmitter } from "events";
import { HubApplication, HubStatus } from "./HubApplication";
import { AgentManager, AgentManagerStatus } from "./AgentManager";
import AgentLogger from "@best/agent-logger";


const THROTTLE_WAIT = 1000;

enum ThrottleKey {
    ALL_EVENT = 1,
    CLIENT_EVENT,
    AGENT_STATUS_EVENT
}

export enum StatsEvents {
    STATS_UPDATE = "stats update",
    HUB_STATS_UPDATE = "stats hub update",
    AGENT_MANAGER_STATS_UPDATE = "stats agentmanager update"
}

export interface Stats {
    hub : HubStatus,
    agentManager: AgentManagerStatus
}

/**
 * Listen to log events to build and manage statistics about the system.
 */
export class StatsManager extends EventEmitter {
    private _app: HubApplication;
    private _agentManager: AgentManager;
    private _logger: AgentLogger;
    private _stats : Stats;

    private _pendingEvents = new Set<ThrottleKey>();

    constructor(app: HubApplication, agentManager: AgentManager, logger: AgentLogger) {
        super();
        this._app = app;
        this._agentManager = agentManager;
        this._logger = logger;

        // initalize our stats with hub status and AgentManager status.
        this._stats = {
            hub: this._app.getLoadStatus(),
            agentManager: this._agentManager.getAgentsStatus()
        }

        this.registerExternalEvents();
        this.registerInternalEvents();
    }

    /**
     * Listening to all external events of interest.
     */
    private registerExternalEvents() {
        this._logger.on("CLIENT_CONNECTED", (packet: any) => {
            this.handleClientEvent()
        });
        this._logger.on("CLIENT_DISCONNECTED", (packet: any) => {
            this.handleClientEvent()
        });
        this._logger.on("PENDING_JOB_CHANGED", (packet: any) => {
            this.handleClientEvent()
        });

        this._logger.on("AGENT_STATUS_CHANGED", (packet: any) => {
            this.handleAgentStatusEvent();
        });
    }

    /**
     * Listen to all internally emitted events to emit the full stats.
     */
    private registerInternalEvents() {
        this.on(StatsEvents.HUB_STATS_UPDATE, (packet: any) => {
            this.emitFullStats();
        })

        this.on(StatsEvents.AGENT_MANAGER_STATS_UPDATE, (packet: any) => {
            this.emitFullStats();
        });
    }


    private throttle(key: ThrottleKey, callback: () => any ) {
        if (!this._pendingEvents.has(key)) {
            this._pendingEvents.add(key);
            setTimeout(() => {
                callback();
                this._pendingEvents.delete(key);
            }, THROTTLE_WAIT)
        }
    }

    /**
     * emit the full stats
     */
    private emitFullStats() {
        this.throttle(ThrottleKey.ALL_EVENT, () => {
            this.emit(StatsEvents.STATS_UPDATE, this._stats);
        });
    }

    /**
     * get hub status and emit
     */
    private handleClientEvent() {
        this.throttle(ThrottleKey.CLIENT_EVENT, () => {
            this._stats.hub = this._app.getLoadStatus();
            this.emit(StatsEvents.HUB_STATS_UPDATE, this._stats.hub);
        });
    }

    /**
     * get agentManager status and emit
     */
    private handleAgentStatusEvent() {
        this.throttle(ThrottleKey.AGENT_STATUS_EVENT, () => {
            this._stats.agentManager = this._agentManager.getAgentsStatus();
            this.emit(StatsEvents.AGENT_MANAGER_STATS_UPDATE, this._stats.agentManager);
        });
    }

    // Override
    emit(event: string | symbol, ...args: any[]): boolean {
        this._logger.event("StatsManager", event.toString(), ...args);

        return super.emit(event, ...args);
    }
}

export function createStatsManager(app: HubApplication, agentManager: AgentManager, logger: AgentLogger): StatsManager {
    return new StatsManager(app, agentManager, logger);
}