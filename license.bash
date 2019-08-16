#!/bin/bash
for file in $(find packages/best-benchmarks/ -type f -name \*.js); do
  echo -e "/*\n * Copyright (c) 2019, salesforce.com, inc.\n * All rights reserved.\n * SPDX-License-Identifier: MIT\n * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT\n*/" > copyright-file.txt;
  echo "" >> copyright-file.txt;
  cat $file >> copyright-file.txt;
  mv copyright-file.txt $file;
done