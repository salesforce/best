import { ApiDatabaseConfig } from '@best/types';

export interface Project {
    id: number;
    name: string;
    createdAt: string;
    lastReleaseDate: string;
}

export interface Metric {
    name: string;
    duration: number;
    stdDeviation: number;
}

export interface TemporarySnapshot {
    name: string;
    branch: string;
    metrics: Metric[];
    environmentHash: string;
    similarityHash: string;
    commit: string;
    commitDate: string;
    temporary: boolean;
}

export interface Snapshot extends TemporarySnapshot {
    id: number;
    projectId: number;
    createdAt: string;
    updatedAt: string;
}

export class ApiDBAdapter {
    constructor(config: ApiDatabaseConfig) {}

    fetchProjects(): Promise<Project[]> {
        throw new Error('ApiDB.fetchProjects() not implemented')
    }

    fetchSnapshots(projectId: number, branch: string, since: string): Promise<Snapshot[]> {
        throw new Error('ApiDB.fetchSnapshots() not implemented')
    }

    saveSnapshots(snapshots: TemporarySnapshot[], projectName: string): Promise<boolean> {
        throw new Error('ApiDB.saveSnapshots() not implemented')
    }

    updateLastRelease(projectName: string, release: string | Date): Promise<boolean> {
        throw new Error('ApiDB.updateLastRelease() not implemented')
    }
}
