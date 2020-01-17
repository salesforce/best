/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import AWS from 'aws-sdk';

export interface AWSOptions {
    region: string,
    autoScalingGroupName: string,
    accessKeyId: string,
    secretAccessKey: string
}

export default class AmazonWebServiceAPI {

    _autoScalingGroupName: string
    _autoScaling: any;
    _ec2: any;

    constructor(opt: AWSOptions) {

        AWS.config.update({region: opt.region});

        this._autoScalingGroupName = opt.autoScalingGroupName;
        this._autoScaling = new AWS.AutoScaling();
        this._ec2 = new AWS.EC2();
    }

    async getAutoScalingGroup() {
        const res = await this._autoScaling.describeAutoScalingGroups({AutoScalingGroupNames: [this._autoScalingGroupName]}).promise();
        return res.AutoScalingGroups[0];
    }

    async updateAutoScalingGroup(params: any) {
        return this._autoScaling.updateAutoScalingGroup(params).promise();
    }

    async getAgentInstances() {
        return this._ec2.describeInstances({
            Filters: [{
                Name: "tag:aws:autoscaling:groupName",
                Values: [this._autoScalingGroupName]
            }]
        }).promise();
    }

    async getHubInstance() {
        return this._ec2.describeInstances({
            Filters: [{
                Name: "tag:Name",
                Values: ["hub"]
            }]
        }).promise();
    }
}