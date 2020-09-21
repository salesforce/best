/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { Project, Snapshot, Metric, Organization } from '../types';

const denormalizeMetrics = (metrics: any): Metric[] => {
    return Object.keys(metrics).map((key): Metric => ({
        name: key,
        duration: metrics[key][0],
        stdDeviation: metrics[key][1]
    }))
}

export default {
    organizations: (query: any): Organization[] => {
        return query.rows.map((row: any): Organization => ({
            id: row.id,
            name: row.name,
            createdAt: row.created_at,
            lastReleaseDate: row.last_release_date
        }))
    },
    projects: (query: any): Project[] => {
        return query.rows.map((row: any): Project => ({
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            createdAt: row.created_at,
            lastReleaseDate: row.last_release_date
        }))
    },
    snapshots: (query: any): Snapshot[] => {
        return query.rows.map((row: any): Snapshot => ({
            id: row.id,
            projectId: row.project_id,
            name: row.name,
            metrics: denormalizeMetrics(JSON.parse(row.metrics)),
            environmentHash: row.environment_hash,
            similarityHash: row.similarity_hash,
            commit: row.commit,
            commitDate: row.commit_date,
            temporary: row.temporary,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }))
    }
};