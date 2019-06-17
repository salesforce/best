import { ApiDBAdapter, Project, TemporarySnapshot, Snapshot } from '../types'
import transformer from './transformer'
import { SQLDatabase } from './db'

export class SQLAdapter extends ApiDBAdapter {
    db: SQLDatabase
    constructor(config: any, db: SQLDatabase) {
        super(config)
        this.db = db
    }

    async fetchProjects(): Promise<Project[]> {
        const results = await this.db.fetchProjects()

        return transformer.projects(results)
    }

    async fetchSnapshots(projectId: number, since: string): Promise<Snapshot[]> {
        const results = await this.db.fetchSnapshots(projectId, since)

        return transformer.snapshots(results)
    }

    async saveSnapshots(snapshots: TemporarySnapshot[], projectName: string): Promise<boolean> {
        try {
            let projectResult = await this.db.fetchProject(projectName)

            if (projectResult.rows.length < 1) {
                await this.db.createProject(projectName)
                projectResult = await this.db.fetchProject(projectName)
            }

            const projectId = projectResult.rows[0].id

            await Promise.all(snapshots.map(async (snapshot) => {
                return this.db.createSnapshot(snapshot, projectId)
            }))
        } catch (err) {
            console.error('[API-DB] Could not save results into database.');
            return false
        }

        return true
    }
}