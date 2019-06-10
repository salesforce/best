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

export abstract class ApiDB {
    abstract fetchProjects(): Promise<Project[]>;
    abstract fetchSnapshots(projectId: number, since: string): Promise<Snapshot[]>;
    abstract saveSnapshots(snapshots: TemporarySnapshot[], projectName: string): Promise<boolean>;
}