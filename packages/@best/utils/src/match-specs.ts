import { BrowserSpec } from "@best/types";

export function matchSpecs(specs: BrowserSpec, runnerSpecs: BrowserSpec[]) {
    return runnerSpecs.some(({ name, version }) => specs.name === name && specs.version.toString() === version.toString());
}
