import { promises as fs, constants } from 'fs';
import { dirname, join } from 'path';

import execa from 'execa';
import readPkg from 'read-pkg-up';

export function excludeEmpty<T>(item: T | null | undefined | false): item is T {
  return item != null && !!item;
}

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
    await fs.access(path, constants.F_OK);
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

export enum PackageManager {
  npm = 'npm',
  yarn = 'yarn',
}

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
 * @returns {Promise<PackageManager>}
 */
export const detectPackageManager = async (): Promise<PackageManager> => {
  const packageJson = await readPkg();
  const pkgDir = packageJson?.path ? dirname(packageJson.path) : process.cwd();

  const yarnLock = join(pkgDir, 'yarn.lock');
  const npmLock = join(pkgDir, 'package-lock.json');

  if (await fileExists(yarnLock)) return PackageManager.yarn;
  if (await fileExists(npmLock)) return PackageManager.npm;

  if (await hasCommand('yarn')) return PackageManager.yarn;
  if (await hasCommand('npm')) return PackageManager.npm;

  throw new Error(
    'Could not detect package manager. Neither yarn or npm seems to exist',
  );
};

export const extractGithubRepo = (
  repoUrl: string,
): { user: string; repo: string } | void => {
  try {
    if (!repoUrl.endsWith('.git')) return;

    let match = repoUrl.match(/(\w|-|_)+\/(\w|-|_)+\.git$/);
    if (match == null) return;
    const [user, repo] = match[0].replace('.git', '').split('/');

    return { user, repo };
  } catch (error) {
    return;
  }
};
