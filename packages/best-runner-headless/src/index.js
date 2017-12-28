import puppeteer from "puppeteer";

const BROWSER_ARGS = [
    '--no-sandbox',
    `--js-flags=--expose-gc`,
    '--disable-infobars',
    '--disable-background-networking',
    '--disable-extensions',
    '--disable-translate',
    '--no-first-run',
    '--ignore-certificate-errors',
    '--enable-precise-memory-info',
];

const PUPPETEER_OPTIONS = { args: BROWSER_ARGS };

export async function run(benchmarkEntry, proyectConfig, globalConfig) {
    const results = Array.apply(null, Array(100)).map((k, i) => i);

    return puppeteer.launch(PUPPETEER_OPTIONS).then(async browser => {
        const page = await browser.newPage();
        await page.goto('file:///' + benchmarkEntry);

        for (const index of results) {
            const result = await page.evaluate(async () => { return BEST.runBenchmark(); });
            await page.reload();
            results[index] = result[0];
        }

        const mapped = results.map((r) => {
            const f = r.benchmarks[0].benchmarks[0];
            return {
                duration: f.duration.toFixed(5),
                runDuration: f.runDuration.toFixed(5)
            };
        });

        console.log('>>', mapped);
        await browser.close();
    });
}
