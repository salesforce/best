function fib(n) {
    return n <= 1 ? 1 : fib(n - 1) + fib(n - 2);
}

describe('js-execution', () => {
    benchmark('fibonacci', () => {
        run(() => {
            fib(15);
        })
    });
});
