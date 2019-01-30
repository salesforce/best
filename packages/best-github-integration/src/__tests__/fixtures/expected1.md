# Benchmark results 

<details><summary>Click for full results</summary>
&nbsp;

Base commit: `abcdef0` | Target commit: `1234567`

## *Project Foo*

foo.js | metric | base(`abcdef0`) | target(`1234567`) | trend
--- | --- | --- | --- | ---
Foo Test 1 | duration | 3000.00 (±2.00 ms) | 4000.00 (±3.00 ms) | +1000.0ms (33.3%) 👍
Foo Test 2 | duration | 7000.00 (±-3.25 ms) | 5000.00 (±7.30 ms) | -2000.0ms (28.6%) 👍

## *Project Bar*

bar.js | metric | base(`abcdef0`) | target(`1234567`) | trend
--- | --- | --- | --- | ---
Bar Test 1 | duration | 1000.00 (±-1.00 ms) | 2000.00 (±-2.78 ms) | +1000.0ms (100.0%) 👍
</details>
