```
// Best Hub
PORT=5000 yarn best-agent-hub

// Best Agent1
PORT=5001 yarn best-agent --remoteHubUri http://localhost:5000 --runner @best/runner-headless --uri http://localhost:5001

// Best Agent2
PORT=5002 yarn best-agent --remoteHubUri http://localhost:5000 --runner @best/runner-headless --uri http://localhost:5002

// Best Runner1
cd packages/best-benchmarks
DEBUG=runner-remote:* node ./node_modules/.bin/best --disableInteractive --runner local-hub --iterations 5

// Best Runner2
cd packages/lwc-example
node ./node_modules/.bin/best --disableInteractive --runner local-hub --iterations 10

// Best Frontend test
cd packages/@best/agent-frontend
yarn watch

```
