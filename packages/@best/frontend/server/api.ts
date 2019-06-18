import { Router } from 'express'
import { loadDbFromConfig } from '@best/api-db'

export default (config: any): Router => {
    const db = loadDbFromConfig(config);
    const router = Router()

    if (! db) { return router; }

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
        const branch = 'master'

        try {
            const snapshots = await db.fetchSnapshots(project, branch, since)

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
