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

export interface Snapshot {
    id: number;
    projectId: number;
    name: string;
    metrics: Metric[];
    environmentHash: string;
    similarityHash: string;
    commit: string;
    commitDate: string;
    temporary: boolean;
    createdAt: string;
    updatedAt: string;
}

export abstract class ApiDB {
    abstract fetchProjects(): Promise<Project[]>;
    abstract fetchSnapshots(projectId: number, since: string): Promise<Snapshot[]>;
}