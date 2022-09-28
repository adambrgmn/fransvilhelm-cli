import os from 'node:os';
import path from 'node:path';

import { execa } from 'execa';
import { Box, Text, useApp } from 'ink';
import { matchSorter } from 'match-sorter';
import React, { Fragment, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQuery } from 'react-query';

import { Figure } from './components/Figure';
import { Input } from './components/Input';
import { SelectList, SelectListItem } from './components/SelectList';
import { SpinnerBox } from './components/Spinner';
import { Project } from './types';
import * as clipboard from './utils/clipboard';
import { findProjects } from './utils/find-projects';

const ROOTS = [path.join(os.homedir(), 'Developer')];

export const App: React.FC = () => {
  const app = useApp();
  const mutation = useMutation(
    async (project: Project) => {
      await execa('code', [project.path]);
      await clipboard.write(project.path);
      return project;
    },
    {
      onSuccess: () => {
        setTimeout(() => app.exit());
      },
      onError: (error) => {
        setTimeout(() => app.exit(error instanceof Error ? error : new Error('Unknown error')));
      },
    },
  );

  return (
    <Fragment>
      {mutation.status === 'idle' ? <Projects roots={ROOTS} onSelect={mutation.mutate} /> : null}
      {mutation.status === 'loading' ? <SpinnerBox /> : null}
      {mutation.status === 'success' ? <Success project={mutation.data} /> : null}
      {mutation.status === 'error' ? <Failure error={mutation.error} /> : null}
    </Fragment>
  );
};

const queryClient = new QueryClient();
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const Success: React.FC<{ project: Project }> = ({ project }) => {
  return (
    <Box flexDirection="column" paddingLeft={1}>
      <Text>
        <Figure i="tick" color="green" /> Project <Text color="blue">{project.name}</Text> opened in editor
      </Text>
      <Text>
        <Figure i="tick" color="green" /> Project path copied to clipboard:
        <Text color="blue"> {project.path.replace(os.homedir(), '~')}</Text>
      </Text>
    </Box>
  );
};

const Failure: React.FC<{ error: unknown }> = ({ error }) => {
  let message = error instanceof Error ? error.message : 'Unknown error';

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="gray">
          <Figure i="cross" color="red" /> An error occured while opening the project
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="red">{message}</Text>
      </Box>
      <Box>
        <Text color="gray">{JSON.stringify(error, null, 2)}</Text>
      </Box>
    </Box>
  );
};

interface ProjectsProps {
  roots: string[];
  onSelect: (project: Project) => void;
}

const Projects: React.FC<ProjectsProps> = ({ roots, onSelect }) => {
  let [filter, setFilter] = useState('');
  let query = useQuery(['projects', ...roots], () => findProjects(roots));

  let selectableItems = useMemo(() => {
    if (query.status !== 'success') return [];

    let projects = query.data.map<SelectListItem>((project) => {
      let parent = path.basename(path.basename(project.path.replace(`/${project.name}`, '')));
      return {
        value: project.path.replace(os.homedir(), '~'),
        label: (current) => (
          <Box key={project.path}>
            <Text color="gray">{parent}/</Text>
            <Text color={current ? 'green' : 'white'}>{project.name}</Text>
          </Box>
        ),
      };
    });

    if (filter === '') return projects;
    return matchSorter(projects, filter, { keys: ['value'] });
  }, [filter, query]);

  if (query.status === 'loading') return <SpinnerBox />;

  return (
    <Box flexDirection="column">
      <Input label="Filter:" value={filter} onChange={setFilter} />
      <SelectList
        items={selectableItems}
        onSelect={(value) => {
          let project = query.data?.find((p) => p.path === value);
          if (project != null) onSelect(project);
        }}
      />
    </Box>
  );
};
