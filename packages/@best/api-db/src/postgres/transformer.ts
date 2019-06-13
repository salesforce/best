import { QueryResult } from 'pg';
import { Project, Snapshot, Metric } from '../types';

const normalizeMetrics = (metrics: any): Metric[] => {
    return Object.keys(metrics).map((key): Metric => ({
        name: key,
        duration: metrics[key][0],
        stdDeviation: metrics[key][1]
    }));
};

export default {
    projects: (query: QueryResult): Project[] => {
        return query.rows.map((row): Project => ({
            id: row.id,
            name: row.name,
            createdAt: row.created_at,
            lastReleaseDate: row.last_release_date
        }));
    },
    snapshots: (query: QueryResult): Snapshot[] => {
        return query.rows.map((row): Snapshot => ({
            id: row.id,
            projectId: row.project_id,
            name: row.name,
            metrics: normalizeMetrics(JSON.parse(row.metrics)),
            environmentHash: row.environment_hash,
            similarityHash: row.similarity_hash,
            commit: row.commit,
            commitDate: row.commit_date,
            temporary: row.temporary,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    }
};