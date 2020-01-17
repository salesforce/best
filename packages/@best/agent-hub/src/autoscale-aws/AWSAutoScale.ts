/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import AutoScale, {AutoScaleConfig} from "../autoscale/AutoScale"
import { StatsManager } from "../StatsManager";
import AmazonWebServiceAPI, { AWSOptions } from "./AmazonWebServiceAPI";

const THROTTLE_KEY = Object.freeze({
    SCALE_UP: Symbol(1),
    SCALE_DOWN: Symbol(3),
    FETCH_AUTO_SCALING_GROUP: Symbol(3)
})

// milliseconds
const SCALE_DOWN_WAIT: number = Number(process.env.SCALE_DOWN_WAIT) || 60000;

// milliseconds
const THROTTLE_WAIT = 1000;

export default class AWSAutoScale extends AutoScale {

    _awsAPI: AmazonWebServiceAPI;
    _awsOpts: AWSOptions;
    _hubStats: any;
    _scaleDownTimeout?: NodeJS.Timeout;
    _scalingPolicy?: any;
    _pendingTasks: Set<Symbol>;


    constructor(config: AutoScaleConfig, statsManager: StatsManager) {
        super(config, statsManager);

        this._awsOpts = config.opts as unknown as AWSOptions;
        this._pendingTasks = new Set();

        // Check to see if the credential is already set in the environment variable
        if (!this.checkCredential()) {
            this.setCredentialFromEnvironmentVariable();
        }

        this._awsAPI = new AmazonWebServiceAPI(this._awsOpts);
    }

    checkCredential() {
        return this._awsOpts.accessKeyId && this._awsOpts.secretAccessKey;
    }

    setCredentialFromEnvironmentVariable() {
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            this._awsOpts.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
            this._awsOpts.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
        } else {
            throw "AWS Access Key and/or Secret Access Key are not part of the environment variables";
        }
    }

    async initialize() {
        super.initialize();

        await this.fetchAutoScalingGroupStatus();
    }

    async fetchAutoScalingGroupStatus() {
        return this._scalingPolicy = await this._awsAPI.getAutoScalingGroup();
    }

    _scheduledScaleDown() {
        if (!this._scaleDownTimeout) {
            this._scaleDownTimeout = setTimeout(() => {
                this._scaleDown();
                this._clearScheduledScaleDown();
            }, SCALE_DOWN_WAIT)
        }
    }

    _clearScheduledScaleDown() {
        if (this._scaleDownTimeout) {
            console.log("Clearing Scale Down Task");
            clearTimeout(this._scaleDownTimeout);
            this._scaleDownTimeout = undefined;
        }
    }

    _scaleUp() {
        this._throttle(THROTTLE_KEY.SCALE_UP, () => {
            if (this._hubStats) {
                const currentCapacity = this._scalingPolicy.DesiredCapacity;
                const desiredCapacity = Math.min(Math.ceil(this._hubStats.new/this._config.scaleThreshold), this._scalingPolicy.MaxSize);

                if (desiredCapacity > currentCapacity) {
                    this._scaleToDesiredCapacity(desiredCapacity);
                    console.log(`Scaling up from ${currentCapacity} to ${desiredCapacity} instances`);
                }
            } else {
                console.log("No Hub statistic data");
            }
        })
    }

    _scaleDown() {
        this._throttle(THROTTLE_KEY.SCALE_DOWN, () => {
            const currentCapacity = this._scalingPolicy.DesiredCapacity;
            const desiredCapacity = this._scalingPolicy.MinSize;

            if (desiredCapacity < currentCapacity) {
                this._scaleToDesiredCapacity(desiredCapacity);
                console.log(`Scaling down from ${currentCapacity} to ${desiredCapacity} instances`);
            }
        })
    }

    async _scaleToDesiredCapacity(desiredCapacity: number) {
        if (process.env.DRY_RUN) {
            console.log("DRY RUN")
            return;
        }

        await this._awsAPI.updateAutoScalingGroup({
            AutoScalingGroupName: this._awsOpts.autoScalingGroupName,
            DesiredCapacity: desiredCapacity
        });

        // fetch the autoScalingGroup directly
        await this.fetchAutoScalingGroupStatus();
        console.log(`Update ${this._awsOpts.autoScalingGroupName}
        group ${this._scalingPolicy.DesiredCapacity === desiredCapacity ?
            'succeeded' : 'failed'}. DesiredCapacity is now set to ${this._scalingPolicy.DesiredCapacity}.`);
    }

    _throttle(key: Symbol, callback: () => void) {
        if (!this._pendingTasks.has(key)) {
            this._pendingTasks.add(key);
            setTimeout(async () => {
                await callback();
                this._pendingTasks.delete(key);
            }, THROTTLE_WAIT)
        }
    }



    onQueueIncrease(stats: {old: number, new: number, delta: number}) : void {
        console.log("Queue Increased", stats)

        this._hubStats = stats;
        // We see increase in load, so cancel scaling down if any.
        this._clearScheduledScaleDown();
        this._scaleUp();
    }

    onQueueDecrease(stats: {old: number, new: number, delta: number}) : void {
        console.log("Queue Decreased", stats)
        this._hubStats = stats;
        if (stats.new === 0) {
            console.log(`Scheduling to scale down in ${SCALE_DOWN_WAIT/1000} seconds.`);
            this._scheduledScaleDown();

        } else {
            if (this._scaleDownTimeout) {
                console.log("Queue is not empty, delay de-scaling.");
                this._clearScheduledScaleDown();
            }
        }
    }

    onAgentAdded(stats: {old: number, new: number, delta: number}) : void {
      console.log("Agent Added", stats)

    }

    onAgentRemoved(stats: {old: number, new: number, delta: number}) : void {
        console.log("Agent Removed", stats)
    }

    onAgentAllIdle(stats: {old: number, new: number, delta: number}): void {
        console.log("Agent All Idle", stats)
    }
}
