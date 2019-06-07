import { ApiDB, Project, Snapshot } from './types';
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
}