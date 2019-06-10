import { Router } from 'express'
import { loadDbFromConfig } from '@best/api-db'

export default (config: any): Router => {
    const db = loadDbFromConfig(config);

    const router = Router()

    // ROUTES

    router.get('/projects', async (req, res): Promise<void> => {
        // mock.bulkCreateSnapshot([1, 2], ['append/10k', 'clear/10k'], 80)

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
