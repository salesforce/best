import puppeteer from "puppeteer";

async function testPupeteeer() {
    return puppeteer.launch({ headless: false }).then(async browser => {
        const page = await browser.newPage();
        await page.goto('file:///private/var/folders/__/qsv47gzn13l61ch218rrrvhj9_z7ch/T/best_mxxdw0/simple-item.benchmark/simple-item.benchmark.html');
        await page.evaluate(async () => {
            return startBenchmark();
        });
        await page.evaluate(() => {
            return new Promise((resolve) => {
                setTimeout(resolve, 1000);
            });
        });

        await page.reload();

        await page.evaluate(() => {
            return new Promise((resolve) => {
                setTimeout(resolve, 1000);
            });
        });

        await browser.close();
    });
}

export async function runBenchmarks(bundles) {
    const results = [];
    for (const benchmark of bundles) {
        const result = await runBenchmark(benchmark);
        results.push({ benchmark, result });
    }

    return results;
}

export async function runBenchmark(benchmarkConfig) {
    //await testPupeteeer();
    return { wip: true };
}
