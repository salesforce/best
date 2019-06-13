import { ApiDB, Project, TemporarySnapshot, Snapshot } from '../types';
import DB from './db';
import transformer from './transformer';

export default class PostgresDB extends ApiDB {
    db: DB;
    constructor(config: any) {
        super(config)
        this.db = new DB(config);
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
        const projectResult = await this.db.fetchProject(projectName);

        let projectId: number;
        if (projectResult.rows.length > 0) {
            projectId = projectResult.rows[0].id;
        } else {
            const newProject = await this.db.createProject(projectName);
            projectId = newProject.rows[0].id;
        }

        try {
            await Promise.all(snapshots.map(async (snapshot) => {
                return this.db.createSnapshot(snapshot, projectId);
            }));
        } catch (err) {
            console.error('[API-DB] Could not save results', err);
            return false;
        }

        return true;
    }
}