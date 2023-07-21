/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Router } from 'express';
import { loadDbFromConfig, TemporarySnapshot } from '@best/api-db';
import { GithubApplicationFactory } from '@best/github-integration';
import { FrontendConfig } from '@best/types';
import { authorizeRequest } from './auth';

export default (config: FrontendConfig): Router => {
    const db = loadDbFromConfig(config);
    const router = Router();

    router.get('/info/:commit', async (req, res): Promise<void> => {
        const { commit } = req.params;

        if (config.githubConfig) {
            try {
                const { repo, owner } = config.githubConfig;
                const app = GithubApplicationFactory();
                const gitHubInstallation = await app.authenticateAsAppAndInstallation({ repo, owner });

                const response = await gitHubInstallation.repos.getCommit({
                    owner,
                    repo,
                    commit_sha: commit,
                });

                res.send({
                    commit: {
                        fullCommit: response.data.sha,
                        body: response.data.commit.message,
                        url: response.data.html_url,
                        username: response.data.author.login,
                        profileImage: response.data.author.avatar_url,
                    },
                });
            } catch (err) {
                res.send({
                    error: {
                        reason: 'GitHub integration failed.',
                    },
                });
            }
        } else {
            res.send({
                error: {
                    reason: 'GitHub integration not enabled.',
                },
            });
        }
    });

    router.get('/projects', async (req, res): Promise<void> => {
        try {
            await db.migrate();

            const projects = await db.fetchProjects();

            res.send({
                projects,
            });
        } catch (err) {
            res.send({ err });
        }
    });

    router.get('/:project/snapshots', async (req, res): Promise<void> => {
        const { project } = req.params;
        const { since }: { since?: string } = req.query;

        try {
            await db.migrate();

            let parsedSince: Date | undefined;
            if (since && since.length > 0) {
                parsedSince = new Date(parseInt(since, 10));
            }

            if (!project) {
                throw new Error('Please provide a project id.');
            }

            const snapshots = await db.fetchSnapshots(Number(project), parsedSince);

            res.send({
                snapshots,
            });
        } catch (err) {
            res.send({ err });
        }
    });

    router.post('/:projectName/snapshots', authorizeRequest, async (req, res): Promise<void> => {
        const { projectName }: { projectName?: string } = req.params;
        const { body: snapshots }: { body: TemporarySnapshot[] } = req;

        try {
            await db.migrate();
            await db.saveSnapshots(snapshots, projectName);

            res.status(200).end();
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    });

    return router;
};
