import si from 'systeminformation';

export async function getSystemInfo() {
    const system = await si.system();
    const cpu = await si.cpu();
    const { platform, distro, release, kernel, arch } = await si.osInfo();
    const { avgload } = await si.currentLoad();

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
