import { TemporarySnapshot } from '../types'

const normalizeMetrics = (metrics: any) => {
    const standardizedMetrics = metrics.reduce((acc: any, metric: any) => {
        return {
            ...acc,
            [metric.name]: [metric.duration, metric.stdDeviation]
        }
    }, {})

    return JSON.stringify(standardizedMetrics)
}

export interface SQLQueryResult {
    rows: any[]
}

export abstract class SQLDatabase {
    abstract query(text: string, params: any[]): Promise<SQLQueryResult>

    fetchProjects(): Promise<SQLQueryResult> {
        return this.query('SELECT * FROM projects', [])
    }

    fetchSnapshots(projectId: number, since: Date | undefined): Promise<SQLQueryResult> {
        if (since) {
            return this.query(`SELECT * FROM snapshots WHERE "project_id" = $1 AND "temporary" = '0' AND "commit_date" > $2 ORDER BY commit_date, name`, [projectId, since])
        }

        return this.query(`SELECT * FROM snapshots WHERE "project_id" = $1 AND "temporary" = '0' ORDER BY commit_date, name`, [projectId])
    }

    fetchProject(name: string): Promise<SQLQueryResult> {
        return this.query('SELECT * FROM projects WHERE "name" = $1 LIMIT 1', [name])
    }

    createProject(name: string): Promise<SQLQueryResult> {
        return this.query('INSERT INTO projects("name") VALUES ($1)', [name])
    }

    updateProjectLastRelease(id: number, release: string | Date): Promise<SQLQueryResult> {
        return this.query('UPDATE projects SET "last_release_date" = $1 WHERE "id" = $2', [release, id]);
    }

    createSnapshot(snapshot: TemporarySnapshot, projectId: number): Promise<SQLQueryResult> {
        const values = [snapshot.name, normalizeMetrics(snapshot.metrics), snapshot.environmentHash, snapshot.similarityHash, snapshot.commit, snapshot.commitDate, snapshot.temporary, projectId]
        return this.query('INSERT INTO snapshots("name", "metrics", "environment_hash", "similarity_hash", "commit", "commit_date", "temporary", "project_id") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', values)
    }

    async createOrUpdateSnapshot(snapshot: TemporarySnapshot, projectId: number): Promise<SQLQueryResult> {
        try {
            return await this.createSnapshot(snapshot, projectId)
        } catch (err) {
            if (err.constraint === 'best_snapshot_unqiue_index') {
                const updatedAt = new Date()
                const values = [normalizeMetrics(snapshot.metrics), snapshot.environmentHash, snapshot.similarityHash, updatedAt, projectId, snapshot.commit, snapshot.name]
                return this.query('UPDATE snapshots SET "metrics" = $1, "environment_hash" = $2, "similarity_hash" = $3, "updated_at" = $4 WHERE "project_id" = $5 AND "commit" = $6 AND "name" = $7', values)
            } else {
                console.log(err)
                throw err;
            }
        }
    }
}