import { ApiDB, Project, TemporarySnapshot, Snapshot } from './types';
import db from './db';
import transformer from './transformer';

export default class PostgresDB extends ApiDB {
    async fetchProjects(): Promise<Project[]> {
        const results = await db.fetchProjects()

        return transformer.projects(results)
    }

    async fetchSnapshots(projectId: number, since: string): Promise<Snapshot[]> {
        const results = await db.fetchSnapshots(projectId, since)

        return transformer.snapshots(results)
    }

    async saveSnapshots(snapshots: TemporarySnapshot[], projectName: string): Promise<boolean> {
        const projectResult = await db.fetchProject(projectName);

        let projectId: number;
        if (projectResult.rows.length > 0) {
            projectId = projectResult.rows[0].id;
        } else {
            const newProject = await db.createProject(projectName);
            projectId = newProject.rows[0].id;
        }

        try {
            await Promise.all(snapshots.map(async (snapshot) => {
                return db.createSnapshot(snapshot, projectId);
            }));
        } catch (err) {
            console.error('[API-DB] Could not save results', err);
            return false;
        }

        return true;
    }
}