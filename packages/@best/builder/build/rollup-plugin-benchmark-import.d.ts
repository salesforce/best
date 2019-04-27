export default function (): {
    name: string;
    options(rollupOpts: any): void;
    resolveId(id: string): string | undefined;
    transform(src: string, id: string): {
        code: string;
        map: null;
    };
};
