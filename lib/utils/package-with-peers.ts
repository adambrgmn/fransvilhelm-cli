import axios from 'axios';
import { PackageJson } from 'read-pkg-up';

const fetchPkgJson = async (pkg: string): Promise<PackageJson> => {
  const { data } = await axios.get<PackageJson>(
    `https://unpkg.com/${pkg}/package.json`,
  );

  return data;
};

export const packageWithPeers = async (pkg: string): Promise<string[]> => {
  let pkgConfig = await fetchPkgJson(pkg);
  let peerDeps = await Promise.all(
    Object.entries(pkgConfig.peerDependencies ?? {}).map(([peer, version]) => {
      return fetchPkgJson(`${peer}@${version}`).then(
        (peerConfig) => `${peerConfig.name}@^${peerConfig.version}`,
      );
    }),
  );

  return [pkgConfig.name!, ...peerDeps];
};
