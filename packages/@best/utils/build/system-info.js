"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const systeminformation_1 = __importDefault(require("systeminformation"));
async function getSystemInfo() {
    const system = await systeminformation_1.default.system();
    const cpu = await systeminformation_1.default.cpu();
    const { platform, distro, release, kernel, arch } = await systeminformation_1.default.osInfo();
    const { avgload } = await systeminformation_1.default.currentLoad();
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
        load: { cpuLoad: avgload },
    };
}
exports.getSystemInfo = getSystemInfo;
//# sourceMappingURL=system-info.js.map