## *project-foo*

bar | base (`abcdef0`) | target (`1234567`) | trend
--- | --- | --- | ---
bar 1/fibonacci 15 | - | - | -
└─ script | 0.14 (± 0.01ms) | 0.17 (± 0.04ms) | +0.0ms (21.4%) 👌
└─ aggregate | 0.56 (± 0.26ms) | 0.73 (± 0.16ms) | +0.2ms (31.2%) 👌
bar 1/fibonacci 38 | - | - | -
└─ script | 475.37 (± 2.74ms) | 478.37 (± 1.70ms) | +3.0ms (0.6%) 👌
└─ aggregate | 475.63 (± 2.67ms) | 478.61 (± 1.60ms) | +3.0ms (0.6%) 👌

baz | base (`abcdef0`) | target (`1234567`) | trend
--- | --- | --- | ---
baz 1/fibonacci | - | - | -
└─ script | 0.33 (± 0.03ms) | 0.19 (± 0.01ms) | -0.1ms (41.5%) 👌
└─ aggregate | 0.73 (± 0.15ms) | 0.70 (± 0.18ms) | -0.0ms (4.1%) 👌
