/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import si from 'systeminformation';

export async function getSystemInfo() {
    const system = await si.system();
    const cpu = await si.cpu();
    const { platform, distro, release, kernel, arch } = await si.osInfo();
    const { avgLoad } = await si.currentLoad();

    return {
        system: {
            manufacturer: system.manufacturer,
            model: system.model,
        },
        cpu: {
            manufacturer: cpu.manufacturer,
            brand: cpu.brand,
            family: cpu.family,
            model: cpu.model,
            speed: cpu.speed,
            cores: cpu.cores,
        },
        os: { platform, distro, release, kernel, arch },
        load: { cpuLoad: avgLoad },
    };
}
