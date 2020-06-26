import axios from 'axios';
import { PackageJSON } from './packages';

const fetchPkgJson = async (pkg: string): Promise<PackageJSON> => {
  const { data } = await axios.get<PackageJSON>(
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

  return [pkgConfig.name, ...peerDeps];
};
