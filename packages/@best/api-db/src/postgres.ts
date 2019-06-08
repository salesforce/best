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

    async saveSnapshots(snapshots: TemporarySnapshot[], projectName: string): Promise<Snapshot[]> {
        // TODO: implement saving into database
        // TODO: figure out if we want some type of unique-ness or want to add indexes
        return [];
    }
}