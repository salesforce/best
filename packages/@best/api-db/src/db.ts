import { Pool, QueryResult } from 'pg'

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
    }
}