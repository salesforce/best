const BEST_SERVICE_TYPE = process.env.BEST_SERVICE_TYPE || 'frontend';

console.log(`Initializing ${BEST_SERVICE_TYPE}`);

if (BEST_SERVICE_TYPE === 'frontend') {
    require('best-frontend-example');
} else if (BEST_SERVICE_TYPE === 'agent') {
    require('best-agent').run();
}
