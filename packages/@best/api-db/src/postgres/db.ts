import { Pool, QueryResult } from 'pg'
import { TemporarySnapshot } from '../types'

const normalizeMetrics = (metrics: any) => {
    const standardizedMetrics = metrics.reduce((acc: any, metric: any) => {
        return {
            ...acc,
            [metric.name]: [metric.duration, metric.stdDeviation]
        }
    }, {})

    return JSON.stringify(standardizedMetrics);
}

export default class DB {
    pool: Pool
    constructor(config: any) {
        this.pool = new Pool(config)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query(text: string, params: any[]): Promise<QueryResult> {
        console.warn('[DB] Directly using db.query is discouraged.')
        return this.pool.query(text, params)
    }

    fetchProjects(): Promise<QueryResult> {
        return this.pool.query('SELECT * FROM projects')
    }

    fetchSnapshots(projectId: number, since: string): Promise<QueryResult> {
        if (since) {
            return this.pool.query('SELECT * FROM snapshots WHERE "project_id" = $1 and "commit_date" > $2 ORDER BY commit_date, name', [projectId, since])
        }

        return this.pool.query('SELECT * FROM snapshots WHERE "project_id" = $1 ORDER BY commit_date, name', [projectId])
    }

    fetchProject(name: string): Promise<QueryResult> {
        return this.pool.query('SELECT * FROM projects WHERE "name" = $1 LIMIT 1', [name])
    }

    createProject(name: string): Promise<QueryResult> {
        // TODO: get lastReleaseDate from somewhere...
        return this.pool.query('INSERT INTO projects(name) VALUES ($1) RETURNING *', [name]);
    }

    createSnapshot(snapshot: TemporarySnapshot, projectId: number): Promise<QueryResult> {
        const values = [snapshot.name, normalizeMetrics(snapshot.metrics), snapshot.environmentHash, snapshot.similarityHash, snapshot.commit, snapshot.commitDate, snapshot.temporary, projectId];
        return this.pool.query('INSERT INTO snapshots(name, metrics, environment_hash, similarity_hash, commit, commit_date, temporary, project_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', values)
    }
}