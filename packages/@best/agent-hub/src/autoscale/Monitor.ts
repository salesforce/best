/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { StatsManager, StatsEvents } from '../StatsManager';
import { EventEmitter } from 'events';

export enum MonitorEvent {
    QUEUE_DECREASED = "queue decreased",
    QUEUE_INCREASED = "queue increased",
    AGENT_REMOVED = "agent removed",
    AGENT_ADDED = "agent added",
    AGENT_ALL_IDLE = "agent all idle",
}

export default class Monitor extends EventEmitter {

    _statsManager: StatsManager;
    _prevAgentStats: any;
    _prevJobStats: any;

    constructor(statsManager: StatsManager) {
        super();
        this._statsManager = statsManager;
    }

    initialize() {
        this._statsManager.on(StatsEvents.STATS_UPDATE, this._onStatsUpdate.bind(this));

        return this;
    }

    _onStatsUpdate(stats: any) {
        console.log("[Statistic]", stats);
        const hubStats = stats.hub;
        const agentStats = stats.agentManager;

        this._monitorJobStats(hubStats.pendingJobCount);
        this._monitorAgentStats(agentStats);
    }

    _monitorJobStats(jobStats: any) {
        const delta = this._prevJobStats - jobStats;
        if (delta === 0) {
            return;
        }

        this.emit(delta > 0 ? MonitorEvent.QUEUE_DECREASED : MonitorEvent.QUEUE_INCREASED, {
            old: this._prevJobStats,
            new: jobStats,
            delta: Math.abs(delta)
        });

        this._prevJobStats = jobStats;
    }

    _monitorAgentStats(agentStats: any) {
        if(!agentStats) return;

        console.log(agentStats);
        if (!this._prevAgentStats) {
            // initialize our previous data point.
            this._prevAgentStats = agentStats;
        }

        const agentCount = agentStats.agents;
        const agentCountDelta = this._prevAgentStats.agents - agentCount;

        if (agentCountDelta !== 0) {
            this.emit(agentCountDelta > 0 ? MonitorEvent.AGENT_REMOVED : MonitorEvent.AGENT_ADDED, {
                old: this._prevAgentStats.agents,
                new: agentCount,
                delta: Math.abs(agentCountDelta)
            });
        }

        if (agentStats.active === 0) {
            this.emit(MonitorEvent.AGENT_ALL_IDLE, {
                old: this._prevAgentStats.active,
                new: agentStats.active,
                delta: Math.abs(this._prevAgentStats.active - agentStats.active)
            })
        }

        this._prevAgentStats = agentStats;
    }
}
