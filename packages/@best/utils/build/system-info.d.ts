export declare function getSystemInfo(): Promise<{
    system: {
        manufacturer: string;
        model: string;
    };
    cpu: {
        manufacturer: string;
        brand: string;
        family: string;
        model: string;
        speed: string;
        cores: number;
    };
    os: {
        platform: string;
        distro: string;
        release: string;
        kernel: string;
        arch: string;
    };
    load: {
        cpuLoad: number;
    };
}>;
