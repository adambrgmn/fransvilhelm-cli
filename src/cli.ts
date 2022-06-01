#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const readPackageJson = async (): Promise<string> => {
  return readFile('package.json', 'utf-8');
};

(async () => {
  let f = await readPackageJson();
  console.log(f.length);
})();
