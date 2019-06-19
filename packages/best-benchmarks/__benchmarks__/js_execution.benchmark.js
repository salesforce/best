function fib(n) {
    return n <= 1 ? 1 : fib(n - 1) + fib(n - 2);
}

describe('js-execution', () => {
    benchmark('fibonacci 15', () => {
        run(() => {
            return fib(15);
        })
    });

    benchmark('fibonacci 38', () => {
        run(() => {
            return fib(38);
        })
    });
});
