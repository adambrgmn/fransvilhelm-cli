import { readdir, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import git from 'git-repo-info';

import { Project } from '../types';

export async function findProjects(roots: string[]): Promise<Project[]> {
  let projects: Project[] = [];
  let projectPaths = (
    await Promise.all(
      roots.map((root) => {
        return readdirRecursive(path.isAbsolute(root) ? root : path.join(os.homedir(), root), (_, contents) =>
          contents.includes('.git'),
        );
      }),
    )
  )
    .flat()
    .sort();

  for (let projectPath of projectPaths) {
    let info = git(projectPath);

    projects.push({
      name: path.basename(projectPath),
      path: projectPath,
      branch: info.branch,
    });

    if (projectPath.endsWith('klarna-app')) {
      for (let subfolder of ['clients', 'services']) {
        projects.push({
          name: path.join(path.basename(projectPath), subfolder),
          path: path.join(projectPath, subfolder),
          branch: info.branch,
        });
      }
    }
  }

  return projects;
}

type KeepFn = (path: string, contents: string[]) => boolean;

async function readdirRecursive(root: string, keep: KeepFn): Promise<string[]> {
  let result: string[] = [];

  let contents = await readdir(root);
  let directories = await filter(contents, (item) => stat(path.join(root, item)).then((stat) => stat.isDirectory()));

  let childProjects: string[][] = [];
  if (keep(root, contents)) {
    result.push(root);
  } else {
    childProjects = await Promise.all(directories.map((dirPath) => readdirRecursive(path.join(root, dirPath), keep)));
  }

  return [...result, ...childProjects.flat()];
}

async function filter<T>(list: T[], predicate: (item: T) => Promise<boolean>): Promise<T[]> {
  const results = await Promise.all(list.map(predicate));
  return list.filter((_, index) => results[index]);
}
