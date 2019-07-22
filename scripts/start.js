const BEST_SERVICE_TYPE = process.env.BEST_SERVICE_TYPE;

console.log(`Initializing ${BEST_SERVICE_TYPE}`);

if (BEST_SERVICE_TYPE === 'hub') {
    require('@best/agent-hub').run();
} else if (BEST_SERVICE_TYPE === 'agent') {
    require('@best/agent').run();
}
