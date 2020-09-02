import { PackageJson } from 'read-pkg-up';
import { excludeEmpty } from '../../utils';
import { getPeerDependecies } from './get-peer-dependecies';
import { PackageConfig } from './types';

const eslint: PackageConfig = {
  name: 'eslint',
  description: 'With eslint-config-react-app',
  getDependencies: async ({ packageJson, selectedPackages }) => {
    let hasReactScripts = hasInstalledPackage('react-scripts', packageJson);
    let hasTypescript = hasPackage('typescript', {
      packageJson,
      selectedPackages,
    });

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
    eslintConfig: {
      extends: 'react-app',
    },
  }),
};

const jest: PackageConfig = {
  name: 'jest',
  description: 'With react-testing-library',
  getDependencies: async ({ packageJson, selectedPackages }) => {
    let hasReactScripts = hasInstalledPackage('react-scripts', packageJson);
    let hasTypescript = hasPackage('typescript', {
      packageJson,
      selectedPackages,
    });

    return {
      dependencies: [],
      devDependencies: [
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
      ].filter(excludeEmpty),
    };
  },
  getPackageJson: (packageJson) => {
    let hasReactScripts = hasInstalledPackage('react-scripts', packageJson);
    return hasReactScripts ? {} : { scripts: { test: 'jest' } };
  },
  getFiles: ({ packageJson, selectedPackages }) => {
    let hasReactScripts = hasInstalledPackage('react-scripts', packageJson);
    let hasTypescript = hasPackage('typescript', {
      packageJson,
      selectedPackages,
    });

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
  getPackageJson: ({ packageJson, selectedPackages }) => {
    let hasLintStaged = hasPackage('lint-staged', {
      packageJson,
      selectedPackages,
    });

    if (!hasLintStaged) return { husky: { hooks: {} } };

    return {
      husky: {
        hooks: {
          'pre-commit': 'lint-staged',
        },
      },
    };
  },
};

const lintStaged: PackageConfig = {
  name: 'lint-staged',
  description: 'With prettier setup',
  getDependencies: {
    dependencies: [],
    devDependencies: ['lint-staged'],
  },
  getPackageJson: ({ selectedPackages }) => {
    const hasPrettier = hasSelectedPackage('prettier', selectedPackages);

    return {
      'lint-staged': {
        ...(hasPrettier && {
          '*.{js,ts,jsx,tsx}': ['eslint --fix'],
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
  getDependencies: (packageJson) => {
    let hasReact = hasInstalledPackage('react', packageJson);
    let hasReactDOM = hasInstalledPackage('react-dom', packageJson);

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
  getFiles: [
    {
      template: 'assets/tsconfig.json',
      output: 'tsconfig.json',
    },
  ],
};

const commitizen: PackageConfig = {
  name: 'commitizen',
  description: 'With cz-conventional-changelog',
  getDependencies: {
    dependencies: [],
    devDependencies: ['cz-conventional-changelog'],
  },
  getPackageJson: {
    config: {
      commitizen: { path: 'cz-conventional-changelog' },
    },
  },
};

const semanticRelease: PackageConfig = {
  name: 'semantic-release',
  description: 'With basic Travis CI config',
  getDependencies: {
    dependencies: [],
    devDependencies: ['semantic-release'],
  },
  getPackageJson: {
    scripts: { 'semantic-release': 'semantic-release' },
    publishConfig: { access: 'public' },
  },
  getFiles: [
    {
      template: 'assets/.travis.yml',
      output: '.travis.yml',
    },
  ],
};

const netlify: PackageConfig = {
  name: 'netlify',
  description: 'With basic SPA config',
  getFiles: [
    {
      template: 'assets/netlify.toml',
      output: 'netlify.toml',
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
  commitizen,
  semanticRelease,
  netlify,
];

// ------- Utils
function hasPackage(
  pkgName: string,
  {
    packageJson,
    selectedPackages,
  }: { packageJson: PackageJson; selectedPackages: PackageConfig[] },
): boolean {
  return (
    hasSelectedPackage(pkgName, selectedPackages) ||
    hasInstalledPackage(pkgName, packageJson)
  );
}

function hasInstalledPackage(
  pkgName: string,
  packageJson: PackageJson,
): boolean {
  return (
    packageJson.dependencies?.[pkgName] != null ||
    packageJson.devDependencies?.[pkgName] != null
  );
}

function hasSelectedPackage(
  pkgName: string,
  selectedPackages: PackageConfig[],
): boolean {
  return selectedPackages.findIndex((p) => p.name === pkgName) > -1;
}
