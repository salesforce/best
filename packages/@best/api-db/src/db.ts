import { Pool, QueryResult } from 'pg'
import { TemporarySnapshot } from './types'

const pool = new Pool()

export default {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: (text: string, params: any[]): Promise<QueryResult> => {
        console.warn('[DB] Directly using db.query is discouraged.')
        return pool.query(text, params)
    },
    fetchProjects: (): Promise<QueryResult> => {
        return pool.query('SELECT * FROM projects')
    },
    fetchSnapshots: (projectId: number, since: string): Promise<QueryResult> => {
        if (since) {
            return pool.query('SELECT * FROM snapshots WHERE "project_id" = $1 and "commit_date" > $2 ORDER BY commit_date, name', [projectId, since])
        }

        return pool.query('SELECT * FROM snapshots WHERE "project_id" = $1 ORDER BY commit_date, name', [projectId])
    },
    fetchProject: (name: string): Promise<QueryResult> => {
        return pool.query('SELECT * FROM projects WHERE "name" = $1 LIMIT 1', [name])
    },
    createProject: (name: string): Promise<QueryResult> => {
        // TODO: get lastReleaseDate from somewhere...
        return pool.query('INSERT INTO projects(name) VALUES ($1) RETURNING *', [name]);
    },
    createSnapshot: (snapshot: TemporarySnapshot, projectId: number): Promise<QueryResult> => {
        const values = [snapshot.name, JSON.stringify(snapshot.metrics), snapshot.environmentHash, snapshot.similarityHash, snapshot.commit, snapshot.commitDate, snapshot.temporary, projectId];
        return pool.query('INSERT INTO snapshots(name, metrics, environment_hash, similarity_hash, commit, commit_date, temporary, project_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', values)
    }
}