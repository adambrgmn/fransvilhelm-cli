import fs from 'fs';
import { promisify } from 'util';
import { join } from 'path';
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
  packageJson: PackageJSON,
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
  getConfig: async (_, packageJson: PackageJSON): Promise<PackageConfig> => {
    const content = await readFile(
      join(__dirname, './templates/tsconfig.json'),
      'utf-8',
    );

    const hasReact = packageJson.dependencies.react != null;
    const hasReactDOM = packageJson.dependencies['react-dom'] != null;
    const hasJest = packageJson.devDependencies.jest != null;

    return {
      packages: [
        'typescript',
        '@types/node',
        hasReact && '@types/react',
        hasReactDOM && '@types/react-dom',
        hasJest && '@types/jest',
      ].filter(excludeFalse),
      files: [{ path: 'tsconfig.json', content }],
    };
  },
};

export const packages: Package[] = [
  eslint,
  husky,
  lintStaged,
  prettier,
  commitizen,
  typescript,
];
