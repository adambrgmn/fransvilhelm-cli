import fs from 'fs';
import execa from 'execa';
import readPkg from 'read-pkg-up';
import { dirname, join } from 'path';
import { merge } from 'lodash';
import { Package, PackageJSON } from './packages';
import { TaskDefinition } from '../hooks/use-task-runner';
import { unique, detectPackageManager } from '../utils';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

const packagesToTasks = async (
  packages: Package[],
): Promise<TaskDefinition[]> => {
  const packageJson = await readPkg();
  const pkgDir = packageJson.path ? dirname(packageJson.path) : process.cwd();
  const pkgPath = packageJson.path || join(process.cwd(), 'package.json');

  const configs = await Promise.all(
    packages.map(p => p.getConfig(packages, packageJson.pkg as PackageJSON)),
  );

  const installPackages: TaskDefinition = {
    name: 'Install packages',
    description: 'Install dev dependencies',
    action: async () => {
      const dependencies = configs.flatMap(config => config.packages || []);
      const uniqueDeps = unique(dependencies);
      const packageManager = await detectPackageManager();
      const args = [];

      if (packageManager === 'npm') {
        args.push('install', '--save-dev');
      } else {
        args.push('add', '--dev');
      }

      await execa(packageManager, [...args, ...uniqueDeps], { cwd: pkgDir });
    },
  };

  const updatePackageJson: TaskDefinition = {
    name: 'Update package.json',
    description: 'Add configs to package.json',
    action: async () => {
      const currentPackageJson = JSON.parse(await readFile(pkgPath, 'utf-8'));

      const packageJsonConfigs = configs.flatMap(
        config => config.packageJson || {},
      );

      const newPackageJson = merge(currentPackageJson, ...packageJsonConfigs);

      const keyOrder = unique([
        'name',
        'version',
        'description',
        'main',
        'module',
        'umd:main',
        'source',
        'types',
        'repository',
        'author',
        'homepage',
        'license',
        'private',
        'workspaces',
        'bin',
        'files',
        'keywords',
        'engines',
        'scripts',
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'publishConfig',
        'config',
        ...Object.keys(newPackageJson),
      ]);

      const orderedPackageJson = keyOrder.reduce((acc, key) => {
        const value = newPackageJson[key];
        if (value) return { ...acc, [key]: value };
        return acc;
      }, {});

      await writeFile(pkgPath, JSON.stringify(orderedPackageJson, null, 2));
    },
  };

  const createConfigFiles: TaskDefinition = {
    name: 'Create config files',
    description: 'Write out config files',
    action: async () => {
      const files = configs.flatMap(config => config.files || []);
      await Promise.all(
        files.map(({ path, content }) =>
          writeFile(join(pkgDir, path), content),
        ),
      );
    },
  };
  return [installPackages, updatePackageJson, createConfigFiles];
};

export { packagesToTasks };
