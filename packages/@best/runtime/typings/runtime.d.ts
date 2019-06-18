type BenchmarkPrimitiveNode = BenchmarkPrimitiveRunNode;

interface BenchmarkPrimitiveRunNode {
    startedAt: number;
    fn: Function;
    name: string;
    parent: BenchmarkPrimitiveNode;
}
