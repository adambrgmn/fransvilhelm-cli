import fs from 'fs';
import execa from 'execa';
import readPkg, { PackageJson } from 'read-pkg-up';
import { dirname, join } from 'path';
import { merge, flatMap } from 'lodash';
import { promisify } from 'util';
import { Package } from './packages';
import { TaskDefinition } from '../hooks/use-task-runner';
import { unique, detectPackageManager, PackageManager } from '../utils';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

const packagesToTasks = async (
  packages: Package[],
): Promise<TaskDefinition[]> => {
  const packageJson = await readPkg();
  if (!packageJson) throw new Error('No package.json found for project');

  const pkgDir = packageJson.path ? dirname(packageJson.path) : process.cwd();
  const pkgPath = packageJson.path || join(process.cwd(), 'package.json');

  const configs = await Promise.all(
    packages.map((p) =>
      p.getConfig(packages, packageJson.packageJson as PackageJson),
    ),
  );

  const installPackages: TaskDefinition = {
    name: 'Install packages',
    description: 'Install dev dependencies',
    action: async () => {
      const dependencies = flatMap(configs, (config) => config.packages || []);
      const uniqueDeps = unique(dependencies);
      const packageManager = await detectPackageManager();
      const args = [];

      if (packageManager === PackageManager.npm) {
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

      const packageJsonConfigs = flatMap(
        configs,
        (config) => config.packageJson || {},
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

      await writeFile(
        pkgPath,
        JSON.stringify(orderedPackageJson, null, 2) + '\n',
      );
    },
  };

  const createConfigFiles: TaskDefinition = {
    name: 'Create config files',
    description: 'Write out config files',
    action: async () => {
      const files = flatMap(configs, (config) => config.files || []);
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
