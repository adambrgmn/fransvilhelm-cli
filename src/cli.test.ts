import { readFile } from 'node:fs/promises';

it('works', async () => {
  expect(await readFile('package.json', 'utf-8')).toBeTruthy();
});
