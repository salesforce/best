# Frontend Flow

## Initial Load
When the user loads the Best frontend we commence the following flow:
1. User opens Best dashboard
    - GET `/projects`, and then populate sidebar
2. Select default project and branch
    - Set defaults for view selection (timing: since last release, benchmarks: all, metrics: all)
    - GET `/:project/:branch/commits`, and then populate the graphs
3. Render graphs with the above data for each benchmark

## View changes
This is when the user selects a different timing, benchmarks, or metrics from the top dropdowns.

### Timing
When the timing changes, we will have to send another request to the server for new data.

### Benchmarks
When the user decides they want to view a certain set of benchmarks, we simply hide certain graphs. We do not need to do another server request. We only need to re-render the graphs.

### Metrics
When the user decides they want to view a certain set of metrics, we simply hide certain lines on the visible graphs. We do not need to do another server request. We only need to re-render the graphs.

## User Initialized Comparison
If the user selects some commits and wants to re-run certain benchmarks against them, this is where we use the web sockets API with the following flow:
1. Open a web sockets connection to a Best agent
2. Send the `initiateRun` event with the following properties (`project`, `branch`, `commits`, `benchmarks`, `environment`)
3. Wait for `runComplete` event.

Once the `runComplete` event is recieved by the frontend client we can display the results of the comparison to the user.