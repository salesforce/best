# Dashboard Endpoints
These are used when the user is viewing the dashboard.

## GET `/projects`

### Response
```json
{
    "projects": [
        {
            "name": "ie-11",
            "branches": ["master", "hotfix/uh-oh"]
        },
        {
            "name": "chrome",
            "branches": ["master", "hotfix/uh-oh"]
        }
    ],
    "releases": [
        {
            "published_at": "2013-02-27T19:35:32Z",
            "name": "v1.0.0"
        },
        {
            "published_at": "2013-02-10T19:35:32Z",
            "name": "v1.0.0-alpha.0" 
        }
    ]
}
```

## GET `/:project/:branch/commits`

### Properties
- `since` (Date): The date of the oldest commit we want to show
- `until` (Date): The date of the newest commit we want to show

### Response
```json
{
    "commits": [
        {
            "commit_sha": "1a7d489ea2ae72c2099c97e67251595b91e93d9a",
            "commit_date": "2013-02-27T19:35:32Z",
            "benchmarksByProjects": {
                "ie-11": [
                    {
                        "benchmarkName": "append/10k",
                        "metrics": {
                            "duration": [321.425, 10],
                            "first-paint": ["value", "stdDeviation"]
                        }
                    },
                    {
                        "benchmarkName": "clear/10k",
                        "metrics": {}
                    },
                    {
                        "benchmarkName": "with-polyfill",
                        "metrics": {}
                    }
                ],
                "chrome": [
                    {
                        "benchmarkName": "append/10k",
                        "metrics": {
                            "duration": [105.24, 3],
                            "first-paint": ["value", "stdDeviation"]
                        }
                    }
                ]
            }
        },
    ],
    "benchmarkMetadata": {
        "append/10k": {
            "version": 2,
            "environment": {}
        },
        "clear/10k": {
            "version": 2,
            "environment": {}
        },
        "with-polyfill": {
            "version": 2,
            "environment": {}
        }
    }
}
```

# On Demand Web Sockets
These are used when the user manually initiates a run. We can also use this API for the new GitHub integration since it goes through the same flow.

## initiateRun

### Properties
- `project`: The project this run should use.
- `branch`: The branch of the commits used.
- `commits`: A list of commits the benchmarks should be ran on.
- `benchmarks`: A list of benchmarks that should be ran.
- `environment`: A configuration object that defines the environment that will be used.
    - This may be unnecessary since we are sending project.

### Response
```json
{
    "requestSuccessfullyInitiated": true
}
```

## runComplete

### Response
*NOTE: We should figure out if this response should be by commit or by benchmark; because the UI would display by commit but the GitHub integration would display by benchmark.*

```json
{
    "commits": {
        "0bf309c": {
            "benchmarks": {
                "append/10k": {
                    "duration": [321.425, 10],
                    "first-paint": [175, 4]
                },
                "cleark/10k": {}
            }
        },
        "837dd91": {
            "benchmarks": {
                "append/10k": {
                    "duration": [450, 17],
                    "first-paint": [300, 20]
                },
                "cleark/10k": {}
            }
        }
    }
}
```