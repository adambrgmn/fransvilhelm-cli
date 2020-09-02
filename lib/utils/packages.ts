import fs from 'fs';
import { promisify } from 'util';
import { join, dirname } from 'path';
import readPkg, { PackageJson } from 'read-pkg-up';
import { excludeFalse } from '../utils';
import { packageWithPeers } from './package-with-peers';

export interface ConfigFile {
  path: string;
  content: string;
}

export interface PackageConfig {
  packages?: string[];
  packageJson?: { [x: string]: any };
  files?: ConfigFile[];
}

export type GetConfigFn = (
  selectedPackages: Package[],
  packageJson?: PackageJson,
) => PackageConfig | Promise<PackageConfig>;

export interface Package {
  name: string;
  description: string;
  getConfig: GetConfigFn;
}

const readFile = promisify(fs.readFile);

const readAsset = async (filename: string): Promise<string> => {
  const pkg = await readPkg({ cwd: __dirname });
  if (!pkg) throw new Error('Could not read package data');

  const content = await readFile(
    join(dirname(pkg.path), './assets', filename),
    'utf-8',
  );

  return content;
};

const hasInstalledPackage = (
  pkgName: string,
  packageJson?: PackageJson,
): boolean => {
  return (
    packageJson?.dependencies?.[pkgName] != null &&
    packageJson?.devDependencies?.[pkgName] != null
  );
};

const hasSelectedPackage = (
  pkgName: string,
  selectedPackages: Package[],
): boolean => {
  return selectedPackages.findIndex((p) => p.name === pkgName) > -1;
};

const eslint: Package = {
  name: 'eslint',
  description: 'With eslint-config-react-app',
  getConfig: async (selectedPackages, packageJson) => {
    const hasTypescript =
      hasSelectedPackage(typescript.name, selectedPackages) ||
      hasInstalledPackage('typescript', packageJson);
    const hasReactScripts = hasInstalledPackage('react-scripts', packageJson);

    let packages: string[] = [];
    if (!hasReactScripts) {
      packages = await packageWithPeers('eslint-config-react-app');

      if (!hasTypescript) {
        packages = packages.filter(
          (pkg) => !pkg.includes('@typescripts-eslint'),
        );
      }
    }

    return {
      packages,
      packageJson: {
        eslintConfig: {
          extends: 'react-app',
        },
      },
    };
  },
};

const jest: Package = {
  name: 'jest',
  description: 'With react-testing-library',
  getConfig: async (selectedPackages, packageJson) => {
    const hasTypescript =
      hasSelectedPackage(typescript.name, selectedPackages) ||
      hasInstalledPackage('typescript', packageJson);
    const hasReactScripts = hasInstalledPackage('react-scripts', packageJson);

    return {
      packages: [
        // If the project is based on CRA we won't need to install jest, it's
        // bundled with react-scripts
        !hasReactScripts && 'jest',
        '@testing-library/jest-dom',
        '@testing-library/react',
        ...(hasTypescript
          ? [
              '@types/jest',
              '@types/testing-library__jest-dom',
              '@types/testing-library__react',
            ]
          : []),
        ...(!hasReactScripts && hasTypescript
          ? [
              '@babel/core',
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
            ]
          : []),
      ].filter(excludeFalse),
      packageJson: !hasReactScripts ? { scripts: { test: 'jest' } } : {},
      files: [
        !hasReactScripts && {
          path: 'jest.config.js',
          content: await readAsset('jest.config.js'),
        },
        !hasReactScripts &&
          hasTypescript && {
            path: '.babelrc',
            content: await readAsset('.babelrc'),
          },
      ].filter(excludeFalse),
    };
  },
};

const husky: Package = {
  name: 'husky',
  description: 'With lint-staged precommit hook',
  getConfig: (selectedPackages) => {
    const hasLintStaged = hasSelectedPackage(lintStaged.name, selectedPackages);

    return {
      packages: ['husky'],
      packageJson: {
        husky: {
          ...(hasLintStaged && {
            hooks: {
              'pre-commit': 'lint-staged',
            },
          }),
        },
      },
    };
  },
};

const lintStaged: Package = {
  name: 'lint-staged',
  description: 'With prettier setup',
  getConfig: (selectedPackages) => {
    const hasPrettier = hasSelectedPackage(prettier.name, selectedPackages);

    return {
      packages: ['lint-staged'],
      packageJson: {
        'lint-staged': {
          ...(hasPrettier && {
            '*.{js,ts,jsx,tsx}': ['eslint --fix'],
            '*.{js,ts,jsx,tsx,json,md,yml,html}': ['prettier --write'],
          }),
        },
      },
    };
  },
};

const prettier: Package = {
  name: 'prettier',
  description: 'With basic rules',
  getConfig: () => ({
    packages: ['prettier'],
    packageJson: {
      prettier: {
        singleQuote: true,
        trailingComma: 'all',
        proseWrap: 'always',
      },
    },
  }),
};

const typescript: Package = {
  name: 'typescript',
  description: 'With basic tsconfig.json',
  getConfig: async (_, packageJson) => {
    const hasReact = hasInstalledPackage('react', packageJson);
    const hasReactDOM = hasInstalledPackage('react-dom', packageJson);

    return {
      packages: [
        'typescript',
        '@types/node',
        hasReact && '@types/react',
        hasReactDOM && '@types/react-dom',
      ].filter(excludeFalse),
      files: [
        { path: 'tsconfig.json', content: await readAsset('tsconfig.json') },
      ],
    };
  },
};

const commitizen: Package = {
  name: 'commitizen',
  description: 'With cz-conventional-changelog',
  getConfig: () => ({
    packages: ['cz-conventional-changelog'],
    packageJson: {
      config: {
        commitizen: {
          path: 'cz-conventional-changelog',
        },
      },
    },
  }),
};

const semanticRelease: Package = {
  name: 'semantic-release',
  description: 'With basic Travis CI config',
  getConfig: async () => {
    return {
      packages: ['semantic-release'],
      packageJson: {
        scripts: { 'semantic-release': 'semantic-release' },
        publishConfig: { access: 'public' },
      },
      files: [{ path: '.travis.yml', content: await readAsset('.travis.yml') }],
    };
  },
};

const netlify: Package = {
  name: 'netlify',
  description: 'With basic SPA config',
  getConfig: async () => {
    return {
      files: [
        { path: 'netlify.toml', content: await readAsset('netlify.toml') },
      ],
    };
  },
};

export const packages: Package[] = [
  eslint,
  jest,
  husky,
  lintStaged,
  prettier,
  typescript,
  commitizen,
  semanticRelease,
  netlify,
];
