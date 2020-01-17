/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/


import { StatsManager } from '../StatsManager'
import Monitor, { MonitorEvent } from './Monitor';


export enum CloudProvider {
    AWS = "AMAZON_WEB_SERVICE"
}

export interface AutoScaleConfig {
    cloudProvider: CloudProvider,
    scaleThreshold: number,
    opts?: {[key: string]: any};
}

export default abstract class AutoScale {
    abstract onQueueIncrease(stats: {old: number, new: number, delta: number}) : void;
    abstract onQueueDecrease(stats: {old: number, new: number, delta: number}) : void;
    abstract onAgentAdded(stats: {old: number, new: number, delta: number}) : void;
    abstract onAgentRemoved(stats: {old: number, new: number, delta: number}) : void;
    abstract onAgentAllIdle(stats: {old: number, new: number, delta: number}): void;

    _config: AutoScaleConfig;
    _statsManager: StatsManager;
    _monitor?: Monitor;

    constructor(config: AutoScaleConfig, statsManager: StatsManager) {
        this._config = config;
        this._statsManager = statsManager;
    }

    initialize() {
        this._monitor = new Monitor(this._statsManager);
        this._monitor.initialize()
            .on(MonitorEvent.QUEUE_INCREASED, this.onQueueIncrease.bind(this))
            .on(MonitorEvent.QUEUE_DECREASED, this.onQueueDecrease.bind(this))
            .on(MonitorEvent.AGENT_ADDED, this.onAgentAdded.bind(this))
            .on(MonitorEvent.AGENT_REMOVED, this.onAgentRemoved.bind(this))
            .on(MonitorEvent.AGENT_ALL_IDLE, this.onAgentAllIdle.bind(this));
    }

    static factory(config: AutoScaleConfig, statsManager: StatsManager) : AutoScale {

        let autoScale: any = null, ctor;
        switch (config.cloudProvider) {
            case CloudProvider.AWS:
                ctor = require('../autoscale-aws/AWSAutoScale').default;
                console.log(ctor);
                autoScale = new ctor(config, statsManager);
                break;
            default:
                throw new Error("Invalid Cloud Provider");
        }

        return autoScale;
    }
}
