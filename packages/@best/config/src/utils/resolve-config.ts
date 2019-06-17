import fs from 'fs';
import path from 'path';
import { PACKAGE_JSON, BEST_CONFIG } from './constants';
import { UserBestConfig } from '../internal-types';

function isFile(filePath:string) {
    return fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory();
}

export function resolveConfigPathByTraversing(pathToResolve: string, initialPath: string, cwd: string): string {
    const bestConfig = path.resolve(pathToResolve, BEST_CONFIG);
    if (isFile(bestConfig)) {
        return bestConfig;
    }

    const packageJson = path.resolve(pathToResolve, PACKAGE_JSON);
    if (isFile(packageJson)) {
        return packageJson;
    }

    if (pathToResolve === path.dirname(pathToResolve)) {
        throw new Error(`No config found in ${initialPath}`);
    }

    // go up a level and try it again
    return resolveConfigPathByTraversing(path.dirname(pathToResolve), initialPath, cwd);
}

export function resolveConfigPath(pathToResolve: string, cwd: string) {
    const absolutePath = path.isAbsolute(pathToResolve) ? pathToResolve : path.resolve(cwd, pathToResolve);
    if (isFile(absolutePath)) {
        return absolutePath;
    }

    return resolveConfigPathByTraversing(absolutePath, pathToResolve, cwd);
}

export function readConfigAndSetRootDir(configPath: string): UserBestConfig {
    const isJSON = configPath.endsWith('.json');
    let configObject;
    try {
        configObject = require(configPath);
    } catch (error) {
        if (isJSON) {
            throw new Error(`Best: Failed to parse config file ${configPath}\n`);
        } else {
            throw error;
        }
    }

    if (configPath.endsWith(PACKAGE_JSON)) {
        if (!configObject.best) {
            throw new Error(`No "best" section has been found in ${configPath}`);
        }

        configObject = configObject.best;
    }

    if (!configObject) {
        throw new Error("Couldn't find any configuration for Best.");
    }

    if (configObject.rootDir) {
        // We don't touch it if it has an absolute path specified
        if (!path.isAbsolute(configObject.rootDir)) {
            // otherwise, we'll resolve it relative to the file's __dirname
            configObject.rootDir = path.resolve(path.dirname(configPath), configObject.rootDir);
        }
    } else {
        // If rootDir is not there, we'll set it to this file's __dirname
        configObject.rootDir = path.dirname(configPath);
    }

    if (!configObject.projectName) {
        throw new Error('A best project must have a projectName');
    }

    return configObject;
}

export function ensureNoDuplicateConfigs(parsedConfigs: any, projects: string[]) {
    const configPathSet = new Set();

    for (const { configPath } of parsedConfigs) {
        if (configPathSet.has(configPath)) {
            let message = 'One or more specified projects share the same config file\n';

            parsedConfigs.forEach((projectConfig: any, index: number) => {
                message =
                    message +
                    '\nProject: "' +
                    projects[index] +
                    '"\nConfig: "' +
                    String(projectConfig.configPath) +
                    '"';
            });
            throw new Error(message);
        }

        if (configPath !== null) {
            configPathSet.add(configPath);
        }
    }
}
