import fs from 'fs';
import { promisify } from 'util';
import { join, dirname } from 'path';
import readPkg from 'read-pkg-up';
import { excludeFalse } from '../utils';

const readFile = promisify(fs.readFile);

export interface PackageJSON {
  name: string;
  version: string;
  dependencies: {
    [packageName: string]: string;
  };
  devDependencies: {
    [packageName: string]: string;
  };
  [x: string]: any;
}

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
  packageJson?: PackageJSON,
) => PackageConfig | Promise<PackageConfig>;

export interface Package {
  name: string;
  description: string;
  getConfig: GetConfigFn;
}

const eslint: Package = {
  name: 'eslint',
  description: 'With eslint-config-react-app',
  getConfig: (selectedPackages: Package[]): PackageConfig => {
    const hasTypescript =
      selectedPackages.findIndex(p => p.name === typescript.name) > -1;
    return {
      packages: [
        'eslint-config-react-app@4.0.0',
        'babel-eslint@10.x',
        'eslint@5.x',
        'eslint-plugin-flowtype@2.x',
        'eslint-plugin-import@2.x',
        'eslint-plugin-jsx-a11y@6.x',
        'eslint-plugin-react@7.x',
        'eslint-plugin-react-hooks@1.5.0',
        hasTypescript && '@typescript-eslint/eslint-plugin@1.x',
        hasTypescript && '@typescript-eslint/parser@1.x',
      ].filter(excludeFalse),
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
  getConfig: async (selectedPackages: Package[]): Promise<PackageConfig> => {
    const pkg = await readPkg({ cwd: __dirname });
    const hasTypescript =
      selectedPackages.findIndex(p => p.name === typescript.name) > -1;

    const jestConfigContent = await readFile(
      join(dirname(pkg.path), './assets/jest.config.js'),
      'utf-8',
    );

    return {
      packages: [
        'jest',
        'jest-dom',
        'react-testing-library',
        hasTypescript && 'ts-jest',
        hasTypescript && '@types/jest',
      ].filter(excludeFalse),
      packageJson: {
        script: {
          test: 'jest',
        },
      },
      files: [{ path: 'jest.config.js', content: jestConfigContent }],
    };
  },
};

const husky: Package = {
  name: 'husky',
  description: 'With lint-staged precommit hook',
  getConfig: (selectedPackages: Package[]): PackageConfig => {
    const hasLintStaged =
      selectedPackages.findIndex(p => p.name === lintStaged.name) > -1;

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
  getConfig: (selectedPackages: Package[]): PackageConfig => {
    const hasPrettier =
      selectedPackages.findIndex(p => p.name === prettier.name) > -1;

    return {
      packages: ['lint-staged'],
      packageJson: {
        'lint-staged': {
          concurrent: false,
          linters: {
            ...(hasPrettier && {
              '*.{js,ts,jsx,tsx,json,md,yml}': ['prettier --write', 'git add'],
            }),
          },
        },
      },
    };
  },
};

const prettier: Package = {
  name: 'prettier',
  description: 'With basic rules',
  getConfig: (): PackageConfig => ({
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

const commitizen: Package = {
  name: 'commitizen',
  description: 'With cz-conventional-changelog',
  getConfig: (): PackageConfig => ({
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

const typescript: Package = {
  name: 'typescript',
  description: 'With basic tsconfig.json',
  getConfig: async (_, packageJson?: PackageJSON): Promise<PackageConfig> => {
    const pkg = await readPkg({ cwd: __dirname });

    const content = await readFile(
      join(dirname(pkg.path), './assets/tsconfig.json'),
      'utf-8',
    );

    const hasReact =
      packageJson != null &&
      packageJson.dependencies != null &&
      packageJson.dependencies.react != null;
    const hasReactDOM =
      packageJson != null &&
      packageJson.dependencies != null &&
      packageJson.dependencies['react-dom'] != null;

    return {
      packages: [
        'typescript',
        '@types/node',
        hasReact && '@types/react',
        hasReactDOM && '@types/react-dom',
      ].filter(excludeFalse),
      files: [{ path: 'tsconfig.json', content }],
    };
  },
};

export const packages: Package[] = [
  eslint,
  jest,
  husky,
  lintStaged,
  prettier,
  commitizen,
  typescript,
];
