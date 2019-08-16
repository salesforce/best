/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

export interface SanitizedEvent {
    name: string;
    packet: any;
}

const normalizePacket = (name: string, rawPacket: any): any => {
    let packet: any;
    if (rawPacket instanceof Array && rawPacket.length === 1) {
        packet = rawPacket[0];
    }

    switch (name) {
        case 'benchmark results':
            return {
                resultCount: packet.results.length
            }
        default:
            return packet;
    }
}

export const sanitize = (rawEvent: string, packet: any): SanitizedEvent => {
    const eventName = rawEvent.replace('running_', '').replace('_', ' ');
    const cleaned = normalizePacket(eventName, packet);

    return {
        name: eventName,
        packet: cleaned
    }
}