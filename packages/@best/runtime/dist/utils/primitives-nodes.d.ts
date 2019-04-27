export declare const makeDescribe: (name: string, parent?: any, mode?: string | undefined) => {
    children: never[];
    hooks: never[];
    mode: string | undefined;
    name: string;
    parent: any;
};
export declare const makeBenchmark: (name: string, parent: any, mode: string) => {
    duration: number;
    runDuration: number;
    children: never[];
    errors: never[];
    hooks: never[];
    run: null;
    mode: string;
    name: string;
    parent: any;
    startedAt: null;
    status: null;
};
export declare const makeBenchmarkRun: (fn: Function, parent: any) => {
    duration: null;
    errors: never[];
    fn: Function;
    name: string;
    parent: any;
    startedAt: null;
    status: null;
};
