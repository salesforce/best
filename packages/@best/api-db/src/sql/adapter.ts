/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { ApiDBAdapter, Project, Organization, TemporarySnapshot, Snapshot } from '../types'
import transformer from './transformer'
import { SQLDatabase } from './db'
import { ApiDatabaseConfig } from '@best/types';

export class SQLAdapter extends ApiDBAdapter {
    db: SQLDatabase
    constructor(config: ApiDatabaseConfig, db: SQLDatabase) {
        super(config)
        this.db = db
    }
    async fetchOrganizations(): Promise<Organization[]> {
        const results = await this.db.fetchOrganizations()

        return transformer.organizations(results)
    }

    async fetchProjects(): Promise<Project[]> {
        const results = await this.db.fetchProjects()

        return transformer.projects(results)
    }

    async fetchSnapshots(projectId: number, since: Date | undefined): Promise<Snapshot[]> {
        const results = await this.db.fetchSnapshots(projectId, since)

        return transformer.snapshots(results)
    }

    async saveSnapshots(snapshots: TemporarySnapshot[], projectName: string, orgName: string): Promise<boolean> {
        
        let orgResults = await this.db.fetchOrganization(orgName);
        let projectResult = await this.db.fetchProject(projectName);
        if (orgResults.rows.length < 1) {
            await this.db.createOrganization(orgName, true);
            orgResults = await this.db.fetchOrganization(orgName);
            if (projectResult.rows.length > 0) {
                await this.db.updateProject(projectName,orgResults.rows[0].id)
            }
        }
        if (projectResult.rows.length < 1) {
            await this.db.createProject(projectName, orgResults.rows[0].id, true)
            projectResult = await this.db.fetchProject(projectName)
        }
        const projectId = projectResult.rows[0].id

        await Promise.all(snapshots.map(async (snapshot) => {
            return this.db.createOrUpdateSnapshot(snapshot, projectId)
        }))

        return true
    }

    async updateLastRelease(projectName: string, release: string | Date): Promise<boolean> {
        const projectResult = await this.db.fetchProject(projectName)

        if (projectResult.rows.length > 0) {
            const projectId = projectResult.rows[0].id
            await this.db.updateProjectLastRelease(projectId, release)
        } else {
            throw new Error(`Project with name: '${projectName}' does not exist.`)
        }

        return true
    }

    migrate() {
        return this.db.performMigrations()
    }
}
