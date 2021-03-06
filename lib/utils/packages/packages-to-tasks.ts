import { promises as fs } from 'fs';
import { dirname, join } from 'path';

import readPkgUp, { PackageJson } from 'read-pkg-up';
import execa from 'execa';
import { uniq, merge } from 'lodash';
import Handlebars from 'handlebars';

import { Task } from '../../hooks/use-tasks';
import {
  detectPackageManager,
  PackageManager,
  excludeEmpty,
  extractGithubRepo,
} from '../../utils';
import {
  PackageConfig,
  Dependecies,
  Files,
  PackageMethodParams,
} from './types';

export const packagesToTasks = (selectedPackages: PackageConfig[]): Task[] => {
  let installDependencies: Task = {
    name: 'Install packages',
    description: 'Install dev and prod dependencies',
    action: async () => {
      let { packageJson, path } = await readPkgSafe();
      let packageManager = await detectPackageManager();

      let install = packageManager === PackageManager.npm ? 'install' : 'add';
      let dev = packageManager === PackageManager.npm ? '--save-dev' : '--dev';

      let allDependecies = await getConfig('getDependencies', {
        packageJson,
        selectedPackages,
      });

      let deps: Dependecies = {
        dependencies: [],
        devDependencies: [],
      };

      for (let { dependencies, devDependencies } of allDependecies) {
        deps.dependencies.push(...dependencies);
        deps.devDependencies.push(...devDependencies);
      }

      if (deps.dependencies.length > 0) {
        await execa(packageManager, [install, ...uniq(deps.dependencies)], {
          cwd: dirname(path),
        });
      }

      if (deps.devDependencies.length > 0) {
        await execa(
          packageManager,
          [install, dev, ...uniq(deps.devDependencies)],
          { cwd: dirname(path) },
        );
      }
    },
  };

  let updatePackageJson: Task = {
    name: 'Update package.json',
    description: 'Add configs to package.json',
    action: async () => {
      let { packageJson, path } = await readPkgSafe();

      let allConfigs = await getConfig('getPackageJson', {
        packageJson,
        selectedPackages,
      });

      let mergedConfig = allConfigs.reduce<PackageJson>(
        (acc, curr) => merge(acc, curr),
        packageJson,
      );

      let keyOrder: (keyof PackageJson)[] = uniq([
        'name',
        'version',
        'description',
        'source',
        'main',
        'module',
        'esmodule',
        'umd:main',
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
        ...Object.keys(mergedConfig).sort(),
      ]);

      let ignoredKeys: (keyof PackageJson)[] = ['readme', '_id'];

      let orderedPackageJson: PackageJson = {};
      for (let key of keyOrder) {
        if (!ignoredKeys.includes(key)) {
          orderedPackageJson[key] = mergedConfig[key];
        }
      }

      let content = template(
        JSON.stringify(orderedPackageJson, null, 2) + '\n',
        packageJson,
      );

      await fs.writeFile(path, content);
    },
  };

  let createConfigFiles: Task = {
    name: 'Create config files',
    description: 'Write out config files',
    action: async () => {
      let { packageJson, path } = await readPkgSafe();
      let cli = await readPkgSafe({ cwd: __dirname });

      let allFiles = (
        await getConfig('getFiles', { packageJson, selectedPackages })
      ).flat();

      let projectBase = dirname(path);
      let cliBase = dirname(cli.path);
      await Promise.all(
        allFiles.map(async (fileConfig) => {
          let content = await fs.readFile(
            join(cliBase, fileConfig.template),
            'utf-8',
          );

          if (fileConfig.template.includes('.hbs')) {
            content = template(content, packageJson);
          }

          await fs.mkdir(dirname(fileConfig.output), { recursive: true });
          await fs.writeFile(join(projectBase, fileConfig.output), content);
        }),
      );
    },
  };

  let runPostSetupScripts: Task = {
    name: 'Run post setup scripts',
    description: 'Run necessary scripts',
    action: async () => {
      let { packageJson, path } = await readPkgSafe();
      let allScripts = (
        await getConfig('postSetupScripts', { packageJson, selectedPackages })
      ).flat(1);

      for (let [program, ...args] of allScripts) {
        await execa(program, args, { cwd: dirname(path) });
      }
    },
  };

  return [
    installDependencies,
    updatePackageJson,
    createConfigFiles,
    runPostSetupScripts,
  ];
};

async function readPkgSafe(
  options?: readPkgUp.NormalizeOptions,
): Promise<readPkgUp.ReadResult> {
  let result = await readPkgUp(options);
  if (result == null) {
    throw new Error('Could not find package.json in your project');
  }

  return result;
}

async function getConfig(
  key: 'getDependencies',
  params: Pick<PackageMethodParams, 'packageJson' | 'selectedPackages'>,
): Promise<Dependecies[]>;
async function getConfig(
  key: 'getPackageJson',
  params: Pick<PackageMethodParams, 'packageJson' | 'selectedPackages'>,
): Promise<Partial<PackageJson>[]>;
async function getConfig(
  key: 'getFiles',
  params: Pick<PackageMethodParams, 'packageJson' | 'selectedPackages'>,
): Promise<Files[][]>;
async function getConfig(
  key: 'postSetupScripts',
  params: Pick<PackageMethodParams, 'packageJson' | 'selectedPackages'>,
): Promise<string[][][]>;
async function getConfig(
  key: keyof Omit<PackageConfig, 'name' | 'description'>,
  params: Pick<PackageMethodParams, 'packageJson' | 'selectedPackages'>,
) {
  let result = await Promise.all(
    params.selectedPackages.map(async (config) => {
      let method = config[key];
      if (method == null) return undefined;
      if (typeof method === 'function') {
        return method({
          ...params,
          hasInstalledDep(dep) {
            return (
              params.packageJson.dependencies?.[dep] != null ||
              params.packageJson.devDependencies?.[dep] != null
            );
          },
          hasPackage(pkg) {
            return (
              params.selectedPackages.findIndex((p) => p.name === pkg) > -1
            );
          },
        });
      }

      return method;
    }),
  );

  return result.filter(excludeEmpty);
}

function template(src: string, pkg: PackageJson) {
  let github: { user: string; repo: string } | void;
  if (typeof pkg.repository === 'string') {
    github = extractGithubRepo(pkg.repository);
  } else if (pkg.repository != null) {
    github = extractGithubRepo(pkg.repository.url);
  }

  let templ = Handlebars.compile(src);
  let result = templ({ pkg, github });

  return result;
}
