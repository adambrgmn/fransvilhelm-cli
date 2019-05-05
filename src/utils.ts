import fs from 'fs';
import { promisify } from 'util';
import execa from 'execa';
import readPkg from 'read-pkg-up';
import { dirname, join } from 'path';

const access = promisify(fs.access);

/**
 * `excludeFalse` is a Typescript compatible version of `Boolean` when used
 * together with `[].filter`;
 *
 * @example
 * [1, null, 2, 3].filter(excludeFalse); // [1, 2, 3];
 * [1, null, 2, 3].filter(Boolean); // [1, 2, 3];
 *
 * @param {(T | false)} x Any value
 * @return {boolean} Return true for any non false value
 */
export const excludeFalse = (Boolean as any) as <T>(x: T | false) => x is T;

/**
 * `unique` will filter out any duplicate items from an array using `===`
 *
 * @example
 * unique([1, 1, 2, 3]); // [1, 2, 3]
 *
 * @param {array} arr Array to filter out duplicates from
 * @returns {array} Array with only unique items
 */
export const unique = <I>(arr: I[]): I[] =>
  arr.reduce<I[]>((acc, item) => {
    const exists = acc.findIndex(i => i === item) > -1;
    if (exists) return acc;
    return [...acc, item];
  }, []);

/**
 * `fileExists` will check to see if a file exists on disk. It will not check it
 * it's readable or writable, just if it exists.
 *
 * @example
 * const exists = await fileExists('./package.json');
 *
 * @param {string} path Path to check
 * @returns {Promise<boolean>} True if file is accessible on disk
 */
export const fileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * `hasCommand` checks if a command is available in the current `$PATH`.
 *
 * @example
 * await hasCommand('yarn');
 *
 * @param {string} cmd Terminal command to check for
 * @returns {boolean}
 */
export const hasCommand = async (cmd: string): Promise<boolean> => {
  try {
    const { stdout } = await execa('which', [cmd]);
    return fileExists(stdout.trim());
  } catch (err) {
    return false;
  }
};

/**
 * `detectPackageManager` will detect which package manager that should be used
 * in the current project.
 *
 * First it will check to see if either `yarn.lock` or `package-lock.json`
 * exists. If none esists the project will use `yarn` if that command exists,
 * otherwise falls back on `npm`.
 *
 * @example
 * await detectPackageManager(); // 'yarn' or 'npm'
 *
 * @returns {Promise<('yarn' | 'npm')>}
 */
export const detectPackageManager = async (): Promise<'yarn' | 'npm'> => {
  const packageJson = await readPkg();
  const pkgDir = packageJson.path ? dirname(packageJson.path) : process.cwd();

  const yarnLock = join(pkgDir, 'yarn.lock');
  const npmLock = join(pkgDir, 'package-lock.json');

  if (await fileExists(yarnLock)) return 'yarn';
  if (await fileExists(npmLock)) return 'npm';

  if (await hasCommand('yarn')) return 'yarn';
  if (await hasCommand('npm')) return 'npm';

  throw new Error(
    'Could not detect package manager. Neither yarn or npm seems to exist',
  );
};

export const runSerial = (tasks: (() => Promise<void>)[]): Promise<void> => {
  return tasks.reduce(async (chain, nextTask) => {
    await chain;
    return nextTask();
  }, Promise.resolve());
};
