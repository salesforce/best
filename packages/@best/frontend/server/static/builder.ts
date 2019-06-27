import { loadDbFromConfig, Project, Snapshot, ApiDBAdapter } from '@best/api-db';
import { MockerOptions } from './mocker'

interface MockedSnapshotProject {
    [timing: string]: Snapshot[];
}

interface MockedSnapshots {
    [projectId: string]: MockedSnapshotProject;
}

// taken from frontend/src/store/api/api.js
const timeFromQuery = (project: { lastReleaseDate: string }, timing: string): Date | undefined => {
    if (timing === 'last-release' && project.lastReleaseDate) {
        const date = new Date(project.lastReleaseDate);
        return date;
    } else if (timing === '2-months') {
        let date = new Date();
        date.setMonth(date.getMonth() - 2);
        return date;
    }

    return undefined;
}

const buildProject = async (options: MockerOptions, db: ApiDBAdapter, proj: Project): Promise<MockedSnapshotProject> => {
    return options.timingOptions.reduce(async (acc, timing): Promise<MockedSnapshotProject> => {
        return {
            ...await acc,
            [timing]: await db.fetchSnapshots(proj.id, timeFromQuery(proj, timing))
        }
    }, {})
}

export const buildMockedDataFromApi = async (options: MockerOptions): Promise<{
    projects: Project[];
    snapshots: MockedSnapshots;
} | null> => {
    const db = loadDbFromConfig(options.config);

    const allProjects = await db.fetchProjects();
    const projects = allProjects.filter((proj): boolean => options.projectNames.includes(proj.name));

    const snapshots: MockedSnapshots = await projects.reduce(async (acc, proj): Promise<MockedSnapshots> => {
        return {
            ...await acc,
            [proj.id]: await buildProject(options, db, proj)
        }
    }, {})

    return { projects, snapshots }
}