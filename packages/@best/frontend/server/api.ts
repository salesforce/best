import { Router } from 'express'
import { loadDbFromConfig } from '@best/api-db'
import { GithubApplicationFactory } from '@best/github-integration'

export default (config: any): Router => {
    const db = loadDbFromConfig(config);
    const router = Router()

    router.get('/check', async (req, res): Promise<void> => {

        const owner = '...';
        const repo = '...';
        const app = GithubApplicationFactory();
        const gitAppAuth = await app.authenticateAsApplication();
        const repoInstallation = await gitAppAuth.apps.getRepoInstallation({ owner, repo });
        const installationId = repoInstallation.data.id;
        const gitHubInstallation = await app.authenticateAsInstallation(installationId);
        // const login = repoInstallation.data.account.login;

        try {
            const response = await gitHubInstallation.checks.create({
                owner,
                repo,
                name: 'best',
                head_sha: "...",
                completed_at: (new Date()).toISOString(),
                conclusion: "failure",
                output: {
                    title: 'Best Performance',
                    summary: 'Best is currently running your performance suite.'
                }
            })

            // const response = await gitHubInstallation.checks.update({
            //     owner,
            //     repo,
            //     check_run_id: 148914533,
            //     completed_at: (new Date()).toISOString(),
            //     conclusion: "success"
            // })

            // const response = await gitHubInstallation.issues.createComment({
            //     owner,
            //     repo,
            //     issue_number: 1,
            //     body: '# Best Performance\n\nBest is currently running your performance suite.'
            // })
    
            console.log(response)
    
            res.send({
                commit: {
                    title: 'hi there'
                }
            })
        } catch (err) {
            console.error(err)

            res.send({
                commit: {
                    title: 'failed...'
                }
            })
        }
    })

    router.get('/info/:commit', async (req, res): Promise<void> => {
        const { commit } = req.params;

        if (config.githubConfig) {
            try {
                const { repo, owner } = config.githubConfig;
                const app = GithubApplicationFactory();
                const gitAppAuth = await app.authenticateAsApplication();
                const repoInstallation = await gitAppAuth.apps.getRepoInstallation({ owner, repo });
                const installationId = repoInstallation.data.id;
                const gitHubInstallation = await app.authenticateAsInstallation(installationId);

                const response = await gitHubInstallation.repos.getCommit({
                    owner,
                    repo,
                    commit_sha: commit
                })

                res.send({
                    commit: {
                        fullCommit: response.data.sha,
                        body: response.data.commit.message,
                        url: response.data.html_url,
                        username: response.data.author.login,
                        profileImage: response.data.author.avatar_url
                    }
                })
            } catch (err) {
                res.send({
                    error: {
                        reason: 'GitHub integration failed.'
                    }
                })
            }
        } else {
            res.send({
                error: {
                    reason: 'GitHub integration not enabled.'
                }
            })
        }
    })

    router.get('/projects', async (req, res): Promise<void> => {
        try {
            const projects = await db.fetchProjects()

            res.send({
                projects
            })
        } catch (err) {
            console.error(err)
            res.send({ err })
        }
    })

    router.get('/:project/snapshots', async (req, res): Promise<void> => {
        const { project } = req.params
        const { since } = req.query

        try {
            const snapshots = await db.fetchSnapshots(project, since)

            res.send({
                snapshots
            })
        } catch (err) {
            console.error(err)
            res.send({ err })
        }
    })

    return router;
}
