/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { ApiDatabaseConfig } from '@best/types';

export interface Organization {
    id: number;
    name: string;
    createdAt: string;
    lastReleaseDate: string;
}

export interface Project {
    id: number;
    organizationId: number;
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

export class ApiDBAdapter {
    constructor(config: ApiDatabaseConfig) {}

    fetchOrganizations(): Promise<Organization[]> {
        throw new Error('ApiDB.fetchOrganizations() not implemented')
    }

    fetchProjects(): Promise<Project[]> {
        throw new Error('ApiDB.fetchProjects() not implemented')
    }

    fetchSnapshots(projectId: number, since: Date | undefined): Promise<Snapshot[]> {
        throw new Error('ApiDB.fetchSnapshots() not implemented')
    }

    saveSnapshots(snapshots: TemporarySnapshot[], projectName: string, orgName: string): Promise<boolean> {
        throw new Error('ApiDB.saveSnapshots() not implemented')
    }

    updateLastRelease(projectName: string, release: string | Date): Promise<boolean> {
        throw new Error('ApiDB.updateLastRelease() not implemented')
    }

    migrate() {
        throw new Error('ApiDB.migrate() not implemented')
    }
}
