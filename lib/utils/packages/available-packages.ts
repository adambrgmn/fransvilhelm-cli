import { excludeEmpty } from '../../utils';
import { getPeerDependecies } from './get-peer-dependecies';
import { PackageConfig } from './types';

const eslint: PackageConfig = {
  name: 'eslint',
  description: 'With eslint-config-react-app',
  getDependencies: async ({ hasPackage, hasInstalledDep }) => {
    let hasReactScripts = hasInstalledDep('react-scripts');
    let hasTypescript =
      hasPackage('typescript') || hasInstalledDep('typescript');

    let devDependencies: string[] = [];
    if (!hasReactScripts) {
      devDependencies = await getPeerDependecies('eslint-config-react-app');
    }

    if (!hasTypescript) {
      devDependencies = devDependencies.filter(
        (pkg) => !pkg.includes('@typescript-eslint'),
      );
    }

    return {
      dependencies: [],
      devDependencies,
    };
  },
  getPackageJson: () => ({
    scripts: {
      lint: 'eslint . --ext .ts --ext .tsx --ext .js',
    },
    eslintConfig: {
      extends: ['react-app', 'react-app/jest'],
    },
  }),
};

const jest: PackageConfig = {
  name: 'jest',
  description: 'With react-testing-library',
  getDependencies: async ({ hasPackage, hasInstalledDep }) => {
    let hasReactScripts = hasInstalledDep('react-scripts');
    let hasTypescript =
      hasPackage('typescript') || hasInstalledDep('typescript');

    return {
      dependencies: [],
      devDependencies: [
        // If the project is based on CRA we won't need to install jest, it's
        // bundled with react-scripts
        !hasReactScripts && 'jest',
        '@testing-library/jest-dom',
        '@testing-library/user-event',
        '@testing-library/react',
        ...(hasTypescript ? ['@types/jest'] : []),
        ...(!hasReactScripts && hasTypescript
          ? [
              '@babel/core',
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
            ]
          : []),
      ].filter(excludeEmpty),
    };
  },
  getPackageJson: ({ hasInstalledDep }) => {
    let hasReactScripts = hasInstalledDep('react-scripts');
    return hasReactScripts ? {} : { scripts: { test: 'jest' } };
  },
  getFiles: ({ hasPackage, hasInstalledDep }) => {
    let hasReactScripts = hasInstalledDep('react-scripts');
    let hasTypescript =
      hasPackage('typescript') || hasInstalledDep('typescript');

    if (hasReactScripts) return [];
    return [
      {
        template: 'assets/jest.config.js',
        output: 'jest.config.js',
      },
      hasTypescript && {
        template: 'assets/.babelrc',
        output: '.babelrc',
      },
    ].filter(excludeEmpty);
  },
};

const husky: PackageConfig = {
  name: 'husky',
  description: 'With lint-staged precommit hook',
  getDependencies: {
    dependencies: [],
    devDependencies: ['husky'],
  },
  getPackageJson: {
    scripts: {
      prepare: 'husky install',
    },
  },
  postSetupScripts: ({ hasPackage }) => {
    let hasLintStaged = hasPackage('lint-staged');

    if (hasLintStaged) {
      return [
        ['yarn', 'husky', 'add', '.husky/pre-commit', 'yarn run lint-staged'],
      ];
    }

    return [];
  },
};

const lintStaged: PackageConfig = {
  name: 'lint-staged',
  description: 'With prettier and eslint setup',
  getDependencies: {
    dependencies: [],
    devDependencies: ['lint-staged'],
  },
  getPackageJson: ({ hasPackage, hasInstalledDep }) => {
    const hasEslint = hasPackage('eslint') || hasInstalledDep('eslint');
    const hasPrettier = hasPackage('prettier') || hasInstalledDep('prettier');

    return {
      'lint-staged': {
        ...(hasEslint && {
          '*.{js,ts,jsx,tsx}': ['eslint --fix'],
        }),
        ...(hasPrettier && {
          '*.{js,ts,jsx,tsx,json,md,yml,html}': ['prettier --write'],
        }),
      },
    };
  },
};

const prettier: PackageConfig = {
  name: 'prettier',
  description: 'With basic rules',
  getDependencies: {
    dependencies: [],
    devDependencies: ['prettier'],
  },
  getPackageJson: {
    prettier: {
      singleQuote: true,
      trailingComma: 'all',
      proseWrap: 'always',
    },
  },
};

const typescript: PackageConfig = {
  name: 'typescript',
  description: 'With basic tsconfig.json',
  getDependencies: ({ hasInstalledDep }) => {
    let hasReact = hasInstalledDep('react');
    let hasReactDOM = hasInstalledDep('react-dom');

    return {
      dependencies: [],
      devDependencies: [
        'typescript',
        '@types/node',
        hasReact && '@types/react',
        hasReactDOM && '@types/react-dom',
      ].filter(excludeEmpty),
    };
  },
  getPackageJson: {
    scripts: {
      'type-check': 'tsc --noEmit',
    },
  },
  getFiles: [
    {
      template: 'assets/tsconfig.json',
      output: 'tsconfig.json',
    },
  ],
};

const microbundle: PackageConfig = {
  name: 'microbundle',
  description: 'Setup microbundle basics',
  getDependencies: {
    dependencies: [],
    devDependencies: ['microbundle'],
  },
  getPackageJson: {
    source: 'src/index.ts',
    main: 'dist/{{pkg.name}}.js',
    'umd:main': 'dist/{{pkg.name}}.umd.js',
    module: 'dist/{{pkg.name}}.esm.js',
    esmodule: 'dist/{{pkg.name}}.modern.js',
    types: 'dist/{{pkg.name}}.d.ts',
  },
};

const changesets: PackageConfig = {
  name: 'changesets',
  description: 'Setup changesets with GitHub actions',
  getDependencies: {
    dependencies: [],
    devDependencies: ['@changesets/cli', '@fransvilhelm/changeset-changelog'],
  },
  getPackageJson: {
    scripts: {
      release: 'yarn build && yarn changeset publish',
    },
  },
  getFiles: [
    {
      template: 'assets/changeset-config.json.hbs',
      output: '.changeset/config.json',
    },
    {
      template: 'assets/changeset-action.yml',
      output: '.github/workflows/release.yml',
    },
  ],
};

const pr: PackageConfig = {
  name: 'pr',
  description: 'PR workflow',
  getFiles: [
    {
      template: 'assets/pr-workflow.yml',
      output: '.github/workflows/pr.yml',
    },
  ],
};

export const packages: PackageConfig[] = [
  eslint,
  jest,
  husky,
  lintStaged,
  prettier,
  typescript,
  microbundle,
  changesets,
  pr,
];
