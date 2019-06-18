import { loadDbFromConfig, Project, Snapshot, ApiDBAdapter } from '@best/api-db';
import { MockerOptions } from './mocker'

interface MockedSnapshotBranch {
    [timing: string]: Snapshot[]
}

interface MockedSnapshotProject {
    [branch: string]: MockedSnapshotBranch
}

interface MockedSnapshots {
    [projectId: string]: MockedSnapshotProject
}

// taken from frontend/src/store/api/api.js
const timeFromQuery = (project: { lastReleaseDate: string }, timing: string): Date | undefined => {
    if (timing === 'last-release' && project.lastReleaseDate) {
        const date = new Date(project.lastReleaseDate);
        return date;
    } else if (timing === '2-months') {
        let date = new Date();
        date.setMonth(date.getMonth() - 2);
        return date
    }

    return undefined
}

const buildBranch = async (options: MockerOptions, db: ApiDBAdapter, proj: Project, branch: string): Promise<MockedSnapshotBranch> => {
    return await options.timingOptions.reduce(async (acc, timing) => {
        return {
            ...await acc,
            [timing]: await db.fetchSnapshots(proj.id, branch, timeFromQuery(proj, timing))
        }
    }, {})
}

const buildProject = async (options: MockerOptions, db: ApiDBAdapter, proj: Project): Promise<MockedSnapshotProject> => {
    return await options.branches.reduce(async (acc, branch) => {
        return {
            ...await acc,
            [branch]: await buildBranch(options, db, proj, branch)
        }
    }, {})
}

export const buildMockedDataFromApi = async (options: MockerOptions) => {
    const db = loadDbFromConfig(options.config);

    if (! db) { return null }

    const allProjects = await db.fetchProjects()
    const projects = allProjects.filter(proj => options.projectIds.includes(proj.id))

    const snapshots: MockedSnapshots = await projects.reduce(async (acc, proj) => {
        return {
            ...await acc,
            [proj.id]: await buildProject(options, db, proj)
        }
    }, {})

    return { projects, snapshots }
}