import { getSystemInfo } from '../system-info';

test('getSystemInfo', async () => {
    const info = await getSystemInfo();
    expect(info).toMatchObject(
        expect.objectContaining({
            system: {
                manufacturer: expect.any(String),
                model: expect.any(String),
            },
            cpu: {
                manufacturer: expect.any(String),
                brand: expect.any(String),
                family: expect.any(String),
                model: expect.any(String),
                speed: expect.any(String),
                cores: expect.any(Number),
            },
            os: {
                platform: expect.any(String),
                distro: expect.any(String),
                release: expect.any(String),
                kernel: expect.any(String),
                arch: expect.any(String),
            },
            load: {
                cpuLoad: expect.any(Number),
            },
        }),
    );
});
