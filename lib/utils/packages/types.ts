import { PackageJson } from 'read-pkg-up';

export interface Dependecies {
  dependencies: string[];
  devDependencies: string[];
}

export interface Files {
  output: string;
  template: string;
  data?: Record<string, any>;
}

export type PackageMethodParams = {
  packageJson: PackageJson;
  selectedPackages: PackageConfig[];
};

export type PackageMethod<R> =
  | ((params: PackageMethodParams) => Promise<R> | R)
  | R;

export interface PackageConfig {
  name: string;
  description?: string;
  getDependencies?: PackageMethod<Dependecies>;
  getFiles?: PackageMethod<Files[]>;
  getPackageJson?: PackageMethod<Partial<PackageJson>>;
  postSetupScripts?: PackageMethod<string[][]>;
}
