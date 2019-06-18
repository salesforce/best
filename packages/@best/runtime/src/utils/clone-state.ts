export default function cloneState (obj: any): BenchmarkState {
    const stateClone = Object.assign({}, obj);

    if (stateClone.children) {
        stateClone.children = stateClone.children.map((obj: any) => cloneState(obj));
    }

    if (stateClone.run) {
        stateClone.run = Object.assign({}, stateClone.run);
    }

    return stateClone;
}
