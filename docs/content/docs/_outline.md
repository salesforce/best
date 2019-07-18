# The Best Docs.

## Understanding Best

### The "Best" Model
*I think this should be a diagram of some sort...Maybe even an animation!*
- The builder (artifacts)
- Running locally
- Running remotely (agents)
- Best Hubs
- CI Integration

### Benefits over other tools
- Easy to setup and get running
- Dedicated hardware!!! aka reproducible results
- Stored artifacts allow you to re-run any previous version of your code
- with Best Hub, each team doesn't need to worry about infa

## Getting Started

### Writing Benchmarks
- `__benchmarks__` files
- `best.config.js` configuration

### Running benchmarks locally
- `best` cli command
    - link to page with the API for all the `best` cli command args

## Running Remotely

- `aws-store` how to store your artifacts remotely

### Agents
- How to provision an agent
- Dedicated hardware!!!
- "Deploy to Heroku" button (should we have an option to setup agent as a hub's agent?)
- `runner-remote`

### Hubs
- How to provision a hub
- "Deploy to Heroku" button
- Getting agents to talk to hubs
- `runner-hub` and `--runInBatch`

### Agent Frontend
- stuff

## Continuous Integration
- How to setup your CI to run Best
- Look at LWC for example?
- run on every PR, but MOST IMPORTANTLY run on every commit to master!!

## ✅ GitHub Integration
- How to create your own GitHub App and setup `.pem` file and app id
- Enabling checks and comments
- `commentThreshold` config

## ✅ Frontend
- How to provision a frontend for all your projects
- Setup ApiDB in your `best.config.js` to send results to Postgres (clients) and to fetch (frontend)
- `--generateHTML` for frontend (oh...btw, fix the static frontend...oops)