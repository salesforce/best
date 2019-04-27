export declare function withMacroTask(fn: any): any;
export declare function nextTick(cb?: any, ctx?: any): Promise<unknown> | null;
export declare const time: () => number;
export declare const formatTime: (t: number) => number;
export declare const raf: ((callback: FrameRequestCallback) => number) | typeof nextTick;
